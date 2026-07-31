import mongoose from 'mongoose';
import User from '@/lib/models/User';
import StudentProfile from '@/lib/models/Student';
import Passport from '@/lib/models/Passport';
import { buildIdentityKey } from '@/lib/passport';
import type { NormalisedIdentity, IdentityDiff } from './identityChange';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE WRITE HALF — one identity change, propagated everywhere it is copied
 * ════════════════════════════════════════════════════════════════════════════
 *
 * See identityChange.ts for why the phone lives in five places. This applies
 * the change to all of them, or to none of them.
 *
 * ORDER MATTERS. The uniqueness checks run FIRST, against the whole database,
 * before anything is written. Both `User.email` and `Passport.identityKey` are
 * uniquely indexed, so a collision discovered halfway through would leave the
 * user renamed and the passport not — the exact split-brain this function
 * exists to prevent. A pre-flight check cannot be perfectly atomic without a
 * transaction, but it converts the common case from "half applied, raw 500"
 * into "nothing applied, clear message".
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface CascadeResult {
  ok: true;
  user: any;
  /** Human-readable list of what moved, for the audit line and the UI toast. */
  propagated: string[];
}

export interface CascadeFailure {
  ok: false;
  status: number;
  message: string;
  field?: string;
}

export async function applyIdentityChange(
  userId: string,
  next: NormalisedIdentity,
  diff: IdentityDiff
): Promise<CascadeResult | CascadeFailure> {
  const user = await User.findById(userId);
  if (!user) return { ok: false, status: 404, message: 'User not found' };

  // ── Pre-flight uniqueness ────────────────────────────────────────────────
  if (diff.emailChanged && next.email) {
    const clash = await User.findOne({
      email: next.email,
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
    })
      .select('_id')
      .lean();
    if (clash) {
      return {
        ok: false,
        status: 409,
        field: 'email',
        message: 'Another account already uses that email address.',
      };
    }
  }

  /**
   * Every passport this person is the parent on. Keyed by phone, because that
   * is the only link — a Passport has no userId. A parent with three children
   * at the academy has three passports and all of them must move together, or
   * the siblings end up split across two numbers.
   */
  const oldPhone = String(user.phone ?? '').trim();
  const passports =
    diff.identityKeyAffected && oldPhone
      ? await Passport.find({ parentPhone: oldPhone })
      : [];

  const newPhone = next.phone !== undefined ? next.phone : oldPhone;

  // Rebuilt keys, checked for collision before a single write.
  const rebuilt: { doc: any; key: string }[] = [];
  if (diff.identityKeyAffected && newPhone) {
    for (const passport of passports) {
      const key = buildIdentityKey(newPhone, passport.studentName);
      if (key === passport.identityKey) continue;

      const clash = await Passport.findOne({
        identityKey: key,
        _id: { $ne: passport._id },
      })
        .select('passportId')
        .lean<any>();

      if (clash) {
        // Two passports for one child, usually because the new number already
        // belongs to another record for the same student. Merging them is a
        // judgement call, not something to do silently inside an edit.
        return {
          ok: false,
          status: 409,
          field: 'phone',
          message:
            `That number is already linked to ${passport.studentName}'s record ` +
            `under passport ${clash.passportId}. Merge those first — changing ` +
            `it here would create a duplicate.`,
        };
      }
      rebuilt.push({ doc: passport, key });
    }
  }

  // ── Writes ───────────────────────────────────────────────────────────────
  const propagated: string[] = [];

  if (next.name !== undefined) user.name = next.name;
  if (next.email !== undefined) user.email = next.email;
  if (next.phone !== undefined) user.phone = next.phone;
  if (next.isActive !== undefined) user.isActive = next.isActive;
  if (next.role !== undefined) user.role = next.role;
  if (next.academyId !== undefined) {
    user.academyId = next.academyId ? new mongoose.Types.ObjectId(next.academyId) : null;
  }
  await user.save();
  propagated.push('account');

  if (diff.phoneChanged) {
    /**
     * The enrolment records. Matched on userId AND on the old parent phone,
     * because both shapes exist: a student's own profile carries their userId,
     * while a parent's number can also appear on a sibling's profile that this
     * user does not own. Only the first is safe to rewrite from here — the
     * second belongs to a different child and a different account.
     */
    const profiles = await StudentProfile.updateMany(
      { userId: user._id },
      { $set: { parentPhone: newPhone, parentPhoneE164: newPhone || null } }
    );
    if (profiles.modifiedCount > 0) {
      propagated.push(`${profiles.modifiedCount} enrolment record(s)`);
    }
  }

  if (rebuilt.length > 0 || (diff.phoneChanged && passports.length > 0)) {
    for (const passport of passports) {
      if (diff.phoneChanged) passport.parentPhone = newPhone;
      const match = rebuilt.find((r) => String(r.doc._id) === String(passport._id));
      if (match) passport.identityKey = match.key;
      await passport.save();
    }
    propagated.push(`${passports.length} Sports Passport(s)`);
  }

  return { ok: true, user, propagated };
}
