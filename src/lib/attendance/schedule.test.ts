import { describe, it, expect } from 'vitest';
import { validateSchedule, scheduleGaps, WEEKDAYS } from './schedule';
import { validateCheckIn } from './session';

function accepted(input: any) {
  const result = validateSchedule(input);
  if (!result.ok) throw new Error(`expected acceptance, got: ${result.reason}`);
  return result.schedule;
}

function rejected(input: any): string {
  const result = validateSchedule(input);
  if (result.ok) throw new Error('expected rejection, got acceptance');
  return result.reason;
}

describe('validateSchedule', () => {
  it('accepts a complete schedule', () => {
    const schedule = accepted({
      daysOfWeek: ['monday', 'wednesday'],
      startTime: '17:00',
      endTime: '18:30',
    });
    expect(schedule).toEqual({
      daysOfWeek: ['monday', 'wednesday'],
      startTime: '17:00',
      endTime: '18:30',
    });
  });

  it('accepts an empty schedule, because that is what the import creates', () => {
    // Refusing here would make every imported batch uneditable.
    expect(accepted({})).toEqual({ daysOfWeek: [], startTime: null, endTime: null });
    expect(accepted({ daysOfWeek: [], startTime: '', endTime: '' })).toEqual({
      daysOfWeek: [],
      startTime: null,
      endTime: null,
    });
  });

  it('stores days in week order, not click order', () => {
    const schedule = accepted({ daysOfWeek: ['friday', 'monday', 'wednesday'] });
    expect(schedule.daysOfWeek).toEqual(['monday', 'wednesday', 'friday']);
  });

  it('de-duplicates days', () => {
    expect(accepted({ daysOfWeek: ['monday', 'monday'] }).daysOfWeek).toEqual(['monday']);
  });

  it('normalises case and whitespace', () => {
    expect(accepted({ daysOfWeek: [' MONDAY '] }).daysOfWeek).toEqual(['monday']);
    expect(accepted({ startTime: ' 17:00 ', endTime: '18:30' }).startTime).toBe('17:00');
  });

  it('accepts every weekday it claims to', () => {
    expect(accepted({ daysOfWeek: WEEKDAYS }).daysOfWeek).toEqual(WEEKDAYS);
  });

  it('rejects an unrecognised day by name', () => {
    expect(rejected({ daysOfWeek: ['funday'] })).toMatch(/"funday" is not a day/);
  });

  it('rejects a non-list of days', () => {
    expect(rejected({ daysOfWeek: 'monday' })).toMatch(/must be a list/);
  });

  /**
   * The reason this module exists. A malformed time does not fail loudly at the
   * check-in endpoint — session.ts ignores it and falls back to a wide default,
   * so the batch looks configured while behaving as if it is not.
   */
  it('rejects a malformed time rather than letting it fall through', () => {
    expect(rejected({ startTime: '5pm', endTime: '18:30' })).toMatch(/17:00/);
    expect(rejected({ startTime: '17:00', endTime: '25:00' })).toMatch(/18:30/);
    expect(rejected({ startTime: '17:60', endTime: '18:30' })).toMatch(/17:00/);
    expect(rejected({ startTime: '7:00', endTime: '18:30' })).toMatch(/17:00/);
  });

  it('rejects one time without the other', () => {
    // The missing half falls back to a default hours away from the real session.
    expect(rejected({ startTime: '17:00' })).toMatch(/both a start and an end/);
    expect(rejected({ endTime: '18:30' })).toMatch(/both a start and an end/);
  });

  it('rejects an end at or before the start', () => {
    expect(rejected({ startTime: '18:00', endTime: '17:00' })).toMatch(/end after it starts/);
    expect(rejected({ startTime: '18:00', endTime: '18:00' })).toMatch(/end after it starts/);
  });

  it('accepts midnight boundaries', () => {
    expect(accepted({ startTime: '00:00', endTime: '23:59' })).toMatchObject({
      startTime: '00:00',
      endTime: '23:59',
    });
  });
});

describe('scheduleGaps', () => {
  it('reports nothing for a fully configured batch', () => {
    expect(
      scheduleGaps({ daysOfWeek: ['monday'], startTime: '17:00', endTime: '18:30' })
    ).toEqual([]);
  });

  it('names both gaps for a batch straight out of the import', () => {
    const gaps = scheduleGaps({});
    expect(gaps).toHaveLength(2);
    expect(gaps[0]).toMatch(/any day of the week/);
    expect(gaps[1]).toMatch(/05:00 to 23:00/);
  });

  it('reports only the missing half', () => {
    expect(scheduleGaps({ daysOfWeek: ['monday'] })).toHaveLength(1);
    expect(scheduleGaps({ startTime: '17:00', endTime: '18:30' })).toHaveLength(1);
  });

  /**
   * The warning has to describe the window the check-in endpoint ACTUALLY
   * enforces, or it is worse than no warning. These pin the two together: an
   * unscheduled batch really does accept a scan at 05:00 on a Sunday, and
   * really does reject one at 04:00.
   */
  it('matches what the check-in endpoint actually allows', () => {
    const unscheduled = { id: 'b' };
    const ist = (day: number, hour: number, minute = 0) =>
      new Date(Date.UTC(2026, 6, day, hour, minute) - 330 * 60_000);

    // 26 July 2026 is a Sunday — a day no batch would normally be configured for.
    expect(validateCheckIn(unscheduled, ist(26, 5, 0)).ok).toBe(true);
    expect(validateCheckIn(unscheduled, ist(26, 22, 59)).ok).toBe(true);
    expect(validateCheckIn(unscheduled, ist(26, 4, 0)).ok).toBe(false);
    expect(validateCheckIn(unscheduled, ist(26, 23, 30)).ok).toBe(false);
  });
});
