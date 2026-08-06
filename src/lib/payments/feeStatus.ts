/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE FEE BANNER — what a student sees at the top of their portal
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Pure and client-safe on purpose. The authoritative cadence lives in
 * lib/messaging/reminders.ts, but that module imports mongoose models and can
 * never be pulled into a browser bundle. This mirrors its *date* rule so the
 * banner and the WhatsApp message agree about which cycle is current — if they
 * disagree, a parent gets a message saying the fee is due today while the
 * portal still says "due in three days", and neither is trusted again.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It never invents an amount. If no fee is configured, or nothing is
 * outstanding, there is no banner — an empty red bar on a child's dashboard
 * because a field was left blank is worse than no bar at all.
 *
 * It also stops nagging. Past the point where the reminder cadence gives up
 * (T+3), the banner keeps stating the fact but drops the urgency styling: an
 * unpaid fee is a conversation between the academy and a parent, and a
 * permanently flashing red bar on a fourteen-year-old's screen is not how that
 * conversation should be conducted.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** Matches the schema cap, which exists so a due day never lands on 30 Feb. */
const MIN_DAY = 1;
const MAX_DAY = 28;

/** India. The same offset the messaging layer defaults to. */
const DEFAULT_TZ_OFFSET_MINUTES = 330;

/** How early the bar appears. Two days ahead of the T-5 WhatsApp, so the
 *  portal warns before the phone buzzes rather than after. */
export const LEAD_IN_DAYS = 7;

export type FeeUrgency = 'upcoming' | 'due-today' | 'overdue' | 'settled';

/**
 * The last day the automated cadence chases a parent (see reminders.ts:
 * T-5, due, T+3, then stop). The banner uses the same boundary to decide how
 * loud to be.
 */
export const LAST_INSISTENT_DAY = 3;

export interface FeeBannerState {
  /** False when there is nothing worth showing. */
  show: boolean;
  urgency: FeeUrgency;
  /**
   * Whether this warrants a loud treatment.
   *
   * Goes false once the messaging cadence has stopped chasing. The balance is
   * still stated — it is still owed — but a permanently flashing red bar on a
   * fourteen-year-old's dashboard is not how a billing conversation between
   * two adults should be conducted, and after a week it stops being read
   * anyway.
   */
  insistent: boolean;
  /** Negative before the due date, 0 on it, positive after. */
  daysFromDue: number;
  dueDate: Date | null;
  amount: number | null;
  headline: string;
  detail: string;
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
}

function toLocalParts(d: Date, offsetMinutes: number): LocalParts {
  const shifted = new Date(d.getTime() + offsetMinutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function fromLocalParts(p: LocalParts, offsetMinutes: number): Date {
  return new Date(Date.UTC(p.year, p.month, p.day, 0, 0, 0) - offsetMinutes * 60_000);
}

/** Whole local days between two instants. Positive when `b` is later. */
function daysBetween(a: Date, b: Date, offsetMinutes: number): number {
  const pa = toLocalParts(a, offsetMinutes);
  const pb = toLocalParts(b, offsetMinutes);
  const ua = Date.UTC(pa.year, pa.month, pa.day);
  const ub = Date.UTC(pb.year, pb.month, pb.day);
  return Math.round((ub - ua) / 86_400_000);
}

/**
 * The due date of the cycle currently being chased.
 *
 * Mirrors `currentCycleDueDate` in lib/messaging/reminders.ts, including its
 * 20-day rule: within 20 days after a due date we are still chasing THAT
 * cycle; beyond it the next cycle has taken over and the old one is the
 * owner's problem, not a banner's.
 */
export function currentCycleDueDate(
  now: Date,
  dueDayOfMonth: number,
  offsetMinutes: number = DEFAULT_TZ_OFFSET_MINUTES
): Date {
  const parts = toLocalParts(now, offsetMinutes);
  const day = Math.min(Math.max(Math.trunc(dueDayOfMonth), MIN_DAY), MAX_DAY);

  const thisMonth = fromLocalParts(
    { year: parts.year, month: parts.month, day },
    offsetMinutes
  );

  if (daysBetween(thisMonth, now, offsetMinutes) >= -20) return thisMonth;

  return fromLocalParts(
    { year: parts.year, month: parts.month - 1, day },
    offsetMinutes
  );
}

function money(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function whenText(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

export interface FeeBannerInput {
  /** What the student still owes, in rupees. */
  outstandingFees?: number | null;
  /** The recurring amount, used only when nothing is outstanding yet. */
  feeAmount?: number | null;
  feeDueDayOfMonth?: number | null;
  now?: Date;
  timezoneOffsetMinutes?: number;
}

/**
 * Decides whether the bar shows, and what it says.
 *
 * Reads `outstandingFees` as the source of truth for "is anything owed". The
 * recurring `feeAmount` is only a fallback for wording — a student whose
 * balance is clear sees nothing regardless of what their monthly fee is.
 */
export function feeBannerState(input: FeeBannerInput): FeeBannerState {
  const offset = input.timezoneOffsetMinutes ?? DEFAULT_TZ_OFFSET_MINUTES;
  const now = input.now ?? new Date();

  const outstanding =
    typeof input.outstandingFees === 'number' && Number.isFinite(input.outstandingFees)
      ? input.outstandingFees
      : 0;

  const none: FeeBannerState = {
    show: false,
    urgency: 'settled',
    insistent: false,
    daysFromDue: 0,
    dueDate: null,
    amount: null,
    headline: '',
    detail: '',
  };

  // Nothing owed — including a negative balance, which is a credit and
  // certainly not something to put a warning bar around.
  if (outstanding <= 0) return none;

  const dueDay = input.feeDueDayOfMonth;
  if (typeof dueDay !== 'number' || !Number.isFinite(dueDay)) {
    // A balance with no schedule behind it. Say it plainly, without a date we
    // cannot substantiate and without urgency we have not earned.
    return {
      ...none,
      show: true,
      urgency: 'upcoming',
      insistent: false,
      amount: outstanding,
      headline: `${money(outstanding)} outstanding`,
      detail: 'Speak to your academy about when this is due.',
    };
  }

  const dueDate = currentCycleDueDate(now, dueDay, offset);
  const daysFromDue = daysBetween(dueDate, now, offset);

  // Too far ahead to be worth a bar.
  if (daysFromDue < -LEAD_IN_DAYS) return none;

  if (daysFromDue < 0) {
    const inDays = Math.abs(daysFromDue);
    return {
      show: true,
      urgency: 'upcoming',
      insistent: true,
      daysFromDue,
      dueDate,
      amount: outstanding,
      headline: `${money(outstanding)} due ${whenText(inDays)}`,
      detail: 'Pay from your Fees tab, or hand it to your academy directly.',
    };
  }

  if (daysFromDue === 0) {
    return {
      show: true,
      urgency: 'due-today',
      insistent: true,
      daysFromDue,
      dueDate,
      amount: outstanding,
      headline: `${money(outstanding)} due today`,
      detail: 'Pay from your Fees tab, or hand it to your academy directly.',
    };
  }

  return {
    show: true,
    urgency: 'overdue',
    // Loud only while the messaging cadence is still chasing.
    insistent: daysFromDue <= LAST_INSISTENT_DAY,
    daysFromDue,
    dueDate,
    amount: outstanding,
    headline: `${money(outstanding)} overdue`,
    detail:
      daysFromDue === 1
        ? 'Due yesterday. Nothing on your record changes — please settle when you can.'
        : `Due ${daysFromDue} days ago. Nothing on your record changes — please settle when you can.`,
  };
}
