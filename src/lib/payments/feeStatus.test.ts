import { describe, it, expect } from 'vitest';
import { feeBannerState, currentCycleDueDate, LEAD_IN_DAYS } from './feeStatus';

/** Midday IST on the given local date, so nothing sits on a timezone edge. */
function ist(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, 12) - 330 * 60_000);
}

const OWED = { outstandingFees: 3000, feeDueDayOfMonth: 5 };

describe('currentCycleDueDate — must agree with the reminder cadence', () => {
  it('uses this month while the due date is still ahead', () => {
    const due = currentCycleDueDate(ist(2026, 8, 1), 5);
    expect(due.toISOString().slice(0, 10)).toBe('2026-08-04'); // 5 Aug 00:00 IST
  });

  it('keeps chasing this cycle for 20 days after the due date', () => {
    const due = currentCycleDueDate(ist(2026, 8, 24), 5);
    expect(due.toISOString().slice(0, 10)).toBe('2026-08-04');
  });

  it('rolls back to the previous month once this cycle is far in the future', () => {
    // On the 1st, the 28th of this month is 27 days away — beyond the 20-day
    // window — so the cycle being chased is last month's.
    const due = currentCycleDueDate(ist(2026, 8, 1), 28);
    expect(due.toISOString().slice(0, 10)).toBe('2026-07-27'); // 28 Jul IST
  });

  it('caps the day at 28 so it never lands on a date February lacks', () => {
    const due = currentCycleDueDate(ist(2026, 2, 10), 31);
    expect(due.toISOString().slice(0, 10)).toBe('2026-02-27'); // 28 Feb IST
  });

  it('floors the day at 1', () => {
    const due = currentCycleDueDate(ist(2026, 8, 10), 0);
    expect(due.toISOString().slice(0, 10)).toBe('2026-07-31'); // 1 Aug IST
  });
});

describe('feeBannerState — when the bar appears at all', () => {
  it('stays hidden when nothing is owed', () => {
    expect(feeBannerState({ ...OWED, outstandingFees: 0, now: ist(2026, 8, 5) }).show).toBe(false);
  });

  it('stays hidden on a credit balance rather than warning about it', () => {
    expect(feeBannerState({ ...OWED, outstandingFees: -500, now: ist(2026, 8, 5) }).show).toBe(false);
  });

  it('stays hidden when the due date is further out than the lead-in', () => {
    // Due on the 20th; on the 1st that is 19 days away, well beyond the
    // 7-day lead-in.
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 20, now: ist(2026, 8, 1) });
    expect(s.show).toBe(false);
  });

  it('keeps showing an unpaid balance well past the due date', () => {
    // The 20-day cycle rule means a fee due on the 5th is still THIS cycle on
    // the 20th — it is still owed, so the portal still says so. An earlier
    // version of this test assumed the banner rolled to next month and
    // vanished, which would have hidden a real debt.
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 5, now: ist(2026, 8, 20) });
    expect(s.show).toBe(true);
    expect(s.urgency).toBe('overdue');
  });

  it('appears exactly at the lead-in boundary and not a day earlier', () => {
    const on = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 20, now: ist(2026, 8, 13) });
    const before = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 20, now: ist(2026, 8, 12) });
    expect(on.show).toBe(true);
    expect(on.daysFromDue).toBe(-LEAD_IN_DAYS);
    expect(before.show).toBe(false);
  });

  it('ignores a non-numeric outstanding balance instead of rendering NaN', () => {
    const s = feeBannerState({ outstandingFees: NaN as any, feeDueDayOfMonth: 5, now: ist(2026, 8, 5) });
    expect(s.show).toBe(false);
  });
});

describe('feeBannerState — what it says', () => {
  it('counts down before the due date', () => {
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 20, now: ist(2026, 8, 17) });
    expect(s.urgency).toBe('upcoming');
    expect(s.headline).toBe('₹3,000 due in 3 days');
  });

  it('says tomorrow rather than "in 1 days"', () => {
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 20, now: ist(2026, 8, 19) });
    expect(s.headline).toBe('₹3,000 due tomorrow');
  });

  it('marks the due date itself', () => {
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 20, now: ist(2026, 8, 20) });
    expect(s.urgency).toBe('due-today');
    expect(s.headline).toBe('₹3,000 due today');
    expect(s.daysFromDue).toBe(0);
  });

  it('reports overdue with the day count', () => {
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 5, now: ist(2026, 8, 9) });
    expect(s.urgency).toBe('overdue');
    expect(s.headline).toBe('₹3,000 overdue');
    expect(s.detail).toContain('4 days ago');
  });

  it('says yesterday rather than "1 days ago"', () => {
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 5, now: ist(2026, 8, 6) });
    expect(s.detail).toContain('yesterday');
  });

  it('reassures rather than threatens when overdue', () => {
    // The product rule: a child is never restricted for a billing problem, so
    // the banner must not imply otherwise.
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 5, now: ist(2026, 8, 9) });
    expect(s.detail).toContain('Nothing on your record changes');
  });

  it('is loud while the message cadence is still chasing, and quiet after', () => {
    // The cadence sends at T-5, on the day, and at T+3, then stops. The banner
    // matches: it keeps stating the balance but stops shouting about it.
    const day1 = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 5, now: ist(2026, 8, 6) });
    const day3 = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 5, now: ist(2026, 8, 8) });
    const day4 = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: 5, now: ist(2026, 8, 9) });

    expect(day1.insistent).toBe(true);
    expect(day3.insistent).toBe(true);
    expect(day4.insistent).toBe(false);
    // Still shown, still accurate — just not shouting.
    expect(day4.show).toBe(true);
    expect(day4.headline).toContain('overdue');
  });

  it('never shouts about a balance with no due date behind it', () => {
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: null, now: ist(2026, 8, 5) });
    expect(s.insistent).toBe(false);
  });

  it('formats in the Indian numbering system', () => {
    const s = feeBannerState({ outstandingFees: 125000, feeDueDayOfMonth: 20, now: ist(2026, 8, 20) });
    expect(s.headline).toBe('₹1,25,000 due today');
  });

  it('shows a balance with no schedule, without inventing a date', () => {
    const s = feeBannerState({ outstandingFees: 3000, feeDueDayOfMonth: null, now: ist(2026, 8, 5) });
    expect(s.show).toBe(true);
    expect(s.dueDate).toBeNull();
    expect(s.urgency).toBe('upcoming'); // never escalated without evidence
    expect(s.headline).toBe('₹3,000 outstanding');
  });
});
