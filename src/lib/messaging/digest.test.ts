import { describe, it, expect } from 'vitest';
import {
  isDigestDay,
  startOfDigestWeek,
  summariseWeekAttendance,
  latestAchievementThisWeek,
} from './digest';
import { DEFAULT_SCHEDULING_CONFIG } from './scheduling';
import { formatCheckInTime } from './consumers';

const CONFIG = DEFAULT_SCHEDULING_CONFIG;
const IST = CONFIG.timezoneOffsetMinutes;

function ist(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - IST * 60_000);
}

describe('isDigestDay', () => {
  it('is true only on Sunday, in the parent\'s local timezone', () => {
    // 26 July 2026 is a Sunday.
    expect(isDigestDay(ist(2026, 7, 26, 19), CONFIG)).toBe(true);
    expect(isDigestDay(ist(2026, 7, 25, 19), CONFIG)).toBe(false); // Saturday
    expect(isDigestDay(ist(2026, 7, 27, 19), CONFIG)).toBe(false); // Monday
  });

  it('uses the IST day, not the UTC day', () => {
    // 00:30 IST Sunday is 19:00 UTC Saturday. A UTC check would say "not Sunday"
    // and skip the digest for anyone whose tick ran early.
    const earlySundayIst = ist(2026, 7, 26, 0, 30);
    expect(earlySundayIst.toISOString()).toContain('2026-07-25');
    expect(isDigestDay(earlySundayIst, CONFIG)).toBe(true);
  });

  it('is true late on Sunday evening, when the digest actually sends', () => {
    expect(isDigestDay(ist(2026, 7, 26, 20, 45), CONFIG)).toBe(true);
  });
});

describe('startOfDigestWeek', () => {
  it('returns the Monday of the week ending on the given Sunday', () => {
    const weekStart = startOfDigestWeek(ist(2026, 7, 26, 19), CONFIG);
    const local = new Date(weekStart.getTime() + IST * 60_000);
    expect(local.getUTCDate()).toBe(20); // Monday 20 July
    expect(local.getUTCDay()).toBe(1);
    expect(local.getUTCHours()).toBe(0);
  });

  it('spans exactly the six days before the reporting Sunday', () => {
    const sunday = ist(2026, 7, 26, 19);
    const weekStart = startOfDigestWeek(sunday, CONFIG);
    const days = (sunday.getTime() - weekStart.getTime()) / 86_400_000;
    expect(days).toBeGreaterThan(5.5);
    expect(days).toBeLessThan(7);
  });

  it('handles a month boundary', () => {
    // Sunday 2 Aug 2026 — its week starts Monday 27 July.
    const weekStart = startOfDigestWeek(ist(2026, 8, 2, 19), CONFIG);
    const local = new Date(weekStart.getTime() + IST * 60_000);
    expect(local.getUTCMonth()).toBe(6); // July
    expect(local.getUTCDate()).toBe(27);
  });
});

describe('summariseWeekAttendance', () => {
  const weekStart = ist(2026, 7, 20, 0);
  const weekEnd = ist(2026, 7, 26, 23, 59);

  it('counts present and total sessions within the week', () => {
    const summary = summariseWeekAttendance(
      [
        { date: ist(2026, 7, 20, 17), present: true },
        { date: ist(2026, 7, 21, 17), present: true },
        { date: ist(2026, 7, 22, 17), present: false },
        { date: ist(2026, 7, 24, 17), present: true },
        { date: ist(2026, 7, 25, 17), present: true },
      ],
      weekStart,
      weekEnd
    );
    expect(summary).toEqual({ present: 4, total: 5, percent: 80 });
  });

  it('excludes sessions outside the week', () => {
    const summary = summariseWeekAttendance(
      [
        { date: ist(2026, 7, 19, 17), present: true }, // previous week
        { date: ist(2026, 7, 22, 17), present: true },
        { date: ist(2026, 7, 27, 17), present: true }, // next week
      ],
      weekStart,
      weekEnd
    );
    expect(summary.total).toBe(1);
  });

  it('returns zero totals for a week with no sessions', () => {
    // The digest skips these students entirely rather than sending
    // "Attendance: 0 of 0 sessions", which reads as a broken system.
    expect(summariseWeekAttendance([], weekStart, weekEnd)).toEqual({
      present: 0,
      total: 0,
      percent: 0,
    });
  });

  it('reports 0% rather than dividing by zero when nobody attended', () => {
    const summary = summariseWeekAttendance(
      [
        { date: ist(2026, 7, 21, 17), present: false },
        { date: ist(2026, 7, 23, 17), present: false },
      ],
      weekStart,
      weekEnd
    );
    expect(summary).toEqual({ present: 0, total: 2, percent: 0 });
  });

  it('rounds the percentage to a whole number', () => {
    const summary = summariseWeekAttendance(
      [
        { date: ist(2026, 7, 20, 17), present: true },
        { date: ist(2026, 7, 21, 17), present: true },
        { date: ist(2026, 7, 22, 17), present: false },
      ],
      weekStart,
      weekEnd
    );
    // 2/3 = 66.66% → 67, not "66.66666666666667%"
    expect(summary.percent).toBe(67);
  });

  it('accepts ISO date strings as well as Date objects', () => {
    const summary = summariseWeekAttendance(
      [{ date: ist(2026, 7, 21, 17).toISOString(), present: true }],
      weekStart,
      weekEnd
    );
    expect(summary.total).toBe(1);
  });

  it('ignores unparseable dates instead of throwing', () => {
    const summary = summariseWeekAttendance(
      [
        { date: 'not a date', present: true },
        { date: ist(2026, 7, 21, 17), present: true },
      ],
      weekStart,
      weekEnd
    );
    expect(summary.total).toBe(1);
  });
});

