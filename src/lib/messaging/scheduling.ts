import { MESSAGE_PRIORITY } from '@/lib/models/OutboundMessage';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FREQUENCY CAPPING AND PRIORITY — PURE FUNCTIONS, NO DATABASE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This module decides, for a batch of due messages, which ones send now and
 * which get pushed to a later slot. It touches no database and no clock of its
 * own: `now`, the candidates, and the already-sent counts are all inputs.
 *
 * That is deliberate. "A parent gets muted because we sent five messages in one
 * day" is a failure mode you cannot reproduce by clicking around a staging
 * environment — it needs a simulated day with competing triggers. Keeping the
 * decision logic pure is what makes that simulation possible, and
 * scheduling.test.ts runs exactly that scenario.
 *
 * THE RULES:
 *
 * 1. Lower `priority` number wins. payment(1) > attendance(2) >
 *    achievement(3) > broadcast(4).
 *
 * 2. A parent has a daily message budget. Once spent, further messages are
 *    DEFERRED — never dropped, and never sent anyway. This is the whole point:
 *    a muted parent stops receiving the messages that matter, so exceeding the
 *    cap is more expensive than delaying a message.
 *
 * 3. The budget is bucketed by the PARENT'S local calendar day, not UTC. A cap
 *    that rolls over at 05:30 IST would let a parent receive a double dose
 *    every morning.
 *
 * 4. Payment reminders get a small reserved allowance on top of the shared
 *    budget. Without it, three attendance confirmations earlier in the day
 *    would starve the fee reminder that actually earns revenue — and priority
 *    ordering alone cannot fix that, because the earlier messages were already
 *    sent before the reminder existed.
 *
 * 5. Nothing sends during quiet hours. A payment reminder at 03:00 is a
 *    complaint, not a nudge.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface SchedulingConfig {
  /** Shared daily cap per parent, across all message types. */
  dailyBudget: number;
  /**
   * Extra slots usable ONLY by priority 1 (payment). Stops a fee reminder being
   * starved by lower-priority traffic sent earlier the same day.
   */
  paymentReserve: number;
  /** Local hour quiet time begins (inclusive). 21 = 9pm. */
  quietStartHour: number;
  /** Local hour quiet time ends (exclusive). 8 = 8am. */
  quietEndHour: number;
  /** Minutes east of UTC. India is +05:30 = 330, and has no DST. */
  timezoneOffsetMinutes: number;
  /** Local hour used when deferring to a later day. */
  preferredSendHour: number;
}

export const DEFAULT_SCHEDULING_CONFIG: SchedulingConfig = {
  dailyBudget: 3,
  paymentReserve: 1,
  quietStartHour: 21,
  quietEndHour: 8,
  timezoneOffsetMinutes: 330,
  preferredSendHour: 10,
};

export function configFromEnv(): SchedulingConfig {
  const int = (name: string, fallback: number): number => {
    const parsed = Number(process.env[name]);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    dailyBudget: int('GWD_DAILY_MESSAGE_BUDGET', DEFAULT_SCHEDULING_CONFIG.dailyBudget),
    paymentReserve: int('GWD_PAYMENT_MESSAGE_RESERVE', DEFAULT_SCHEDULING_CONFIG.paymentReserve),
    quietStartHour: int('GWD_QUIET_START_HOUR', DEFAULT_SCHEDULING_CONFIG.quietStartHour),
    quietEndHour: int('GWD_QUIET_END_HOUR', DEFAULT_SCHEDULING_CONFIG.quietEndHour),
    timezoneOffsetMinutes: int('GWD_TZ_OFFSET_MINUTES', DEFAULT_SCHEDULING_CONFIG.timezoneOffsetMinutes),
    preferredSendHour: int('GWD_PREFERRED_SEND_HOUR', DEFAULT_SCHEDULING_CONFIG.preferredSendHour),
  };
}

