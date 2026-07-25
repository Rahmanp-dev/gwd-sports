import { describe, it, expect } from 'vitest';
import {
  resolveSession,
  validateCheckIn,
  isScheduledDay,
  makeSessionId,
  sessionDateKey,
  weekdayOf,
  coachMarkInstant,
  CHECK_IN_OPENS_MINUTES_BEFORE,
  CHECK_IN_CLOSES_MINUTES_AFTER,
  type SessionBatch,
} from './session';

const IST = 330;

/** A Date from an IST wall-clock time, so tests read in the coach's terms. */
function ist(day: number, hour: number, minute = 0): Date {
  // July 2026: the 20th is a Monday, so day-of-week maths is easy to follow.
  return new Date(Date.UTC(2026, 6, day, hour, minute) - IST * 60_000);
}

const EVENING_BATCH: SessionBatch = {
  id: 'batch1',
  daysOfWeek: ['monday', 'wednesday', 'friday'],
  startTime: '17:00',
  endTime: '18:30',
};

describe('session identity', () => {
  it('is deterministic — two writers compute the same id', () => {
    const fromParent = resolveSession(EVENING_BATCH, ist(20, 17, 2));
    const fromCoach = resolveSession(EVENING_BATCH, ist(20, 18, 25));
    expect(fromParent.sessionId).toBe(fromCoach.sessionId);
    expect(fromParent.sessionId).toBe(makeSessionId('batch1', '2026-07-20'));
  });

  it('files a session under the IST calendar date, not the UTC one', () => {
    // 20 July 21:00 IST is 15:30 UTC the same day — but 20 July 02:00 IST is
    // 19 July 20:30 UTC. The session must follow the coach's calendar.
    expect(sessionDateKey(ist(20, 21, 0))).toBe('2026-07-20');
    expect(sessionDateKey(ist(20, 2, 0))).toBe('2026-07-20');
  });

  it('a late evening session does not roll into the next day', () => {
    const session = resolveSession({ ...EVENING_BATCH, startTime: '21:00', endTime: '22:30' }, ist(18, 21, 30));
    expect(session.date).toBe('2026-07-18');
    expect(session.weekday).toBe('saturday');
  });

  it('reads the weekday in IST', () => {
    expect(weekdayOf(ist(20, 12))).toBe('monday');
    expect(weekdayOf(ist(26, 12))).toBe('sunday');
  });
});

describe('the check-in window', () => {
  it('accepts a scan during the session', () => {
    const verdict = validateCheckIn(EVENING_BATCH, ist(20, 17, 15));
    expect(verdict.ok).toBe(true);
  });

  it('accepts a scan exactly when the window opens', () => {
    const opensAt = ist(20, 17 - CHECK_IN_OPENS_MINUTES_BEFORE / 60, 0);
    expect(validateCheckIn(EVENING_BATCH, opensAt).ok).toBe(true);
  });

  it('rejects a scan before the window opens, and says when it opens', () => {
    const verdict = validateCheckIn(EVENING_BATCH, ist(20, 15, 0));
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.code).toBe('too_early');
    expect(verdict.reason).toMatch(/16:00/);
  });

  it('accepts a late scan within the grace period', () => {
    // Session ends 18:30; the window stays open two hours past that.
    expect(validateCheckIn(EVENING_BATCH, ist(20, 20, 0)).ok).toBe(true);
  });

  it('rejects a scan after the window closes', () => {
    const verdict = validateCheckIn(EVENING_BATCH, ist(20, 21, 30));
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.code).toBe('too_late');
    expect(verdict.reason).toMatch(/ask your coach/i);
  });

  /**
   * The reason the window exists at all. The QR code is printed on a wall and
   * WILL be photographed — that is its lifecycle, not a breach. What stops the
   * photograph being a permanent skeleton key is that it means nothing outside
   * a real session.
   */
  it('a photographed code does nothing at 3am', () => {
    const verdict = validateCheckIn(EVENING_BATCH, ist(21, 3, 0));
    expect(verdict.ok).toBe(false);
  });

  it('a photographed code does nothing on a day the batch does not meet', () => {
    const verdict = validateCheckIn(EVENING_BATCH, ist(21, 17, 15)); // Tuesday
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(verdict.code).toBe('not_a_training_day');
    expect(verdict.reason).toMatch(/tuesday/i);
  });

  it('computes the window boundaries from the configured times', () => {
    const session = resolveSession(EVENING_BATCH, ist(20, 17, 15));
    expect(session.opensAt.getTime()).toBe(
      session.startsAt.getTime() - CHECK_IN_OPENS_MINUTES_BEFORE * 60_000
    );
    expect(session.closesAt.getTime()).toBe(
      session.endsAt.getTime() + CHECK_IN_CLOSES_MINUTES_AFTER * 60_000
    );
  });
});