describe('latestAchievementThisWeek', () => {
  const weekStart = ist(2026, 7, 20, 0);
  const weekEnd = ist(2026, 7, 26, 23, 59);

  it("prefers the coach's own remarks", () => {
    const line = latestAchievementThisWeek(
      [{ remarks: 'Best batting form all season', evaluatedAt: ist(2026, 7, 23) }],
      weekStart,
      weekEnd
    );
    expect(line).toBe('Best batting form all season');
  });

  it('picks the most recent entry in the week', () => {
    const line = latestAchievementThisWeek(
      [
        { remarks: 'Earlier note', evaluatedAt: ist(2026, 7, 21) },
        { remarks: 'Latest note', evaluatedAt: ist(2026, 7, 25) },
      ],
      weekStart,
      weekEnd
    );
    expect(line).toBe('Latest note');
  });

  it('falls back to the score when there are no remarks', () => {
    const line = latestAchievementThisWeek(
      [{ category: 'Batting', score: 8, maxScore: 10, evaluatedAt: ist(2026, 7, 23) }],
      weekStart,
      weekEnd
    );
    expect(line).toBe('Batting 8/10');
  });

  it('returns null for a quiet week', () => {
    expect(latestAchievementThisWeek([], weekStart, weekEnd)).toBeNull();
  });

  it('ignores achievements outside the week', () => {
    const line = latestAchievementThisWeek(
      [{ remarks: 'Last month', evaluatedAt: ist(2026, 6, 15) }],
      weekStart,
      weekEnd
    );
    expect(line).toBeNull();
  });

  it('truncates a very long remark rather than blowing the template limit', () => {
    const line = latestAchievementThisWeek(
      [{ remarks: 'x'.repeat(500), evaluatedAt: ist(2026, 7, 23) }],
      weekStart,
      weekEnd
    );
    expect(line!.length).toBeLessThanOrEqual(120);
  });
});

describe('formatCheckInTime', () => {
  it('renders IST wall-clock time with AM/PM, as a parent reads it', () => {
    expect(formatCheckInTime(ist(2026, 7, 25, 17, 2))).toBe('5:02 PM');
    expect(formatCheckInTime(ist(2026, 7, 25, 9, 30))).toBe('9:30 AM');
  });

  it('renders noon and midnight as 12, not 0', () => {
    expect(formatCheckInTime(ist(2026, 7, 25, 12, 0))).toBe('12:00 PM');
    expect(formatCheckInTime(ist(2026, 7, 25, 0, 5))).toBe('12:05 AM');
  });

  it('zero-pads the minutes', () => {
    expect(formatCheckInTime(ist(2026, 7, 25, 17, 5))).toBe('5:05 PM');
  });

  it('converts from UTC, not from the server\'s local timezone', () => {
    // 11:32 UTC is 17:02 IST. A server in another zone must still say 5:02 PM.
    expect(formatCheckInTime(new Date('2026-07-25T11:32:00Z'))).toBe('5:02 PM');
  });

  it('returns an empty string for an invalid date rather than "Invalid Date"', () => {
    // Template validation would hard-fail on "Invalid Date", which is the right
    // outcome — but returning empty makes the missing-variable error clearer.
    expect(formatCheckInTime('nonsense')).toBe('');
  });
});
