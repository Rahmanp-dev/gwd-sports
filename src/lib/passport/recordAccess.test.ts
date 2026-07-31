import { describe, it, expect } from 'vitest';
import { canMutate, isSuperAdmin } from './recordAccess';

/**
 * A Passport is the one model in this system that is NOT tenant-scoped, so it
 * travels with the child across academies. canMutate() is the guard that stops
 * the academy a student moved TO from rewriting or deleting the history the
 * academy they came FROM recorded.
 *
 * These are the cases that matter. The database half of the gate
 * (resolvePassportForActor) needs a live connection and is covered by the cold
 * build plus manual verification; this is the part with the branching logic.
 */

const ACADEMY_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const ACADEMY_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const coachAtA = { userId: 'u1', role: 'trainer', academyId: ACADEMY_A };
const coachAtB = { userId: 'u2', role: 'trainer', academyId: ACADEMY_B };
const adminAtA = { userId: 'u3', role: 'admin', academyId: ACADEMY_A };
const superAdmin = { userId: 'u4', role: 'gwd_super_admin', academyId: null };
const orphanCoach = { userId: 'u5', role: 'trainer', academyId: null };

describe('canMutate — whose record is it?', () => {
  it('lets an academy edit the record it wrote', () => {
    expect(canMutate({ academyId: ACADEMY_A }, coachAtA, ACADEMY_A)).toBe(true);
    expect(canMutate({ academyId: ACADEMY_A }, adminAtA, ACADEMY_A)).toBe(true);
  });

  it('refuses to let one academy edit another academy\'s record', () => {
    // The student has transferred to B; A's history came with them and must
    // stay exactly as A recorded it.
    expect(canMutate({ academyId: ACADEMY_A }, coachAtB, ACADEMY_B)).toBe(false);
  });

  it('refuses even when the other academy is the student\'s current one', () => {
    expect(canMutate({ academyId: ACADEMY_B }, coachAtA, ACADEMY_A)).toBe(false);
  });

  it('compares ids by value, not by reference', () => {
    // Mongoose hands back ObjectIds, not strings — a === comparison would
    // silently deny every legitimate edit.
    const asObject = { toString: () => ACADEMY_A };
    expect(canMutate({ academyId: asObject }, coachAtA, ACADEMY_A)).toBe(true);
    expect(
      canMutate({ academyId: ACADEMY_A }, { ...coachAtA, academyId: asObject }, ACADEMY_A)
    ).toBe(true);
  });

  it('lets a super admin edit anything', () => {
    expect(canMutate({ academyId: ACADEMY_A }, superAdmin, ACADEMY_B)).toBe(true);
    expect(canMutate({}, superAdmin, null)).toBe(true);
  });

  it('denies a caller with no academy assigned', () => {
    expect(canMutate({ academyId: ACADEMY_A }, orphanCoach, ACADEMY_A)).toBe(false);
    expect(canMutate({}, orphanCoach, null)).toBe(false);
  });

  describe('unattributed records (legacy or seeded)', () => {
    it('are editable by the academy the student currently trains at', () => {
      // Otherwise a typo in seeded data would be frozen forever with no route
      // to correct it.
      expect(canMutate({}, coachAtA, ACADEMY_A)).toBe(true);
      expect(canMutate({ academyId: null }, coachAtA, ACADEMY_A)).toBe(true);
    });

    it('are NOT editable by an academy the student has left', () => {
      expect(canMutate({ academyId: null }, coachAtA, ACADEMY_B)).toBe(false);
    });
  });
});

describe('isSuperAdmin', () => {
  it('recognises only the exact role string', () => {
    expect(isSuperAdmin('gwd_super_admin')).toBe(true);
    expect(isSuperAdmin('admin')).toBe(false);
    expect(isSuperAdmin('trainer')).toBe(false);
    expect(isSuperAdmin('super_admin')).toBe(false);
    expect(isSuperAdmin('')).toBe(false);
  });
});
