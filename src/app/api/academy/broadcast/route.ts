import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import Academy from '@/lib/models/Academy';
import { enqueueMessage } from '@/lib/messaging/enqueue';
import {
  validateBroadcastBody,
  dedupeByPhone,
  renderBroadcastPreview,
} from '@/lib/messaging/broadcast';

/**
 * Owner-composed announcements.
 *
 * This is the only place a human types the text a parent receives, which makes
 * it the only place the usual safety net does not apply: every other message is
 * rendered from a template and validated against one specific student. See
 * lib/messaging/broadcast.ts for the guards that replace it.
 *
 * THE FLOW IS TWO-STEP ON PURPOSE. A POST without `confirm: true` is a dry run:
 * it validates, resolves the audience and returns the count and the exact text,
 * but queues nothing. Sending to every parent in an academy is not undoable, so
 * the owner sees "this goes to 63 parents" and the rendered message before
 * anything is written. The UI enforces this; the API does too, because the UI
 * is not the only caller a route ever gets.
 *
 * WHY THIS IS SAFE TO OFFER AT ALL: a broadcast enqueues at priority 4, the
 * lowest. It always yields to fee reminders and attendance confirmations, it
 * respects the parent's daily budget, and it will not send inside quiet hours.
 * An owner cannot use it to bypass the frequency cap, even by accident.
 */

const AUDIENCES = ['all', 'batch'] as const;
type Audience = (typeof AUDIENCES)[number];

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    // Deliberately NOT available to a super admin without an academy. A
    // platform-wide broadcast to every parent of every tenant is not a feature
    // anyone asked for, and it is exactly the kind of thing that should require
    // a deliberate decision rather than falling out of a role check.
    const academyId = auth.academyId;
    if (!academyId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A broadcast is sent on behalf of one academy. Your account is not linked to one.',
        },
        { status: 403 }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const audience: Audience = AUDIENCES.includes(payload?.audience)
      ? payload.audience
      : 'all';
    const confirm = payload?.confirm === true;

    const validation = validateBroadcastBody(payload?.message);
    if (!validation.ok) {
      return NextResponse.json({ success: false, message: validation.reason }, { status: 400 });
    }
    const body = validation.body;

    const academy = await Academy.findById(academyId).select('name').lean();
    if (!academy) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }
    const academyName = (academy as any).name as string;

    // --- Resolve the audience ----------------------------------------------

    const filter: Record<string, unknown> = {
      academyId,
      isActive: true,
      parentPhoneE164: { $ne: null, $exists: true },
    };

    if (audience === 'batch') {
      const batchId = payload?.batchId;
      if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
        return NextResponse.json(
          { success: false, message: 'A valid batchId is required to message one batch.' },
          { status: 400 }
        );
      }
      filter.batchId = batchId;
    }

    const students = await StudentProfile.find(filter)
      .select('parentPhoneE164 parentName passportId userId')
      .populate('userId', 'name')
      .lean();

    // One message per phone, not per child — see dedupeByPhone for why this is
    // not merely cosmetic.
    const recipients = dedupeByPhone(students as any[]);
    const preview = renderBroadcastPreview(body, academyName);

    // Students with no parent number cannot be reached and should be visible as
    // a gap rather than silently missing from the count.
    const unreachable = await StudentProfile.countDocuments({
      academyId,
      isActive: true,
      $or: [{ parentPhoneE164: null }, { parentPhoneE164: { $exists: false } }],
    });

    if (!confirm) {
      return NextResponse.json({
        success: true,
        data: {
          dryRun: true,
          preview,
          recipientCount: recipients.length,
          studentCount: students.length,
          unreachableStudents: unreachable,
          academyName,
        },
      });
    }

    // --- Send ---------------------------------------------------------------

    // One id for the whole broadcast. It goes into each message's dedupeKey, so
    // a double-clicked send button or a retried request cannot message anyone
    // twice: the second attempt collides on the unique index and returns
    // 'duplicate' per recipient rather than queueing a second copy.
    const broadcastId = new mongoose.Types.ObjectId().toString();

    let queued = 0;
    let duplicates = 0;
    const rejected: { phone: string; reason: string }[] = [];

    for (const recipient of recipients) {
      const phone = recipient.parentPhoneE164 as string;
      const result = await enqueueMessage({
        templateKey: 'broadcast',
        recipientPhone: phone,
        recipientName: recipient.parentName ?? null,
        variables: { messageBody: body, academyName },
        academyId,
        // Deliberately no passportId: a broadcast is about nobody in
        // particular, so there is no identity to validate against. The
        // passport-id guard in validateBroadcastBody is what replaces that.
        dedupeKey: `broadcast:${broadcastId}:${phone}`,
      });

      if (result.status === 'queued') queued++;
      else if (result.status === 'duplicate') duplicates++;
      else rejected.push({ phone, reason: result.reason });
    }

    return NextResponse.json({
      success: true,
      data: {
        dryRun: false,
        broadcastId,
        queued,
        duplicates,
        rejected,
        recipientCount: recipients.length,
        preview,
        // Said explicitly because "queued" reads as "sent" to most people, and
        // with no provider connected nothing will actually leave the building.
        note:
          'Queued at the lowest priority. These will go out on the next dispatch run, ' +
          "outside quiet hours, and within each parent's daily message limit — so some may " +
          'arrive tomorrow. Check the message log for the status of each one.',
      },
    });
  } catch (error: any) {
    console.error('[academy/broadcast]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
