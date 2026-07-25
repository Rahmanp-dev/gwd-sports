import type { MessageStatus } from '@/lib/models/OutboundMessage';
import {
  DEFAULT_SCHEDULING_CONFIG,
  effectiveBudget,
  type SchedulingConfig,
} from '@/lib/messaging/scheduling';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * "WHY DIDN'T THIS SEND?" — FOR A ROW THAT ALREADY EXISTS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `explainDecision()` in scheduling.ts explains a PLAN: a decision the
 * dispatcher is about to take, held in memory. This module explains a ROW: a
 * message that has been through the queue and now sits in the database in some
 * state, possibly days later.
 *
 * They are deliberately separate. The planner's explanation has the live config
 * and the decision object in hand; a stored row has neither — all it has is a
 * status, a couple of timestamps, and a free-text error string written by
 * whichever code path last touched it. Reconstructing the sentence from that is
 * a different problem, and folding it into `explainDecision` would mean passing
 * half-populated decision objects around to satisfy a UI.
 *
 * WHY THIS IS SERVER-SIDE AND NOT IN THE COMPONENT: the wording encodes policy
 * — that a skip for "no provider configured" is an activation gap and not a
 * delivery failure, that a deferral is never a drop, that nothing here implies
 * an access restriction. Policy stated in a React component drifts the first
 * time someone reformats the table. It is a pure function so it can be tested
 * against every status without a database.
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * How the owner should FEEL about this row, which is not the same as its
 * status. `skipped` and `cancelled` are both "not sent", but one is a gap to
 * fix and the other is the system correctly holding its tongue.
 */
export type MessageState =
  | 'waiting' // will still go out; nothing to do
  | 'held' // will still go out, but later, and we made that choice
  | 'in_flight' // handed off, awaiting confirmation
  | 'landed' // reached the parent
  | 'problem' // needs someone to look at it
  | 'stopped'; // intentionally not sent, correctly

export interface MessageExplanation {
  state: MessageState;
  /** Short label for a badge or table cell. */
  headline: string;
  /** One or two sentences an academy owner can act on. */
  detail: string;
  /**
   * True when nothing further will happen to this row on its own. Drives
   * whether the UI offers a "retry" affordance later.
   */
  terminal: boolean;
}

/**
 * The subset of an OutboundMessage this function reads. Declared structurally
 * so it accepts a hydrated mongoose document, a `.lean()` result, or a fixture
 * in a test without any of them needing to know about the others.
 */
export interface ExplainableMessage {
  status: MessageStatus;
  channel?: string | null;
  priority?: number | null;
  scheduledFor?: Date | string | null;
  sentAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  readAt?: Date | string | null;
  failedAt?: Date | string | null;
  attempts?: number | null;
  deferrals?: number | null;
  lastDeferralReason?: string | null;
  provider?: string | null;
  error?: string | null;
  fallbackMessageId?: unknown;
  fallbackForMessageId?: unknown;
}

