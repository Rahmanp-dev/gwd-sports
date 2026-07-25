import { describe, it, expect } from 'vitest';
import { normaliseWorkingDay } from './Academy';

/**
 * Regression cover for a real production failure.
 *
 * Academies created before the weekday enum existed hold "Mon", "Tue", "Wed".
 * Mongoose validates the WHOLE document on save(), so those values failed every
 * unrelated write to the academy — and took the student import down with them,
 * 500-ing after every student had already been created.
 */
describe('normaliseWorkingDay', () => {
  it('accepts the abbreviations actually stored in the database', () => {
    expect(normaliseWorkingDay('Mon')).toBe('monday');
    expect(normaliseWorkingDay('Tue')).toBe('tuesday');
    expect(normaliseWorkingDay('Wed')).toBe('wednesday');
    expect(normaliseWorkingDay('Thu')).toBe('thursday');
    expect(normaliseWorkingDay('Fri')).toBe('friday');
    expect(normaliseWorkingDay('Sat')).toBe('saturday');
    expect(normaliseWorkingDay('Sun')).toBe('sunday');
  });

  it('leaves canonical values alone', () => {
    for (const day of [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]) {
      expect(normaliseWorkingDay(day)).toBe(day);
    }
  });

  it('handles case and stray whitespace', () => {
    expect(normaliseWorkingDay('MONDAY')).toBe('monday');
    expect(normaliseWorkingDay('  Monday  ')).toBe('monday');
    expect(normaliseWorkingDay('MON')).toBe('monday');
  });

  /**
   * This normalises; it does not silence. A value that is genuinely wrong must
   * still reach the enum and be rejected, or the schema stops meaning anything.
   */
  it('does not invent a day from a coincidental prefix', () => {
    expect(normaliseWorkingDay('sunflower')).toBe('sunflower');
    expect(normaliseWorkingDay('monsoon')).toBe('monsoon');
    expect(normaliseWorkingDay('satellite')).toBe('satellite');
  });

  it('passes through anything that is not a usable string', () => {
    expect(normaliseWorkingDay('')).toBe('');
    expect(normaliseWorkingDay('   ')).toBe('   ');
    expect(normaliseWorkingDay(null)).toBeNull();
    expect(normaliseWorkingDay(undefined)).toBeUndefined();
    expect(normaliseWorkingDay(7)).toBe(7);
  });
});
