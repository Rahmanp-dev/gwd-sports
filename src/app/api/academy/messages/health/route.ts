import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import OutboundMessage from '@/lib/models/OutboundMessage';
import DomainEvent from '@/lib/models/DomainEvent';
import { resolveWhatsAppProvider, resolveSmsProvider } from '@/lib/messaging/providers';
import { requiredTemplateNames } from '@/lib/messaging/templates';
import { configFromEnv } from '@/lib/messaging/scheduling';
import { appUrl, isAppUrlConfigured } from '@/lib/appUrl';
import { TEMPLATE_LANGUAGE } from '@/lib/messaging/templates';

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
 * credentials — work that happens in the Meta WhatsApp Manager, not here.
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
    // NoopProvider is what resolves when the Meta credentials are absent. Naming the
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
      pendingEvents,
      oldestPendingEvent,
      recentFailures,
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

      /**
       * Events waiting to become messages.
       *
       * This screen previously started at the OUTBOUND QUEUE, which meant the
       * one failure it could not see was the one upstream of it: a
       * `student.created` event emitted, no dispatch run to consume it, and
       * therefore zero messages to count. Every queue number reads 0 and the
       * page says "WhatsApp is connected" — indistinguishable from a healthy
       * idle system, when in fact nothing will ever send.
       */
      DomainEvent.countDocuments({ ...scope, status: 'pending' }),
      DomainEvent.findOne({ ...scope, status: 'pending' })
        .sort({ availableAt: 1 })
        .select('availableAt name')
        .lean(),

      // The reason a send failed, not just how many. A template whose
      // parameter count does not match what Meta approved fails at SEND time
      // with a specific message, and that message is the entire diagnosis.
      OutboundMessage.find({ ...scope, status: 'failed', failedAt: { $gte: sevenDaysAgo } })
        .sort({ failedAt: -1 })
        .limit(5)
        .select('templateKey error failedAt recipientPhone')
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
          'META_WHATSAPP_ACCESS_TOKEN is not set in this environment, so the engine is running in no-op ' +
          'mode. Messages are still being built, validated and queued correctly — they are ' +
          'recorded as "skipped" at the point of sending, not as failures.',
        owner: 'Set META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID in the deployment environment.',
      });
    }

    /**
     * Every link in every message is built from NEXT_PUBLIC_APP_URL. Unset, it
     * falls back to a domain this deployment does not serve — and the failure
     * is completely invisible from here: the message queues, sends and reports
     * as delivered. The only person who finds out is the parent who taps a
     * dead passport link.
     */
    if (!isAppUrlConfigured()) {
      blockers.push({
        id: 'app_url_missing',
        title: 'Links in messages point at the wrong domain',
        detail:
          'NEXT_PUBLIC_APP_URL is not set on this deployment, so every passport, payment and ' +
          'sign-in link sent to a parent is built against the fallback domain instead of this ' +
          'site. Messages will still send and report as delivered — the links inside them just ' +
          'will not work.',
        owner: `Set NEXT_PUBLIC_APP_URL to this site's public origin. Currently building links as ${appUrl()}`,
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
        'submitted, not what has been accepted — confirm each one in the Meta WhatsApp Manager. ' +
        `Each must exist in the language "${TEMPLATE_LANGUAGE}": a template is identified by ` +
        '(name, language), so an approved template in a different translation is rejected at ' +
        'send time with "Template name does not exist in the translation". Override with ' +
        'META_WHATSAPP_TEMPLATE_LANG if the Language column in WhatsApp Manager shows something else.',
      owner: requiredTemplateNames().join(', '),
    });

    /**
     * The scheduler itself is not running.
     *
     * An event that has been sitting past its availableAt for longer than a
     * few tick intervals means nothing is draining the log. On the 15-minute
     * cadence the engine is designed around, 20 minutes is already a missed
     * run; this stays quiet for anything younger so a freshly-imported
     * student does not raise a false alarm in the seconds before the next
     * tick picks it up.
     */
    const oldestPendingAt = (oldestPendingEvent as any)?.availableAt ?? null;
    const pendingAgeMinutes = oldestPendingAt
      ? Math.floor((now.getTime() - new Date(oldestPendingAt).getTime()) / 60_000)
      : 0;

    if (pendingEvents > 0 && pendingAgeMinutes >= 20) {
      blockers.push({
        id: 'scheduler_not_running',
        title: `${pendingEvents} event(s) waiting — the scheduler has not run`,
        detail:
          `The oldest has been waiting ${pendingAgeMinutes} minute(s). Events become messages ` +
          'only when POST /api/jobs/tick runs, so nothing below this point can happen until ' +
          'it does: the outbound queue stays empty and every counter on this page reads zero ' +
          'even though the engine is otherwise configured correctly.',
        owner:
          'Confirm CRON_SECRET is set on the deployment, and APP_URL + CRON_SECRET are set as ' +
          'GitHub repository secrets (Settings → Secrets and variables → Actions) for the ' +
          '15-minute Job tick workflow. A super admin can also run it on demand from this page.',
      });
    }

    if (recentFailures.length > 0) {
      blockers.push({
        id: 'send_failures',
        title: `${failedLast7} send(s) failed in the last 7 days`,
        detail:
          'The provider rejected these. A parameter-count mismatch between a template here ' +
          'and the version Meta approved is the most common cause, and it is only ever ' +
          'reported at send time — never at approval time.',
        owner: (recentFailures as any[])
          .map((f) => `${f.templateKey}: ${f.error ?? 'no reason recorded'}`)
          .join(' · '),
      });
    }

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
        // Upstream of the queue: events not yet turned into messages.
        events: {
          pending: pendingEvents,
          oldestPendingAt,
          oldestPendingAgeMinutes: pendingAgeMinutes,
        },
        recentFailures: (recentFailures as any[]).map((f) => ({
          templateKey: f.templateKey,
          error: f.error ?? null,
          failedAt: f.failedAt ?? null,
        })),
        last7Days: { byStatus: last7ByStatus, failed: failedLast7 },
        activity: {
          lastQueuedAt: (lastQueued as any)?.createdAt ?? null,
          lastSentAt: (lastSent as any)?.sentAt ?? null,
          everDelivered,
        },
        requiredTemplates: requiredTemplateNames(),
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
