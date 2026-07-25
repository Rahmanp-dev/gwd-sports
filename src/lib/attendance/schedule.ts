import type { Weekday } from '@/lib/attendance/session';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BATCH SCHEDULE VALIDATION — PURE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A batch's schedule is not decoration. `daysOfWeek`, `startTime` and `endTime`
 * are what the QR check-in window is computed from, so a batch saved with a
 * malformed time does not fail loudly — it silently falls through to the wide
 * fail-open default and accepts a scan at almost any hour. That is the failure
 * this module exists to make impossible at the point of writing.
 * ════════════════════════════════════════════════════════════════════════════
 */

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface ScheduleInput {
  daysOfWeek?: unknown;
  startTime?: unknown;
  endTime?: unknown;
}

export interface NormalisedSchedule {
  daysOfWeek: Weekday[];
  startTime: string | null;
  endTime: string | null;
}

export type ScheduleResult =
  | { ok: true; schedule: NormalisedSchedule }
  | { ok: false; reason: string };

function minutes(clock: string): number {
  const [h, m] = clock.split(':');
  return Number(h) * 60 + Number(m);
}

/**
 * Validates and normalises a submitted schedule.
 *
 * Empty is allowed and means "no schedule recorded" — the import creates
 * batches this way and refusing them here would make every imported batch
 * uneditable. What is NOT allowed is a half-valid schedule: a malformed time,
 * an unrecognised weekday, or an end before a start. Those look like a
 * configured batch while behaving like an unconfigured one, which is worse than
 * either.
 */
export function validateSchedule(input: ScheduleInput): ScheduleResult {
  let daysOfWeek: Weekday[] = [];

  if (input.daysOfWeek !== undefined && input.daysOfWeek !== null) {
    if (!Array.isArray(input.daysOfWeek)) {
      return { ok: false, reason: 'daysOfWeek must be a list.' };
    }
    const seen = new Set<string>();
    for (const raw of input.daysOfWeek) {
      const day = String(raw).trim().toLowerCase();
      if (!WEEKDAYS.includes(day as Weekday)) {
        return { ok: false, reason: `"${raw}" is not a day of the week.` };
      }
      seen.add(day);
    }
    // Stored in week order rather than click order, so the UI never has to sort
    // and two batches with the same days compare equal.
    daysOfWeek = WEEKDAYS.filter((day) => seen.has(day));
  }

  const startTime = normaliseClock(input.startTime);
  const endTime = normaliseClock(input.endTime);

  if (startTime === false) {
    return { ok: false, reason: 'Start time must look like 17:00.' };
  }
  if (endTime === false) {
    return { ok: false, reason: 'End time must look like 18:30.' };
  }

  // One time without the other is the shape that quietly produces a wrong
  // window: the missing half falls back to a default hours away from the real
  // session.
  if ((startTime && !endTime) || (!startTime && endTime)) {
    return {
      ok: false,
      reason: 'Set both a start and an end time, or neither.',
    };
  }

  if (startTime && endTime && minutes(endTime) <= minutes(startTime)) {
    return { ok: false, reason: 'The session has to end after it starts.' };
  }

  return { ok: true, schedule: { daysOfWeek, startTime, endTime } };
}

/** Returns the normalised clock, null if absent, or false if malformed. */
function normaliseClock(value: unknown): string | null | false {
  if (value === undefined || value === null || value === '') return null;
  const clock = String(value).trim();
  return CLOCK_PATTERN.test(clock) ? clock : false;
}

/**
 * Is this batch's QR code effectively unrestricted?
 *
 * Both halves matter. With no `daysOfWeek` a scan is accepted on any day of the
 * week; with no times the window falls back to 06:00–21:00. A batch missing
 * either is one whose printed code is far looser than an owner would assume,
 * and the UI has to say so rather than showing a reassuring green tick.
 */
export function scheduleGaps(batch: {
  daysOfWeek?: unknown;
  startTime?: unknown;
  endTime?: unknown;
}): string[] {
  const gaps: string[] = [];
  if (!Array.isArray(batch.daysOfWeek) || batch.daysOfWeek.length === 0) {
    gaps.push('no training days — check-in is accepted any day of the week');
  }
  if (!batch.startTime || !batch.endTime) {
    gaps.push('no session times — check-in is accepted from 05:00 to 23:00');
  }
  return gaps;
}