/** IST-formatted, because every reader of this screen is in one timezone. */
function when(value: Date | string | null | undefined, offsetMinutes: number): string {
  if (!value) return 'an unknown time';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'an unknown time';
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  const day = shifted.getUTCDate().toString().padStart(2, '0');
  const month = shifted.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
  const hour = shifted.getUTCHours().toString().padStart(2, '0');
  const minute = shifted.getUTCMinutes().toString().padStart(2, '0');
  return `${day} ${month}, ${hour}:${minute}`;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * A skip that means "the platform is not wired up yet" rather than "this
 * message had a problem". The distinction matters enough to be load-bearing:
 * with no BSP credentials every single message skips, and an owner seeing a
 * screen of red would reasonably conclude the system is broken when in fact
 * nothing has been misconfigured — it just hasn't been switched on.
 */
function isActivationGap(error: string | null | undefined): boolean {
  if (!error) return false;
  return /not configured|no whatsapp provider|no sms provider|dlt/i.test(error);
}

export function explainMessage(
  message: ExplainableMessage,
  config: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG,
  now: Date = new Date()
): MessageExplanation {
  const tz = config.timezoneOffsetMinutes;
  const isFallback = Boolean(message.fallbackForMessageId);
  const fallbackNote = isFallback
    ? ' This is the SMS fallback raised for a WhatsApp message that failed.'
    : '';

  switch (message.status) {
    case 'queued':
      return explainQueued(message, config, now, fallbackNote);

    case 'sending':
      return {
        state: 'in_flight',
        headline: 'Sending now',
        detail:
          'A dispatch run has claimed this message and is handing it to the provider. ' +
          'If it stays here for more than a few minutes, a run died mid-flight and the ' +
          `next tick will pick it up.${fallbackNote}`,
        terminal: false,
      };

    case 'sent':
      return {
        state: 'in_flight',
        headline: 'Sent',
        detail:
          `Accepted by ${message.provider || 'the provider'} at ${when(message.sentAt, tz)}. ` +
          'Waiting for the handset to confirm delivery — WhatsApp receipts usually ' +
          `arrive within seconds, but a phone that is off can delay one for hours.${fallbackNote}`,
        terminal: false,
      };

    case 'delivered':
      return {
        state: 'landed',
        headline: 'Delivered',
        detail: `Reached the parent's phone at ${when(message.deliveredAt, tz)}. Not opened yet.${fallbackNote}`,
        terminal: false,
      };

    case 'read':
      return {
        state: 'landed',
        headline: 'Read',
        detail: `The parent opened this at ${when(message.readAt, tz)}.${fallbackNote}`,
        terminal: true,
      };

    case 'failed': {
      const raised = Boolean(message.fallbackMessageId);
      return {
        state: 'problem',
        headline: 'Failed',
        detail:
          `Gave up at ${when(message.failedAt, tz)} after ${message.attempts ?? 0} attempt(s). ` +
          `Provider said: ${message.error || 'no reason recorded'}.` +
          (raised ? ' An SMS fallback was raised — see the linked message.' : '') +
          fallbackNote,
        terminal: true,
      };
    }

    case 'cancelled':
      return {
        state: 'stopped',
        headline: 'Cancelled',
        detail:
          `Superseded before it went out: ${message.error || 'no reason recorded'}. ` +
          'This is the system correctly staying quiet — most often the fee was paid ' +
          'before the reminder was due, so chasing it would have been wrong.',
        terminal: true,
      };

    case 'skipped':
      if (isActivationGap(message.error)) {
        return {
          state: 'stopped',
          headline: 'Not sent — provider not connected',
          detail:
            `${message.error}. Nothing is wrong with this message: it was built, validated ` +
            'and rendered correctly, and there was simply nowhere to send it. Connecting the ' +
            'provider will not resend it — but everything queued after that point will go out.',
          terminal: true,
        };
      }
      return {
        state: 'stopped',
        headline: 'Skipped',
        detail: `Deliberately not sent: ${message.error || 'no reason recorded'}.${fallbackNote}`,
        terminal: true,
      };

    default:
      return {
        state: 'problem',
        headline: String(message.status),
        detail: 'Unrecognised status — this row was written by code that predates this screen.',
        terminal: false,
      };
  }
}

/**
 * `queued` is the status that actually needs explaining. Four very different
 * situations share it, and the owner's question — "is this stuck?" — has a
 * different answer in each.
 */
function explainQueued(
  message: ExplainableMessage,
  config: SchedulingConfig,
  now: Date,
  fallbackNote: string
): MessageExplanation {
  const tz = config.timezoneOffsetMinutes;
  const scheduledFor = toDate(message.scheduledFor);
  const due = !scheduledFor || scheduledFor.getTime() <= now.getTime();
  const deferrals = message.deferrals ?? 0;

  // A message pushed back by the frequency cap. This is the case the whole
  // screen exists for, so it says plainly that the message is not lost.
  if (deferrals > 0 && message.lastDeferralReason) {
    const at = when(scheduledFor, tz);
    const reason =
      message.lastDeferralReason === 'quiet_hours'
        ? `it came due inside quiet hours (${config.quietStartHour}:00–${config.quietEndHour}:00 IST), ` +
          'and a notification at that hour is a complaint rather than a nudge'
        : message.lastDeferralReason === 'daily_budget'
          ? `this parent had already received their ${effectiveBudget(
              message.priority ?? 4,
              config
            )} message(s) for the day, and going over the cap is how a number gets blocked`
          : message.lastDeferralReason;

    return {
      state: 'held',
      headline: 'Held back',
      detail:
        `Waiting until ${at} because ${reason}. It has been held ${deferrals} time(s). ` +
        `It has not been dropped — every deferral moves it to a real slot.${fallbackNote}`,
      terminal: false,
    };
  }

  // A retry after a transient provider error. `attempts` is only non-zero here
  // if a send was actually tried and bounced back as retryable.
  if ((message.attempts ?? 0) > 0 && message.error) {
    return {
      state: 'problem',
      headline: 'Retrying',
      detail:
        `Attempt ${message.attempts} failed with: ${message.error}. Backing off until ` +
        `${when(scheduledFor, tz)} before trying again.${fallbackNote}`,
      terminal: false,
    };
  }

  if (!due) {
    return {
      state: 'waiting',
      headline: 'Scheduled',
      detail: `Queued and healthy. Not due to send until ${when(scheduledFor, tz)}.${fallbackNote}`,
      terminal: false,
    };
  }

  return {
    state: 'waiting',
    headline: 'Due now',
    detail:
      'Due to send and waiting for the next dispatch run. The cron ticks every 15 minutes, ' +
      `so this should clear shortly.${fallbackNote}`,
    terminal: false,
  };
}

/**
 * Groups the eight statuses into the four buckets an owner actually filters by.
 * Kept here rather than in the route so the UI's filter chips and the
 * explanation above cannot disagree about what counts as a problem.
 */
export const MESSAGE_STATUS_GROUPS: Record<string, MessageStatus[]> = {
  pending: ['queued', 'sending'],
  sent: ['sent', 'delivered', 'read'],
  problem: ['failed'],
  stopped: ['cancelled', 'skipped'],
};
