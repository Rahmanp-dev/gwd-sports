import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
import OutboundMessage, { type MessageStatus } from '@/lib/models/OutboundMessage';
import { explainMessage, MESSAGE_STATUS_GROUPS } from '@/lib/messaging/explain';
import { configFromEnv } from '@/lib/messaging/scheduling';
import { TEMPLATES } from '@/lib/messaging/templates';

/**
 * The owner-facing message log.
 *
 * Every message the platform has ever built for a parent is a row here,
 * including the ones it decided not to send. That is the point: "why didn't
 * this send?" was previously only answerable by reading code, which meant in
 * practice it was not answerable at all.
 *
 * The explanation is computed HERE and not in the React component. The wording
 * encodes policy — a deferral is not a drop, a no-provider skip is not a
 * failure — and policy stated in a component drifts the first time someone
 * restyles the table. See lib/messaging/explain.ts.
 */

/** Escapes user input before it reaches a RegExp. Search must not be a DoS. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { searchParams } = new URL(req.url);

    const filter: Record<string, unknown> = {};

    // Tenant isolation, identical to the alerts route: super admins see the
    // whole platform, an academy admin sees only their own parents' messages.
    // A parent's phone number and a rendered message body are both personal
    // data, so this check is not optional.
    const isSuperAdmin = auth.user.role === 'gwd_super_admin';
    if (!isSuperAdmin) {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'Your account is not linked to an academy.' },
          { status: 403 }
        );
      }
      filter.academyId = auth.academyId;
    } else {
      // A super admin looking at every tenant at once needs to be able to
      // narrow to one, otherwise the log is unreadable past the first page.
      // Ignored for an academy admin — their scope is already fixed above and
      // must not be overridable from a query string.
      const academyId = searchParams.get('academyId');
      if (academyId && academyId !== 'all' && mongoose.Types.ObjectId.isValid(academyId)) {
        filter.academyId = academyId;
      }
    }

    // --- Filters ------------------------------------------------------------

    // `status` accepts either a group name ("problem") or a raw status
    // ("failed"), because the filter chips speak in groups but a link from an
    // alert wants to land on one exact status.
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== 'all') {
      const group = MESSAGE_STATUS_GROUPS[statusParam];
      filter.status = group ? { $in: group } : (statusParam as MessageStatus);
    }

    const channel = searchParams.get('channel');
    if (channel && channel !== 'all') filter.channel = channel;

    const templateKey = searchParams.get('templateKey');
    if (templateKey && templateKey !== 'all') filter.templateKey = templateKey;

    const passportId = searchParams.get('passportId');
    if (passportId) filter.passportId = passportId.toUpperCase().trim();

    // One free-text box over the three things an owner knows off the top of
    // their head: the child's name, the parent's number, the passport id.
    const q = searchParams.get('q')?.trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ recipientName: rx }, { recipientPhone: rx }, { passportId: rx }];
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from && !Number.isNaN(Date.parse(from))) range.$gte = new Date(from);
      if (to && !Number.isNaN(Date.parse(to))) range.$lte = new Date(to);
      if (Object.keys(range).length) filter.createdAt = range;
    }

    // --- Pagination ---------------------------------------------------------

    const page = Math.max(Number(searchParams.get('page')) || 1, 1);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 200);
    const skip = (page - 1) * limit;

    // The status counts deliberately ignore the status filter — the chips have
    // to keep showing "12 failed" while you are looking at the sent ones,
    // otherwise selecting a chip hides the evidence for every other chip.
    const { status: _status, ...filterWithoutStatus } = filter;

    // Only a super admin sees rows from more than one academy, so the join is
    // only worth paying for in that case.
    const listQuery = OutboundMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-variableMap');
    if (isSuperAdmin) listQuery.populate({ path: 'academyId', select: 'name' });

    const [messages, total, statusCounts, academies] = await Promise.all([
      listQuery.lean(),
      OutboundMessage.countDocuments(filter),
      OutboundMessage.aggregate([
        { $match: filterWithoutStatus },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      isSuperAdmin ? Academy.find({}).select('name').sort({ name: 1 }).lean() : [],
    ]);

    const config = configFromEnv();
    const now = new Date();

    const rows = messages.map((message: any) => ({
      ...message,
      explanation: explainMessage(message, config, now),
    }));

    // Flatten the aggregate into both the raw statuses and the four buckets the
    // filter chips use, so the client does no arithmetic.
    const byStatus: Record<string, number> = {};
    for (const row of statusCounts as { _id: string; count: number }[]) {
      byStatus[row._id] = row.count;
    }
    const byGroup: Record<string, number> = {};
    for (const [group, statuses] of Object.entries(MESSAGE_STATUS_GROUPS)) {
      byGroup[group] = statuses.reduce((sum, status) => sum + (byStatus[status] ?? 0), 0);
    }
    const allCount = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      data: {
        messages: rows,
        pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
        counts: { all: allCount, byStatus, byGroup },
        // Present only for a super admin, and the client keys the academy
        // column off its presence rather than off a role check of its own.
        academies: isSuperAdmin
          ? (academies as any[]).map((a) => ({ _id: String(a._id), name: a.name }))
          : null,
        // The template list drives the dropdown. Sourced from the registry
        // rather than a distinct() over the collection, so a template that has
        // never been used is still filterable.
        templates: Object.values(TEMPLATES).map((t) => ({
          key: t.key,
          description: t.description,
          priority: t.priority,
        })),
        // Surfaced so the UI can state the actual cap rather than hardcoding
        // "3 a day" and being wrong the moment the env var changes.
        schedulingConfig: {
          dailyBudget: config.dailyBudget,
          paymentReserve: config.paymentReserve,
          quietStartHour: config.quietStartHour,
          quietEndHour: config.quietEndHour,
        },
      },
    });
  } catch (error: any) {
    console.error('[academy/messages]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
