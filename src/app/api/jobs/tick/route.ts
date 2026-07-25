import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authorizeJobRequest } from '@/lib/jobs/auth';
import { runEventDispatchTick } from '@/lib/messaging/consumers';
import { runSendTick } from '@/lib/messaging/send';
import { runReminderTick } from '@/lib/messaging/reminders';
import { runWeeklyDigestTick } from '@/lib/messaging/digest';
import { isDigestDay } from '@/lib/messaging/digest';
import { configFromEnv } from '@/lib/messaging/scheduling';

/**
 * The single cron entry point. One schedule to configure, not four.
 *
 * Recommended: every 15 minutes.
 *   Vercel  → vercel.json: { "crons": [{ "path": "/api/jobs/tick", "schedule": "*\/15 * * * *" }] }
 *   Railway → a cron service hitting this URL with `Authorization: Bearer $CRON_SECRET`
 *
 * Order matters and is deliberate:
 *   1. dispatch  — turn new events into queued messages
 *   2. reminders — daily fee sweep (self-guards against running twice)
 *   3. digest    — Sunday only, self-guarded
 *   4. send      — drain the queue LAST, so anything queued above can go out in
 *                  this same tick rather than waiting 15 minutes
 *
 * Every stage is individually idempotent, so a tick that overlaps the previous
 * one, or a retried invocation, cannot double-message anyone.
 */
export async function POST(req: NextRequest) {
  const auth = authorizeJobRequest(req);
  if (!auth.ok) return auth.response;

  const startedAt = Date.now();

  try {
    await connectToDatabase();
    const now = new Date();
    const config = configFromEnv();

    const dispatch = await runEventDispatchTick({ now });

    // Both of these are safe to call every tick: the reminder sweep dedupes per
    // student/stage/cycle, and the digest no-ops unless it is locally Sunday.
    const reminders = await runReminderTick({ now });
    const digest = await runWeeklyDigestTick({ now });

    const send = await runSendTick({ now });

    return NextResponse.json({
      success: true,
      data: {
        ranAt: now.toISOString(),
        durationMs: Date.now() - startedAt,
        isDigestDay: isDigestDay(now, config),
        dispatch: {
          claimed: dispatch.claimed,
          queued: dispatch.queued,
          duplicates: dispatch.duplicates,
          skipped: dispatch.skipped,
          failed: dispatch.failed,
        },
        reminders: {
          studentsChecked: reminders.studentsChecked,
          remindersQueued: reminders.remindersQueued,
          alertsRaised: reminders.alertsRaised,
        },
        digest: { studentsChecked: digest.studentsChecked, queued: digest.queued },
        send: {
          considered: send.considered,
          sent: send.sent,
          deferred: send.deferred,
          failed: send.failed,
          skipped: send.skipped,
          fallbacksRaised: send.fallbacksRaised,
        },
      },
    });
  } catch (error: any) {
    console.error('[jobs/tick]', error);
    // 500 so the cron provider records a failure and retries on its own schedule.
    return NextResponse.json(
      { success: false, message: error?.message || 'Tick failed', durationMs: Date.now() - startedAt },
      { status: 500 }
    );
  }
}

/**
 * GET runs the same work. Provided because several cron services (and Vercel
 * Cron) issue GET rather than POST. Auth is identical.
 */
export async function GET(req: NextRequest) {
  return POST(req);
}
