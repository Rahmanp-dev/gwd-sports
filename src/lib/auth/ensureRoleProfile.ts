import mongoose from 'mongoose';
import TrainerProfile from '@/lib/models/Trainer';
import StudentProfile from '@/lib/models/Student';
import { logger } from '@/lib/logger';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * A USER WITH A ROLE BUT NO PROFILE IS A HALF-CREATED ACCOUNT
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `POST /api/admin/users` created a User document and nothing else. So an
 * academy admin adding a coach from the Users tab produced a user with
 * `role: 'trainer'` and no TrainerProfile — and every trainer surface reads the
 * PROFILE, not the user:
 *
 *   - the trainer dashboard renders "No Trainer Profile Found";
 *   - `/api/trainer/batches` filters on `coaches: userId`, so they can never be
 *     assigned to a batch and never see the attendance register;
 *   - the admin's trainer list is built from TrainerProfile.aggregate, so the
 *     coach they just created does not appear in it.
 *
 * The student case is worse than cosmetic: `resolveAmountDue` throws
 * "Student profile not found" before it can resolve a fee, so a student added
 * this way cannot be charged at all.
 *
 * Two call sites on purpose:
 *   1. at creation, so new accounts are whole; and
 *   2. lazily on profile read, because accounts broken by the old code already
 *      exist in production and would otherwise stay broken forever.
 *
 * Idempotent by construction — `userId` is a unique index on both models, and
 * the duplicate-key path is treated as success because it means the profile is
 * there, which is all the caller wanted.
 * ════════════════════════════════════════════════════════════════════════════
 */
export async function ensureRoleProfile(params: {
  userId: mongoose.Types.ObjectId | string;
  role: string;
  academyId?: mongoose.Types.ObjectId | string | null;
  sports?: string[];
}): Promise<void> {
  const { userId, role, academyId = null, sports = [] } = params;

  if (role !== 'trainer' && role !== 'student') return;

  const Model = role === 'trainer' ? TrainerProfile : StudentProfile;

  try {
    const existing = await Model.findOne({ userId }).select('_id');
    if (existing) return;

    await Model.create({
      userId,
      academyId: academyId || null,
      ...(role === 'trainer' ? { sports } : {}),
    });

    logger.info(
      `Created missing ${role} profile for user ${String(userId)}`
    );
  } catch (error: any) {
    // 11000 = duplicate key: another request created it first. That is the
    // desired end state, not a failure.
    if (error?.code === 11000) return;

    /**
     * Never fail the caller. Creating a user must not be blocked because a
     * profile could not be built alongside it — the lazy path on profile read
     * will try again. Logged loudly so it is not invisible.
     */
    logger.error(
      `Could not create ${role} profile for user ${String(userId)}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
