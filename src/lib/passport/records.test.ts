import { describe, it, expect } from 'vitest';
import {
  validateRecord,
  toPublicRecords,
  highestLevel,
  RECORD_KINDS,
  RECORD_LEVELS,
  MAX_SUMMARY,
} from './records';

const NOW = new Date('2026-07-30T12:00:00.000Z');

const valid = {
  kind: 'tournament',
  title: 'U-14 District Championship',
  startedOn: '2026-04-12',
};

describe('validateRecord — the gate on untrusted input', () => {
  it('accepts a minimal record', () => {
    const result = validateRecord(valid, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.title).toBe('U-14 District Championship');
    expect(result.record.kind).toBe('tournament');
    expect(result.record.endedOn).toBeNull();
  });

  it('rejects an unknown kind rather than defaulting one', () => {
    const result = validateRecord({ ...valid, kind: 'wedding' }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe('kind');
  });

  it('accepts every kind in the taxonomy', () => {
    for (const kind of RECORD_KINDS) {
      expect(validateRecord({ ...valid, kind }, NOW).ok).toBe(true);
    }
  });

  it('requires a title of at least two characters', () => {
    expect(validateRecord({ ...valid, title: '' }, NOW).ok).toBe(false);
    expect(validateRecord({ ...valid, title: '   ' }, NOW).ok).toBe(false);
    expect(validateRecord({ ...valid, title: 'a' }, NOW).ok).toBe(false);
    expect(validateRecord({ ...valid, title: 'ab' }, NOW).ok).toBe(true);
  });

  it('collapses runaway whitespace in text fields', () => {
    const result = validateRecord({ ...valid, title: '  State   Level    Meet  ' }, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.title).toBe('State Level Meet');
  });

  it('truncates a summary rather than rejecting a long one', () => {
    const result = validateRecord({ ...valid, summary: 'x'.repeat(900) }, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.summary).toHaveLength(MAX_SUMMARY);
  });

  it('rejects an unparseable start date instead of guessing', () => {
    const result = validateRecord({ ...valid, startedOn: 'last spring' }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe('startedOn');
  });

  it('rejects a year that is obviously a typo', () => {
    expect(validateRecord({ ...valid, startedOn: '1899-04-12' }, NOW).ok).toBe(false);
  });

  it('rejects a start date far in the future', () => {
    expect(validateRecord({ ...valid, startedOn: '2035-01-01' }, NOW).ok).toBe(false);
  });

  it('allows a near-future date, so an upcoming trial can be recorded', () => {
    expect(validateRecord({ ...valid, startedOn: '2026-09-01' }, NOW).ok).toBe(true);
  });

  it('rejects an end date before the start date', () => {
    const result = validateRecord({ ...valid, startedOn: '2026-04-12', endedOn: '2026-04-01' }, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe('endedOn');
  });

  it('treats an empty end date as absent, not as invalid', () => {
    const result = validateRecord({ ...valid, endedOn: '' }, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.endedOn).toBeNull();
  });

  it('rejects an unknown level but allows it to be omitted', () => {
    expect(validateRecord({ ...valid, level: 'galactic' }, NOW).ok).toBe(false);
    expect(validateRecord({ ...valid, level: '' }, NOW).ok).toBe(true);
    for (const level of RECORD_LEVELS) {
      expect(validateRecord({ ...valid, level }, NOW).ok).toBe(true);
    }
  });

  it('normalises sport to lowercase so it matches the rest of the system', () => {
    const result = validateRecord({ ...valid, sport: 'Cricket' }, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.sport).toBe('cricket');
  });

  it('ignores non-string junk in optional text fields', () => {
    const result = validateRecord({ ...valid, organisation: { evil: true }, result: 42 }, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.organisation).toBeNull();
    expect(result.record.result).toBeNull();
  });
});

describe('toPublicRecords — what a forwarded link may show', () => {
  const rows = [
    {
      _id: 'a1',
      kind: 'tournament',
      title: 'District Final',
      startedOn: new Date('2026-04-12'),
      endedOn: new Date('2026-04-14'),
      level: 'district',
      academyName: 'MasterGrade Sports Academy',
      recordedBy: 'trainer-object-id',
    },
    {
      _id: 'a2',
      kind: 'camp',
      title: 'Summer Camp',
      startedOn: new Date('2026-06-01'),
      academyName: 'MasterGrade Sports Academy',
    },
  ];

  it('never publishes who recorded the entry', () => {
    const out = toPublicRecords(rows, NOW);
    for (const record of out) {
      expect(record).not.toHaveProperty('recordedBy');
      expect(JSON.stringify(record)).not.toContain('trainer-object-id');
    }
  });

  it('orders newest first', () => {
    const out = toPublicRecords(rows, NOW);
    expect(out.map((r) => r.title)).toEqual(['Summer Camp', 'District Final']);
  });

  it('labels the kind and level for the reader', () => {
    const out = toPublicRecords(rows, NOW);
    const final = out.find((r) => r.title === 'District Final')!;
    expect(final.kindLabel).toBe('Tournament');
    expect(final.levelLabel).toBe('District');
    expect(final.icon).toBe('🏆');
  });

  it('leaves levelLabel null when no level was entered', () => {
    const out = toPublicRecords(rows, NOW);
    const camp = out.find((r) => r.title === 'Summer Camp')!;
    expect(camp.level).toBeNull();
    expect(camp.levelLabel).toBeNull();
  });

  it('flags a record whose date has not arrived yet', () => {
    const out = toPublicRecords(
      [{ _id: 'b', kind: 'trial', title: 'State trial', startedOn: new Date('2026-11-01') }],
      NOW
    );
    expect(out[0].upcoming).toBe(true);
  });

  it('drops rows that are malformed rather than rendering a broken card', () => {
    const out = toPublicRecords(
      [
        { _id: '1', kind: 'tournament', title: 'Good', startedOn: new Date('2026-01-01') },
        { _id: '2', kind: 'nonsense', title: 'Bad kind', startedOn: new Date('2026-01-01') },
        { _id: '3', kind: 'tournament', startedOn: new Date('2026-01-01') },
        { _id: '4', kind: 'tournament', title: 'No date' },
        null,
      ] as any,
      NOW
    );
    expect(out.map((r) => r.title)).toEqual(['Good']);
  });

  it('survives null and undefined input', () => {
    expect(toPublicRecords(null)).toEqual([]);
    expect(toPublicRecords(undefined)).toEqual([]);
  });
});

describe('highestLevel', () => {
  it('picks the strongest level present', () => {
    expect(
      highestLevel([{ level: 'district' }, { level: 'national' }, { level: 'academy' }])
    ).toBe('national');
  });

  it('returns null rather than inventing a level nobody entered', () => {
    expect(highestLevel([{ level: null }, {}])).toBeNull();
    expect(highestLevel([])).toBeNull();
    expect(highestLevel(null)).toBeNull();
  });

  it('ignores junk levels', () => {
    expect(highestLevel([{ level: 'interplanetary' }, { level: 'state' }] as any)).toBe('state');
  });
});