// ---------------------------------------------------------------------------
// Local-time helpers. No timezone library: India is a fixed +05:30 with no DST,
// so a minute offset is exact and has no dependency cost.
// ---------------------------------------------------------------------------

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function toLocalParts(date: Date, offsetMinutes: number): LocalParts {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

export function fromLocalParts(
  parts: { year: number; month: number; day: number; hour: number; minute?: number },
  offsetMinutes: number
): Date {
  return new Date(
    Date.UTC(parts.year, parts.month, parts.day, parts.hour, parts.minute ?? 0) -
      offsetMinutes * 60_000
  );
}

/** "YYYY-MM-DD" in the parent's local timezone. The daily budget bucket key. */
export function localDateKey(date: Date, offsetMinutes: number): string {
  const { year, month, day } = toLocalParts(date, offsetMinutes);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isQuietHour(date: Date, config: SchedulingConfig): boolean {
  const { hour } = toLocalParts(date, config.timezoneOffsetMinutes);
  const { quietStartHour, quietEndHour } = config;

  // Normal case: quiet window wraps midnight, e.g. 21:00 → 08:00.
  if (quietStartHour > quietEndHour) {
    return hour >= quietStartHour || hour < quietEndHour;
  }
  // Degenerate config where the window sits inside one day.
  return hour >= quietStartHour && hour < quietEndHour;
}

/** The next moment sending is permitted, at or after `from`. */
export function nextAllowedSendTime(from: Date, config: SchedulingConfig): Date {
  if (!isQuietHour(from, config)) return from;

  const parts = toLocalParts(from, config.timezoneOffsetMinutes);
  const { quietStartHour, quietEndHour } = config;

  // Late evening: wait for tomorrow morning's opening.
  if (quietStartHour > quietEndHour && parts.hour >= quietStartHour) {
    return fromLocalParts(
      { year: parts.year, month: parts.month, day: parts.day + 1, hour: quietEndHour },
      config.timezoneOffsetMinutes
    );
  }

  // Small hours: wait for this morning's opening.
  return fromLocalParts(
    { year: parts.year, month: parts.month, day: parts.day, hour: quietEndHour },
    config.timezoneOffsetMinutes
  );
}

/** The preferred slot on the following local day. Where budget deferrals land. */
export function nextDaySlot(from: Date, config: SchedulingConfig): Date {
  const parts = toLocalParts(from, config.timezoneOffsetMinutes);
  const target = fromLocalParts(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day + 1,
      hour: config.preferredSendHour,
    },
    config.timezoneOffsetMinutes
  );
  // Guard a preferredSendHour that itself falls inside quiet hours.
  return nextAllowedSendTime(target, config);
}

/** Effective cap for a given priority: the shared budget plus any reserve. */
export function effectiveBudget(priority: number, config: SchedulingConfig): number {
  return priority === MESSAGE_PRIORITY.PAYMENT
    ? config.dailyBudget + config.paymentReserve
    : config.dailyBudget;
}

// ---------------------------------------------------------------------------
// The planner
// ---------------------------------------------------------------------------

export interface DispatchCandidate {
  id: string;
  recipientPhone: string;
  priority: number;
  /** Earliest permitted send time. Candidates later than `now` are not due. */
  scheduledFor: Date;
  templateKey: string;
}

export type DeferralReason = 'quiet_hours' | 'daily_budget' | 'not_due';

export type DispatchDecision =
  | { id: string; action: 'send'; recipientPhone: string; priority: number }
  | {
      id: string;
      action: 'defer';
      recipientPhone: string;
      priority: number;
      deferTo: Date;
      reason: DeferralReason;
    };

export interface PlanDispatchInput {
  now: Date;
  candidates: DispatchCandidate[];
  /**
   * Messages already sent to each phone on the relevant local day, keyed
   * `"<e164>|<YYYY-MM-DD>"`. Built by the caller from the database.
   */
  sentCounts: Record<string, number>;
  config?: SchedulingConfig;
}

export function budgetKey(phone: string, localDate: string): string {
  return `${phone}|${localDate}`;
}

/**
 * Decides send-or-defer for every candidate.
 *
 * Processing order is (priority, scheduledFor, id) — deterministic, and it means
 * that when several messages compete for the last slot of the day, the highest
 * priority claims it. `id` is the final tie-break purely so the function is
 * reproducible in tests.
 */
export function planDispatch(input: PlanDispatchInput): DispatchDecision[] {
  const config = input.config ?? DEFAULT_SCHEDULING_CONFIG;
  const { now } = input;

  const ordered = [...input.candidates].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const timeDelta = a.scheduledFor.getTime() - b.scheduledFor.getTime();
    if (timeDelta !== 0) return timeDelta;
    return a.id.localeCompare(b.id);
  });

  // Local copy so the caller's counts are not mutated, and so messages sent
  // earlier in THIS plan count against later ones in the same plan.
  const spent: Record<string, number> = { ...input.sentCounts };

  const decisions: DispatchDecision[] = [];

  for (const candidate of ordered) {
    const base = {
      id: candidate.id,
      recipientPhone: candidate.recipientPhone,
      priority: candidate.priority,
    };

    // Not yet due. Included for robustness — the caller normally filters these.
    if (candidate.scheduledFor.getTime() > now.getTime()) {
      decisions.push({
        ...base,
        action: 'defer',
        deferTo: candidate.scheduledFor,
        reason: 'not_due',
      });
      continue;
    }

    // Quiet hours are checked BEFORE the budget, and a quiet-hours deferral does
    // not consume a slot — the message hasn't been sent, so charging it would
    // silently shrink tomorrow's budget.
    if (isQuietHour(now, config)) {
      decisions.push({
        ...base,
        action: 'defer',
        deferTo: nextAllowedSendTime(now, config),
        reason: 'quiet_hours',
      });
      continue;
    }

    const localDate = localDateKey(now, config.timezoneOffsetMinutes);
    const key = budgetKey(candidate.recipientPhone, localDate);
    const used = spent[key] ?? 0;

    if (used >= effectiveBudget(candidate.priority, config)) {
      decisions.push({
        ...base,
        action: 'defer',
        deferTo: nextDaySlot(now, config),
        reason: 'daily_budget',
      });
      continue;
    }

    spent[key] = used + 1;
    decisions.push({ ...base, action: 'send' });
  }

  return decisions;
}

/**
 * Human-readable explanation of a plan. Used by the simulation test and by the
 * owner-facing message log, so "why didn't this go out?" is answerable without
 * reading code.
 */
export function explainDecision(
  decision: DispatchDecision,
  config: SchedulingConfig = DEFAULT_SCHEDULING_CONFIG
): string {
  if (decision.action === 'send') {
    return `send now (priority ${decision.priority})`;
  }
  switch (decision.reason) {
    case 'quiet_hours':
      return `deferred to ${decision.deferTo.toISOString()} — quiet hours (${config.quietStartHour}:00–${config.quietEndHour}:00 local)`;
    case 'daily_budget':
      return `deferred to ${decision.deferTo.toISOString()} — parent's daily budget of ${effectiveBudget(decision.priority, config)} message(s) is spent`;
    case 'not_due':
      return `not due until ${decision.deferTo.toISOString()}`;
  }
}