describe('incompletely configured batches stay usable', () => {
  /**
   * These cases all have the same reasoning: an unconfigured batch that rejects
   * every scan presents to a parent as "the QR code is broken", when the real
   * problem is that somebody has not filled in the schedule. Failing open on
   * configuration and closed on time is the right split.
   */
  it('a batch with no schedule meets on any day', () => {
    const batch: SessionBatch = { id: 'b', startTime: '17:00', endTime: '18:30' };
    const session = resolveSession(batch, ist(21, 17, 15));
    expect(isScheduledDay(batch, session)).toBe(true);
    expect(validateCheckIn(batch, ist(21, 17, 15)).ok).toBe(true);
  });

  it('a batch with no times falls back to a wide daytime window', () => {
    const batch: SessionBatch = { id: 'b', daysOfWeek: ['monday'] };
    expect(validateCheckIn(batch, ist(20, 9, 0)).ok).toBe(true);
    expect(validateCheckIn(batch, ist(20, 3, 0)).ok).toBe(false);
  });

  it('a batch ending before it starts still yields a usable window', () => {
    const batch: SessionBatch = { id: 'b', startTime: '18:00', endTime: '09:00' };
    const session = resolveSession(batch, ist(20, 18, 30));
    expect(session.endsAt.getTime()).toBeGreaterThan(session.startsAt.getTime());
    expect(validateCheckIn(batch, ist(20, 18, 30)).ok).toBe(true);
  });

  it('ignores malformed times rather than throwing', () => {
    const batch: SessionBatch = { id: 'b', startTime: '25:99', endTime: 'nonsense' };
    expect(() => resolveSession(batch, ist(20, 12))).not.toThrow();
    expect(validateCheckIn(batch, ist(20, 12)).ok).toBe(true);
  });

  it('matches weekday names case-insensitively', () => {
    const batch: SessionBatch = { id: 'b', daysOfWeek: ['MONDAY'] as any };
    const session = resolveSession(batch, ist(20, 12));
    expect(isScheduledDay(batch, session)).toBe(true);
  });
});

describe('isScheduledDay is separate from the window on purpose', () => {
  /**
   * A coach running a one-off extra practice on an unscheduled Wednesday must
   * not be blocked. A parent's unattended scan on that same day should be. So
   * the day check is exposed separately rather than folded into resolveSession.
   */
  it('resolveSession works on an unscheduled day', () => {
    const session = resolveSession(EVENING_BATCH, ist(21, 17, 15)); // Tuesday
    expect(session.date).toBe('2026-07-21');
    expect(isScheduledDay(EVENING_BATCH, session)).toBe(false);
  });
});

describe('coachMarkInstant', () => {
  it('stores a coach-supplied date at IST midday, not UTC midnight', () => {
    const instant = coachMarkInstant('2026-07-20');
    expect(instant).not.toBeNull();
    // Midday IST on the 20th is 06:30 UTC on the 20th — unambiguous in both
    // timezones, unlike midnight which shifts across the date boundary.
    expect(instant!.toISOString()).toBe('2026-07-20T06:30:00.000Z');
    expect(sessionDateKey(instant!)).toBe('2026-07-20');
  });

  it('rejects a malformed date rather than inventing one', () => {
    expect(coachMarkInstant('20-07-2026')).toBeNull();
    expect(coachMarkInstant('')).toBeNull();
    expect(coachMarkInstant('2026-7-2')).toBeNull();
  });
});
