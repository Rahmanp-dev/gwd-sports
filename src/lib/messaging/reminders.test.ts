import { describe, it, expect } from 'vitest';
import { stageFor, daysBetween, currentCycleDueDate } from './reminders';
import { DEFAULT_SCHEDULING_CONFIG } from './scheduling';
import { TEMPLATES } from './templates';

const CONFIG = DEFAULT_SCHEDULING_CONFIG;
const IST = CONFIG.timezoneOffsetMinutes;

function ist(year: number, month: number, day: number, hour = 12): Date {
  return new Date(Date.UTC(year, month - 1, day, hour) - IST * 60_000);
}

describe('fee cadence stages', () => {
  const dueDate = ist(2026, 8, 5, 0); // 5 Aug 2026

  it('fires at exactly T-5, due date, T+3, T+7 and T+15', () => {
    expect(stageFor(ist(2026, 7, 31), dueDate)).toBe('t5');
    expect(stageFor(ist(2026, 8, 5), dueDate)).toBe('due');
    expect(stageFor(ist(2026, 8, 8), dueDate)).toBe('overdue3');
    expect(stageFor(ist(2026, 8, 12), dueDate)).toBe('overdue7');
    expect(stageFor(ist(2026, 8, 20), dueDate)).toBe('overdue15');
  });

  it('fires on NO other day — the sweep runs daily and most days are quiet', () => {
    const quietDays = [
      ist(2026, 7, 29), // T-7
      ist(2026, 8, 1),  // T-4
      ist(2026, 8, 4),  // T-1
      ist(2026, 8, 6),  // T+1
      ist(2026, 8, 7),  // T+2
      ist(2026, 8, 9),  // T+4
      ist(2026, 8, 11), // T+6
      ist(2026, 8, 13), // T+8
      ist(2026, 8, 19), // T+14
      ist(2026, 8, 21), // T+16
    ];
    for (const day of quietDays) {
      expect(stageFor(day, dueDate), day.toISOString()).toBeNull();
    }
  });

  it('does not depend on the hour the cron happens to run', () => {
    // Both boundaries of the T+3 day must resolve to the same stage, or a cron
    // that drifts from 09:00 to 23:00 would skip or duplicate a stage.
    for (const hour of [0, 1, 8, 12, 18, 23]) {
      expect(stageFor(ist(2026, 8, 8, hour), dueDate)).toBe('overdue3');
    }
  });
});

describe('the cadence stops messaging parents after T+3', () => {
  it('has a parent template for T-5, due and T+3', () => {
    expect(TEMPLATES.fee_reminder_t5).toBeDefined();
    expect(TEMPLATES.fee_due_today).toBeDefined();
    expect(TEMPLATES.fee_overdue_3).toBeDefined();
  });

  it('has NO parent template for T+7 or T+15 — those are owner-only', () => {
    // The design rule: a fourth automated chase is how a number gets blocked.
    // Escalation past T+3 is the owner's relationship to manage.
    expect(TEMPLATES.fee_overdue_7).toBeUndefined();
    expect(TEMPLATES.fee_overdue_15).toBeUndefined();

    const parentFacingFeeTemplates = Object.keys(TEMPLATES).filter((key) =>
      key.startsWith('fee_')
    );
    expect(parentFacingFeeTemplates.sort()).toEqual([
      'fee_due_today',
      'fee_overdue_3',
      'fee_reminder_t5',
    ]);
  });
});

describe('daysBetween', () => {
  it('counts whole days regardless of time of day', () => {
    expect(daysBetween(ist(2026, 8, 5, 23), ist(2026, 8, 8, 1))).toBe(3);
    expect(daysBetween(ist(2026, 8, 5, 0), ist(2026, 8, 8, 23))).toBe(3);
  });

  it('is negative before the reference date', () => {
    expect(daysBetween(ist(2026, 8, 5), ist(2026, 7, 31))).toBe(-5);
  });

  it('is zero on the same day', () => {
    expect(daysBetween(ist(2026, 8, 5, 1), ist(2026, 8, 5, 22))).toBe(0);
  });

  it('crosses month and year boundaries', () => {
    expect(daysBetween(ist(2026, 12, 28), ist(2027, 1, 4))).toBe(7);
    expect(daysBetween(ist(2026, 1, 31), ist(2026, 2, 3))).toBe(3);
  });
});

