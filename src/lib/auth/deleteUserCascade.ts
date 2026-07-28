import mongoose from 'mongoose';
import User from '@/lib/models/User';
import StudentProfile from '@/lib/models/Student';
import TrainerProfile from '@/lib/models/Trainer';
import Passport from '@/lib/models/Passport';
import { Academy } from '@/lib/models/Academy';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * DELETING A USER MEANS DELETING WHAT HANGS OFF THEM
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `DELETE /api/admin/users/[id]` was one line — `User.findByIdAndDelete(id)` —
 * which left behind every record that pointed at that user:
 *
 *   StudentProfile   → `userId` now dangles. A populate on a deleted target
 *                      yields NULL, and the admin Students tab crashed on it
 *                      with "can't access property _id, e.userId is null".
 *                      ONE orphan took out the entire list.
 *   TrainerProfile   → same, for coaches.
 *   Academy.students → the roster still counted them, so headcount and
 *                      capacity checks were wrong.
 *   Passport         → still pointed at a StudentProfile that no longer had a
 *                      user, which is why a deleted student reappeared on
 *                      re-import as an existing record.
 *
 * WHAT IS DELETED AND WHAT IS NOT. Profiles and roster membership are
 * academy-scoped bookkeeping and go. The PASSPORT DOES NOT: it is the child's
 * cross-academy identity and holds their history, and destroying it because
 * one academy removed one login would erase a record that is meant to outlive
 * any single academy. It is detached instead — `currentStudentProfileId`
 * cleared and marked inactive — so nothing dangles, but the identity survives
 * for a genuine return.
 *
 * Best-effort per step rather than a transaction: this runs on a standalone
 * Mongo in development where transactions are unavailable, and a partial
 * cleanup that removes the crashing orphan is strictly better than an
 * all-or-nothing that fails and leaves the list broken.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface CascadeResult {
  studentProfilesRemoved: number;
  trainerProfilesRemoved: number;
  passportsDetached: number;
  academiesUpdated: number;
}

export async function deleteUserCascade(
  userId: mongoose.Types.ObjectId | string,
): Promise<CascadeResult> {
  const result: CascadeResult = {
    studentProfilesRemoved: 0,
    trainerProfilesRemoved: 0,
    passportsDetached: 0,
    academiesUpdated: 0,
  };

  // Read the profiles BEFORE deleting them — their ids are what the passport
  // and roster references are keyed on.
  const studentProfiles = await StudentProfile.find({ userId }).select('_id passportId').lean();

  for (const profile of studentProfiles as any[]) {
    try {
      const detached = await Passport.updateMany(
        { currentStudentProfileId: profile._id },
        { $set: { currentStudentProfileId: null, isActive: false } },
      );
      result.passportsDetached += detached.modifiedCount ?? 0;
    } catch (err: any) {
      console.error('[deleteUserCascade] passport detach failed:', err?.message || err);
    }
  }

  try {
    const removed = await StudentProfile.deleteMany({ userId });
    result.studentProfilesRemoved = removed.deletedCount ?? 0;
  } catch (err: any) {
    console.error('[deleteUserCascade] student profile delete failed:', err?.message || err);
  }

  try {
    const removed = await TrainerProfile.deleteMany({ userId });
    result.trainerProfilesRemoved = removed.deletedCount ?? 0;
  } catch (err: any) {
    console.error('[deleteUserCascade] trainer profile delete failed:', err?.message || err);
  }

  // The roster arrays hold USER ids, so this is keyed on the user, not the
  // profile — and $pull on both is safe when the id is absent from either.
  try {
    const updated = await Academy.updateMany(
      { $or: [{ students: userId }, { trainers: userId }] },
      { $pull: { students: userId, trainers: userId } } as any,
    );
    result.academiesUpdated = updated.modifiedCount ?? 0;
  } catch (err: any) {
    console.error('[deleteUserCascade] roster cleanup failed:', err?.message || err);
  }

  await User.findByIdAndDelete(userId);

  return result;
}

/**
 * Removes StudentProfile/TrainerProfile rows whose user no longer exists.
 *
 * Repairs damage done before the cascade above existed. Without it, every
 * user deleted by the old one-line handler is still an orphan sitting in the
 * database waiting to crash a list.
 */
export async function purgeOrphanedProfiles(
  academyId?: mongoose.Types.ObjectId | string | null,
): Promise<{ students: number; trainers: number }> {
  const scope = academyId ? { academyId } : {};

  const [studentRows, trainerRows] = await Promise.all([
    StudentProfile.find(scope).select('_id userId').lean(),
    TrainerProfile.find(scope).select('_id userId').lean(),
  ]);

  const userIds = [
    ...new Set(
      [...(studentRows as any[]), ...(trainerRows as any[])]
        .map((r) => r.userId)
        .filter(Boolean)
        .map(String),
    ),
  ];

  const alive = new Set(
    (await User.find({ _id: { $in: userIds } }).select('_id').lean()).map((u: any) =>
      String(u._id),
    ),
  );

  const deadStudents = (studentRows as any[])
    .filter((r) => !r.userId || !alive.has(String(r.userId)))
    .map((r) => r._id);
  const deadTrainers = (trainerRows as any[])
    .filter((r) => !r.userId || !alive.has(String(r.userId)))
    .map((r) => r._id);

  if (deadStudents.length) {
    await Passport.updateMany(
      { currentStudentProfileId: { $in: deadStudents } },
      { $set: { currentStudentProfileId: null, isActive: false } },
    );
    await StudentProfile.deleteMany({ _id: { $in: deadStudents } });
  }
  if (deadTrainers.length) {
    await TrainerProfile.deleteMany({ _id: { $in: deadTrainers } });
  }

  return { students: deadStudents.length, trainers: deadTrainers.length };
}
