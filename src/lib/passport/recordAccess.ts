import mongoose from 'mongoose';
import StudentProfile from '@/lib/models/Student';
import Passport from '@/lib/models/Passport';
import Academy from '@/lib/models/Academy';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHO MAY WRITE TO A PASSPORT — the two-step gate
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Passport is the one model in this system that is NOT tenant-scoped, which
 * makes writing to it the one place a naive handler leaks across academies. A
 * coach who can pass an arbitrary studentId must not be able to edit the
 * sporting history of a child at another academy.
 *
 * So authorisation never touches Passport directly. It goes:
 *
 *   1. Resolve the caller's StudentProfile — the ACADEMY-SCOPED enrolment
 *      record — by { userId, academyId }. If the student is not enrolled at the
 *      caller's academy this returns nothing, and the caller learns only
 *      "not found", identical to a student that does not exist. That prevents
 *      the endpoint being used to probe another academy's roster.
 *
 *   2. Only then follow that profile's passportId to the global Passport.
 *
 * For edits and deletes there is a THIRD check, in canMutate() below: the
 * record itself must have been written by the caller's academy. Because a
 * passport travels with the child, a coach at the academy they moved TO would
 * otherwise be able to rewrite or erase the history the previous academy
 * recorded — silently deleting a district final a different club ran. Records
 * are append-and-own: your academy's entries are yours to fix, everyone else's
 * are read-only.
 *
 * Super admins bypass steps 1 and 3, and only them.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface RecordActor {
  userId: any;
  role: string;
  academyId: any;
}

export type ResolveResult =
  | { ok: true; passport: any; academyId: string | null; academyName: string | null }
  | { ok: false; status: number; message: string };

export function isSuperAdmin(role: string): boolean {
  return role === 'gwd_super_admin';
}

/**
 * Resolves the passport a caller is allowed to act on for `studentUserId`.
 *
 * `studentUserId` is the User id, matching every other trainer route in this
 * codebase (see api/trainer/add-performance). Passing a StudentProfile id here
 * will correctly fail to resolve rather than silently acting on the wrong child.
 */
export async function resolvePassportForActor(
  studentUserId: string,
  actor: RecordActor
): Promise<ResolveResult> {
  if (!mongoose.Types.ObjectId.isValid(studentUserId)) {
    return { ok: false, status: 400, message: 'Invalid student ID' };
  }

  const filter: Record<string, unknown> = { userId: studentUserId };
  if (!isSuperAdmin(actor.role)) {
    if (!actor.academyId) {
      return { ok: false, status: 403, message: 'No academy assigned to your account' };
    }
    filter.academyId = actor.academyId;
  }

  const profile = await StudentProfile.findOne(filter).select('passportId academyId').lean<any>();
  if (!profile) {
    // Deliberately indistinguishable from "no such student".
    return { ok: false, status: 404, message: 'Student not found' };
  }
  if (!profile.passportId) {
    return {
      ok: false,
      status: 409,
      message: 'This student has no Sports Passport yet. It is issued on import or first save.',
    };
  }

  const passport = await Passport.findOne({ passportId: profile.passportId });
  if (!passport) {
    return { ok: false, status: 404, message: 'Passport not found' };
  }

  // The academy stamped onto new records. Taken from the ENROLMENT, not from
  // the caller's token, so a super admin acting on a student's behalf still
  // attributes the record to the academy the child actually trains at.
  const academyId = profile.academyId ? String(profile.academyId) : null;
  let academyName: string | null = null;
  if (academyId) {
    const academy = await Academy.findById(academyId).select('name').lean<any>();
    academyName = academy?.name ?? null;
  }

  return { ok: true, passport, academyId, academyName };
}

/**
 * Whether `actor` may edit or delete an existing record.
 *
 * A record with no academyId is legacy or seeded data; it is treated as
 * editable by the academy the child currently trains at, because otherwise it
 * would be permanently frozen with no route to correct a typo.
 */
export function canMutate(
  record: { academyId?: any },
  actor: RecordActor,
  currentAcademyId: string | null
): boolean {
  if (isSuperAdmin(actor.role)) return true;
  if (!actor.academyId) return false;

  const owner = record.academyId ? String(record.academyId) : null;
  if (owner === null) return String(actor.academyId) === String(currentAcademyId);
  return owner === String(actor.academyId);
}