describe('currentCycleDueDate', () => {
  it("returns this month's due date when it is still upcoming", () => {
    const due = currentCycleDueDate(ist(2026, 8, 1), 5, CONFIG);
    expect(daysBetween(due, ist(2026, 8, 5))).toBe(0);
  });

  it("stays on this month's due date through the overdue window", () => {
    // On 20 Aug we are 15 days past 5 Aug and must still be chasing that cycle,
    // not looking ahead to September.
    const due = currentCycleDueDate(ist(2026, 8, 20), 5, CONFIG);
    expect(daysBetween(due, ist(2026, 8, 20))).toBe(15);
  });

  it("falls back to last month's date very early in a month", () => {
    // On 2 Aug with a due day of 28, this month's 28th is 26 days away — the
    // cycle actually in play is July's.
    const due = currentCycleDueDate(ist(2026, 8, 2), 28, CONFIG);
    expect(daysBetween(due, ist(2026, 8, 2))).toBe(5);
  });

  it('never produces a date that does not exist in February', () => {
    // feeDueDayOfMonth is capped at 28 in the schema precisely for this.
    const due = currentCycleDueDate(ist(2026, 2, 10), 31, CONFIG);
    expect(Number.isNaN(due.getTime())).toBe(false);
    const parts = new Date(due.getTime() + IST * 60_000);
    expect(parts.getUTCDate()).toBeLessThanOrEqual(28);
    expect(parts.getUTCMonth()).toBe(1); // still February
  });

  it('clamps a nonsensical due day rather than throwing', () => {
    expect(Number.isNaN(currentCycleDueDate(ist(2026, 8, 10), 0, CONFIG).getTime())).toBe(false);
    expect(Number.isNaN(currentCycleDueDate(ist(2026, 8, 10), 99, CONFIG).getTime())).toBe(false);
  });

  it('produces a due date at local midnight, so stage maths is stable', () => {
    const due = currentCycleDueDate(ist(2026, 8, 1), 5, CONFIG);
    const local = new Date(due.getTime() + IST * 60_000);
    expect(local.getUTCHours()).toBe(0);
    expect(local.getUTCMinutes()).toBe(0);
  });
});

describe('a full cycle walk-through: one student, due 5 Aug', () => {
  const dueDate = ist(2026, 8, 5, 0);

  /** Every stage that fires across a 30-day window. */
  const timeline: Array<{ day: number; stage: string | null }> = [];
  for (let day = 1; day <= 25; day++) {
    timeline.push({ day, stage: stageFor(ist(2026, 8, day), dueDate) });
  }
  // Include the T-5 day, which falls in July.
  const july31 = stageFor(ist(2026, 7, 31), dueDate);

  it('produces exactly five stage events across the whole cycle', () => {
    const fired = timeline.filter((entry) => entry.stage !== null);
    expect(july31).toBe('t5');
    expect(fired.map((entry) => `${entry.day}:${entry.stage}`)).toEqual([
      '5:due',
      '8:overdue3',
      '12:overdue7',
      '20:overdue15',
    ]);
  });

  it('sends the parent 3 messages and raises 3 owner alerts, not 5 of each', () => {
    // T-5, due, T+3 message the parent. T+3, T+7, T+15 alert the owner.
    // T+3 does both — that is the one overlap, and it is intentional.
    const parentStages = ['t5', 'due', 'overdue3'];
    const ownerStages = ['overdue3', 'overdue7', 'overdue15'];

    const allStages = [july31, ...timeline.map((t) => t.stage)].filter(Boolean) as string[];

    expect(allStages.filter((s) => parentStages.includes(s))).toHaveLength(3);
    expect(allStages.filter((s) => ownerStages.includes(s))).toHaveLength(3);
  });
});
