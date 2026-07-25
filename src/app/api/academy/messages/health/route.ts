import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import OutboundMessage from '@/lib/models/OutboundMessage';
import { resolveWhatsAppProvider, resolveSmsProvider } from '@/lib/messaging/providers';
import { requiredInteraktTemplateNames } from '@/lib/messaging/templates';
import { configFromEnv } from '@/lib/messaging/scheduling';

/**
 * Is the communication engine actually able to deliver anything?
 *
 * This exists because of a specific failure of understanding it prevents. With
 * no BSP credentials the engine runs in no-op mode: everything queues and
 * schedules correctly and every send records as `skipped`. That is the designed
 * behaviour, but from the message log alone it looks identical to a system
 * quietly failing. An owner deserves one screen that says, in plain terms,
 * "nothing has gone out yet and here is the reason".
 *
 * The reason is almost never in the code. It is Meta template approval and API
 * credentials — work that happens in the Interakt console, not here.
 */

/** Anything still 'sending' this long has been abandoned by a dead worker. */
const STUCK_SENDING_MINUTES = 30;

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const scope: Record<string, unknown> = {};
    const isSuperAdmin = auth.user.role === 'gwd_super_admin';
    if (!isSuperAdmin) {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'Your account is not linked to an academy.' },
          { status: 403 }
        );
      }
      scope.academyId = auth.academyId;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const stuckBefore = new Date(now.getTime() - STUCK_SENDING_MINUTES * 60_000);

    const whatsapp = resolveWhatsAppProvider();
    const sms = resolveSmsProvider();
    // NoopProvider is what resolves when INTERAKT_API_KEY is absent. Naming the
    // check off the provider rather than reading the env var directly keeps this
    // honest if a second BSP is ever added.
    const whatsappConnected = whatsapp.name !== 'noop';

    const [
      queuedDue,
      queuedFuture,
      held,
      stuck,
      failedLast7,
      recentByStatus,
      lastQueued,
      lastSent,
    ] = await Promise.all([
      OutboundMessage.countDocuments({ ...scope, status: 'queued', scheduledFor: { $lte: now } }),
      OutboundMessage.countDocuments({ ...scope, status: 'queued', scheduledFor: { $gt: now } }),
      OutboundMessage.countDocuments({ ...scope, status: 'queued', deferrals: { $gt: 0 } }),
      OutboundMessage.countDocuments({
        ...scope,
        status: 'sending',
        updatedAt: { $lt: stuckBefore },
      }),
      OutboundMessage.countDocuments({
        ...scope,
        status: 'failed',
        failedAt: { $gte: sevenDaysAgo },
      }),
      OutboundMessage.aggregate([
        { $match: { ...scope, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      OutboundMessage.findOne(scope).sort({ createdAt: -1 }).select('createdAt').lean(),
      OutboundMessage.findOne({ ...scope, sentAt: { $ne: null } })
        .sort({ sentAt: -1 })
        .select('sentAt')
        .lean(),
    ]);

    const last7ByStatus: Record<string, number> = {};
    for (const row of recentByStatus as { _id: string; count: number }[]) {
      last7ByStatus[row._id] = row.count;
    }

    // "Has anything EVER been delivered" is the single most useful signal on
    // this screen, and it is not derivable from a status count alone — a fresh
    // academy with zero messages is fine, one with 400 skipped is not.
    const everDelivered = Boolean(lastSent);

    const blockers: { id: string; title: string; detail: string; owner: string }[] = [];

    if (!whatsappConnected) {
      blockers.push({
        id: 'no_whatsapp_provider',
        title: 'WhatsApp provider is not connected',
        detail:
          'INTERAKT_API_KEY is not set in this environment, so the engine is running in no-op ' +
          'mode. Messages are still being built, validated and queued correctly — they are ' +
          'recorded as "skipped" at the point of sending, not as failures.',
        owner: 'Set INTERAKT_API_KEY in the deployment environment.',
      });
    }

    // There is no API to ask Interakt whether a template is approved, so this
    // cannot be a live check. Listing the exact names is still worth doing:
    // "six templates need approval" is not actionable, six names are.
    blockers.push({
      id: 'template_approval',
      title: 'WhatsApp templates need Meta approval',
      detail:
        'Meta requires every template to be approved before it can be sent to a parent. ' +
        'Approval status cannot be read back through the API, so this list is what must be ' +
        'submitted, not what has been accepted — confirm each one in the Interakt console.',
      owner: requiredInteraktTemplateNames().join(', '),
    });

    if (stuck > 0) {
      blockers.push({
        id: 'stuck_sending',
        title: `${stuck} message(s) stuck mid-send`,
        detail:
          `These have been in "sending" for over ${STUCK_SENDING_MINUTES} minutes, which means ` +
          'a dispatch run died after claiming them. They are not lost, but they will not move ' +
          'on their own.',
        owner: 'Check the cron logs for a failed run.',
      });
    }

    const config = configFromEnv();

    return NextResponse.json({
      success: true,
      data: {
        scope: isSuperAdmin ? 'platform' : 'academy',
        providers: {
          whatsapp: { name: whatsapp.name, connected: whatsappConnected },
          // SMS is interface-complete but cannot deliver to Indian numbers
          // without DLT-registered template ids, which is a regulatory step and
          // not a code one. Said plainly here so it is not mistaken for a bug.
          sms: {
            name: sms?.name ?? null,
            connected: Boolean(sms),
            note: 'Indian SMS additionally requires DLT-registered template ids under TRAI rules. Credentials alone are not enough to deliver.',
          },
        },
        queue: { due: queuedDue, scheduled: queuedFuture, held, stuck },
        last7Days: { byStatus: last7ByStatus, failed: failedLast7 },
        activity: {
          lastQueuedAt: (lastQueued as any)?.createdAt ?? null,
          lastSentAt: (lastSent as any)?.sentAt ?? null,
          everDelivered,
        },
        requiredTemplates: requiredInteraktTemplateNames(),
        blockers,
        schedulingConfig: {
          dailyBudget: config.dailyBudget,
          paymentReserve: config.paymentReserve,
          quietStartHour: config.quietStartHour,
          quietEndHour: config.quietEndHour,
        },
      },
    });
  } catch (error: any) {
    console.error('[academy/messages/health]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
