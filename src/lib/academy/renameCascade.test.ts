import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The cascade needs a database, so the models are stubbed and what is asserted
 * is the QUERY SHAPE — which is where the real risk lives. Two mistakes are
 * easy here and both are silent:
 *
 *   · matching on the old NAME instead of the academyId, which would rewrite a
 *     different academy that happens to share a name;
 *   · omitting `arrayFilters`, which makes `$[]`-style updates rewrite EVERY
 *     subdocument in the array — including stints at other academies.
 *
 * Neither would fail a typecheck and neither is visible until a customer's
 * history is wrong.
 */

const passportUpdateMany = vi.fn();
const passportCount = vi.fn();
const achievementUpdateMany = vi.fn();
const achievementCount = vi.fn();

vi.mock('@/lib/models/Passport', () => ({
  default: {
    updateMany: (...a: unknown[]) => passportUpdateMany(...a),
    countDocuments: (...a: unknown[]) => passportCount(...a),
  },
}));
vi.mock('@/lib/models/Achievement', () => ({
  default: {
    updateMany: (...a: unknown[]) => achievementUpdateMany(...a),
    countDocuments: (...a: unknown[]) => achievementCount(...a),
  },
}));

const { cascadeAcademyRename, previewAcademyRename } = await import('./renameCascade');

const ACADEMY = '6a5f99c3aab9c215627c23f9';
const OTHER = '6a5f99c3aab9c215627c23fa';

beforeEach(() => {
  vi.clearAllMocks();
  passportUpdateMany.mockResolvedValue({ modifiedCount: 3 });
  achievementUpdateMany.mockResolvedValue({ modifiedCount: 7 });
  passportCount.mockResolvedValue(5);
  achievementCount.mockResolvedValue(9);
});

describe('cascadeAcademyRename', () => {
  it('matches on academyId, never on the old name', async () => {
    await cascadeAcademyRename(ACADEMY, 'MasterGrade Elite');

    const serialised = JSON.stringify([
      ...passportUpdateMany.mock.calls,
      ...achievementUpdateMany.mock.calls,
    ]);
    // The old name is never passed in, so it cannot possibly be matched on —
    // but assert the id IS present, so a future refactor to name-matching
    // fails here.
    expect(serialised).toContain(ACADEMY);
    expect(serialised).not.toContain(OTHER);
  });

  it('scopes both passport arrays with arrayFilters', async () => {
    await cascadeAcademyRename(ACADEMY, 'MasterGrade Elite');

    expect(passportUpdateMany).toHaveBeenCalledTimes(2);
    for (const call of passportUpdateMany.mock.calls) {
      const options = call[2];
      expect(options, 'every array update must be scoped').toBeTruthy();
      expect(Array.isArray(options.arrayFilters)).toBe(true);
      expect(options.arrayFilters.length).toBeGreaterThan(0);
      // Each filter must pin the academy, or it rewrites other academies' rows.
      expect(JSON.stringify(options.arrayFilters)).toContain(ACADEMY);
    }
  });

  it('updates academyHistory, records and achievements', async () => {
    await cascadeAcademyRename(ACADEMY, 'MasterGrade Elite');

    const paths = passportUpdateMany.mock.calls.map((c) => JSON.stringify(c[1]));
    expect(paths.some((p) => p.includes('academyHistory'))).toBe(true);
    expect(paths.some((p) => p.includes('records'))).toBe(true);
    expect(achievementUpdateMany).toHaveBeenCalledTimes(1);
  });

  it('writes the trimmed new name everywhere', async () => {
    await cascadeAcademyRename(ACADEMY, '  MasterGrade Elite  ');
    const serialised = JSON.stringify([
      ...passportUpdateMany.mock.calls,
      ...achievementUpdateMany.mock.calls,
    ]);
    expect(serialised).toContain('MasterGrade Elite');
    expect(serialised).not.toContain('  MasterGrade Elite  ');
  });

  it('refuses an empty name rather than blanking every record', async () => {
    await expect(cascadeAcademyRename(ACADEMY, '   ')).rejects.toThrow(/empty/i);
    expect(passportUpdateMany).not.toHaveBeenCalled();
    expect(achievementUpdateMany).not.toHaveBeenCalled();
  });

  it('reports what it changed', async () => {
    const result = await cascadeAcademyRename(ACADEMY, 'New Name');
    expect(result.academyHistory).toBe(3);
    expect(result.passportRecords).toBe(3);
    expect(result.achievements).toBe(7);
  });

  it('does not swallow a failure', async () => {
    passportUpdateMany.mockRejectedValueOnce(new Error('mongo down'));
    await expect(cascadeAcademyRename(ACADEMY, 'New Name')).rejects.toThrow('mongo down');
  });
});

describe('previewAcademyRename', () => {
  it('counts without writing anything', async () => {
    const preview = await previewAcademyRename(ACADEMY);
    expect(preview.achievements).toBe(9);
    expect(passportUpdateMany).not.toHaveBeenCalled();
    expect(achievementUpdateMany).not.toHaveBeenCalled();
  });
});
