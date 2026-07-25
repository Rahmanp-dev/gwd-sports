import { toLocalParts, fromLocalParts, localDateKey } from '@/lib/messaging/scheduling';
import { DEFAULT_SCHEDULING_CONFIG } from '@/lib/messaging/scheduling';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * DATED SESSIONS — PURE, NO DATABASE, NO CLOCK OF ITS OWN
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A "session" is one batch on one calendar day. Both attendance modes — the
 * parent's QR scan and the coach's checklist — have to agree on which session
 * they are marking, or the same child gets recorded twice and their parent gets
 * two "checked in" messages for one evening.
 *
 * WHY THERE IS NO Session COLLECTION. A session is entirely determined by
 * (batch, local date). Materialising a row per session per batch per day would
 * create a second source of truth that has to be kept in sync with the batch's
 * recurring schedule — and the failure mode of that drift is a coach opening
 * tonight's register and finding it empty because nobody generated it. A
 * derived, deterministic id has none of that: it is correct the moment the
 * batch exists, needs no backfill when a schedule changes, and two independent
 * writers computing it arrive at the same string.
 *
 * IST throughout. A session's date is the coach's calendar date, not UTC's — a
 * 9pm Saturday practice must not be filed under Sunday.
 * ════════════════════════════════════════════════════════════════════════════
 */

/** India is a fixed +05:30 with no DST, so a minute offset is exact. */
const IST_OFFSET_MINUTES = DEFAULT_SCHEDULING_CONFIG.timezoneOffsetMinutes;

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/** Sunday-first, matching JavaScript's getUTCDay(). */
const WEEKDAYS: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * How early a parent may scan, and how late. Generous on both sides on purpose:
 * families arrive early and a coach who forgets until the drive home should
 * still be able to mark the register.
 */
export const CHECK_IN_OPENS_MINUTES_BEFORE = 60;
export const CHECK_IN_CLOSES_MINUTES_AFTER = 120;

/**
 * Fallback window for a batch with no startTime/endTime recorded. Without this
 * an incompletely-configured batch would reject every scan, which reads as "the
 * QR code is broken" rather than "somebody has not filled in the schedule".
 */
const DEFAULT_SESSION_START = '06:00';
const DEFAULT_SESSION_END = '21:00';

export interface SessionBatch {
  id: string;
  daysOfWeek?: Weekday[] | string[] | null;
  /** "HH:MM", 24-hour, academy-local. */
  startTime?: string | null;
  endTime?: string | null;
}

export interface ResolvedSession {
  /** Deterministic: the same batch and day always produce this exact string. */
  sessionId: string;
  batchId: string;
  /** "YYYY-MM-DD" in IST. The session's calendar date. */
  date: string;
  weekday: Weekday;
  /** Absolute instants for the scheduled start/end of this session. */
  startsAt: Date;
  endsAt: Date;
  /** The window within which a check-in is accepted. */
  opensAt: Date;
  closesAt: Date;
}

/** "YYYY-MM-DD" for an instant, in IST. */
export function sessionDateKey(at: Date): string {
  return localDateKey(at, IST_OFFSET_MINUTES);
}

export function weekdayOf(at: Date): Weekday {
  const shifted = new Date(at.getTime() + IST_OFFSET_MINUTES * 60_000);
  return WEEKDAYS[shifted.getUTCDay()];
}

/**
 * The session identifier both modes derive independently.
 *
 * This string is the idempotency key for the whole feature: it is what the
 * attendance record is upserted on and what the messaging dedupeKey is built
 * from. Its stability is the reason a parent scanning at the gate and a coach
 * ticking the same child ten minutes later produce one record and one message.
 */
export function makeSessionId(batchId: string, date: string): string {
  return `${batchId}:${date}`;
}

/** Parses "HH:MM" into minutes past midnight; null if malformed. */
function parseClock(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function atLocalMinutes(reference: Date, minutesPastMidnight: number): Date {
  const { year, month, day } = toLocalParts(reference, IST_OFFSET_MINUTES);
  return fromLocalParts(
    {
      year,
      month,
      day,
      hour: Math.floor(minutesPastMidnight / 60),
      minute: minutesPastMidnight % 60,
    },
    IST_OFFSET_MINUTES
  );
}

/**
 * Resolves the session a given instant falls on, for a given batch.
 *
 * Deliberately does NOT check whether the batch actually meets that weekday —
 * that is a separate question with a separate answer (see `isScheduledDay`). A
 * coach marking a one-off extra practice on a Wednesday should not be blocked
 * because the batch is configured as Tue/Thu; a parent's unattended QR scan on
 * a day with no practice should be.
 */
export function resolveSession(batch: SessionBatch, at: Date): ResolvedSession {
  const date = sessionDateKey(at);
  const startMinutes = parseClock(batch.startTime) ?? parseClock(DEFAULT_SESSION_START)!;
  const endMinutesRaw = parseClock(batch.endTime) ?? parseClock(DEFAULT_SESSION_END)!;
  // A batch configured to end before it starts is a data error, not a
  // zero-length session — treat the end as one hour after the start so the
  // window is still usable while somebody fixes the batch.
  const endMinutes = endMinutesRaw > startMinutes ? endMinutesRaw : startMinutes + 60;

  const startsAt = atLocalMinutes(at, startMinutes);
  const endsAt = atLocalMinutes(at, endMinutes);

  return {
    sessionId: makeSessionId(batch.id, date),
    batchId: batch.id,
    date,
    weekday: weekdayOf(at),
    startsAt,
    endsAt,
    opensAt: new Date(startsAt.getTime() - CHECK_IN_OPENS_MINUTES_BEFORE * 60_000),
    closesAt: new Date(endsAt.getTime() + CHECK_IN_CLOSES_MINUTES_AFTER * 60_000),
  };
}

/** Does this batch's recurring schedule include the session's weekday? */
export function isScheduledDay(batch: SessionBatch, session: ResolvedSession): boolean {
  const days = (batch.daysOfWeek ?? []) as string[];
  // A batch with no schedule recorded meets on any day. Refusing every scan
  // because nobody filled in daysOfWeek would present as a broken QR code.
  if (days.length === 0) return true;
  return days.map((d) => String(d).toLowerCase()).includes(session.weekday);
}

export type CheckInVerdict =
  | { ok: true; session: ResolvedSession }
  | { ok: false; reason: string; code: CheckInRejection };

export type CheckInRejection = 'too_early' | 'too_late' | 'not_a_training_day';

function clockInIst(at: Date): string {
  const { hour, minute } = toLocalParts(at, IST_OFFSET_MINUTES);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Is a QR scan at this instant a legitimate check-in?
 *
 * THIS IS THE SECURITY BOUNDARY OF THE PARENT-FACING MODE. The QR code is
 * static and printed on a wall, so it will be photographed — that is not a
 * breach, it is the expected lifecycle of a printed code. What stops a
 * photograph being a permanent skeleton key is that it only means anything
 * inside a window around an actual scheduled session. A code snapped on Tuesday
 * evening does nothing at 3am, and nothing at all on a Sunday the batch does not
 * meet.
 *
 * The remaining exposure — a parent marking their child present from the car
 * park during a real session — is deliberately accepted. The coach's checklist
 * is the authoritative record and overwrites it; chasing that further would mean
 * geofencing every academy, which costs more than the fraud it prevents.
 */
export function validateCheckIn(batch: SessionBatch, at: Date): CheckInVerdict {
  const session = resolveSession(batch, at);

  if (!isScheduledDay(batch, session)) {
    return {
      ok: false,
      code: 'not_a_training_day',
      reason: `This batch does not train on ${session.weekday}s.`,
    };
  }

  if (at.getTime() < session.opensAt.getTime()) {
    return {
      ok: false,
      code: 'too_early',
      reason: `Check-in opens at ${clockInIst(session.opensAt)}, ${CHECK_IN_OPENS_MINUTES_BEFORE} minutes before the session starts.`,
    };
  }

  if (at.getTime() > session.closesAt.getTime()) {
    return {
      ok: false,
      code: 'too_late',
      reason: `Check-in for today's session closed at ${clockInIst(session.closesAt)}. Ask your coach to mark attendance.`,
    };
  }

  return { ok: true, session };
}

/**
 * The instant a coach's calendar date should be recorded at.
 *
 * A coach marking yesterday's register supplies a date with no time. Storing it
 * at UTC midnight files a 05:30 IST timestamp, which renders as the previous day
 * for anyone reading it locally. Midday sidesteps that in both directions.
 */
export function coachMarkInstant(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const [, year, month, day] = match;
  return fromLocalParts(
    { year: Number(year), month: Number(month) - 1, day: Number(day), hour: 12, minute: 0 },
    IST_OFFSET_MINUTES
  );
}
