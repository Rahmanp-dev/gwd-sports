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

  const oldPhone = String(user.phone ?? '').trim();
  const newPhone = next.phone !== undefined ? next.phone : oldPhone;

  /**
   * THIS user's own enrolment, and therefore their own passport.
   *
   * Needed because a Passport has no `userId` — the only link to a person is
   * the parent's phone, which is shared by siblings. A NAME change must land
   * on this one passport and no other; a PHONE change must land on all of
   * them. Conflating the two is how a rename would either do nothing or
   * rename a sibling.
   */
  const ownProfile = await StudentProfile.findOne({ userId: user._id })
    .select('passportId')
    .lean<any>();

  /**
   * Every passport reachable from this change. A phone change moves the whole
   * family — a parent with three children has three passports linked only by
   * that number, and moving one would split the siblings across two numbers.
   * A name-only change touches just this student's.
   */
  const passports = diff.phoneChanged && oldPhone
    ? await Passport.find({ parentPhone: oldPhone })
    : ownProfile?.passportId && diff.nameChanged
      ? await Passport.find({ passportId: ownProfile.passportId })
      : [];

  /**
   * Clearing the number is allowed for a trainer, who may genuinely have none
   * on file, but not for someone whose Passport depends on it.
   *
   * `Passport.parentPhone` is `required` and is the lookup key for QR check-in
   * and every parent message; `identityKey` is built from it and is uniquely
   * indexed. Blanking it would either fail schema validation mid-cascade or
   * leave the key pointing at a number the record no longer carries. Refusing
   * up front is the only outcome that leaves the data coherent.
   */
  if (diff.phoneChanged && !newPhone && passports.length > 0) {
    return {
      ok: false,
      status: 400,
      field: 'phone',
      message:
        `That number is the contact for ${passports.length} Sports Passport(s) ` +
        `and is how check-in and parent messages find them. Replace it with a ` +
        `new number rather than clearing it.`,
    };
  }

  /**
   * Rebuilt keys, all checked for collision BEFORE a single write.
   *
   * The name used per passport matters: only the student whose account this is
   * gets the new name. An earlier version rebuilt every key from
   * `passport.studentName`, which meant a rename produced an identical key and
   * silently did nothing — the passport kept the old name and the key stayed
   * stale, which is the precise failure `identityKeyAffected` exists to catch.
   */
  const rebuilt: { id: string; key: string; studentName?: string }[] = [];

  for (const passport of passports) {
    const isOwn =
      !!ownProfile?.passportId && passport.passportId === ownProfile.passportId;
    const studentName =
      isOwn && diff.nameChanged && next.name ? next.name : passport.studentName;

    // newPhone is guaranteed non-empty here: the guard above returns early if
    // it was cleared while passports still depend on it.
    const key = buildIdentityKey(newPhone, studentName);
    if (key === passport.identityKey && studentName === passport.studentName) continue;

    const clash = await Passport.findOne({
      identityKey: key,
      _id: { $ne: passport._id },
    })
      .select('passportId')
      .lean<any>();

    if (clash) {
      // Two passports for one child. Merging them is a judgement call, not
      // something to do silently inside an edit.
      return {
        ok: false,
        status: 409,
        field: diff.phoneChanged ? 'phone' : 'name',
        message:
          `That would collide with an existing record for ${studentName} ` +
          `(passport ${clash.passportId}). Merge those first — applying it ` +
          `here would create a duplicate.`,
      };
    }
    rebuilt.push({ id: String(passport._id), key, studentName });
  }

  // ── Writes ───────────────────────────────────────────────────────────────
  const propagated: string[] = [];

  if (next.name !== undefined) user.name = next.name;
  if (next.email !== undefined) user.email = next.email;
  if (next.phone !== undefined) user.phone = next.phone;
  if (next.isActive !== undefined) user.isActive = next.isActive;
  if (next.sports !== undefined) user.sports = next.sports;
  if (next.role !== undefined) user.role = next.role;
  if (next.academyId !== undefined) {
    user.academyId = next.academyId ? new mongoose.Types.ObjectId(next.academyId) : null;
  }
  await user.save();
  propagated.push('account');

  if (diff.phoneChanged) {
    /**
     * The enrolment record. Scoped to `userId` only — a parent's number also
     * appears on a sibling's profile, but that row belongs to a different
     * child and a different account, and the sibling's passport is handled
     * separately below. Rewriting it from here would edit someone else's
     * enrolment as a side effect of this user's edit.
     *
     * The two columns are different formats on purpose: `parentPhoneE164` is
     * functional, `parentPhone` is the displayed national form, matching what
     * lib/import/commit.ts writes.
     */
    const profiles = await StudentProfile.updateMany(
      { userId: user._id },
      {
        $set: {
          parentPhone: next.phoneNational ?? newPhone,
          parentPhoneE164: newPhone || null,
        },
      }
    );
    if (profiles.modifiedCount > 0) {
      propagated.push(`${profiles.modifiedCount} enrolment record(s)`);
    }
  }

  let touchedPassports = 0;
  for (const passport of passports) {
    const match = rebuilt.find((r) => r.id === String(passport._id));
    let dirty = false;

    if (diff.phoneChanged && passport.parentPhone !== newPhone) {
      passport.parentPhone = newPhone;
      dirty = true;
    }
    if (match) {
      passport.identityKey = match.key;
      if (match.studentName && match.studentName !== passport.studentName) {
        passport.studentName = match.studentName;
      }
      dirty = true;
    }
    if (dirty) {
      await passport.save();
      touchedPassports++;
    }
  }
  if (touchedPassports > 0) {
    propagated.push(`${touchedPassports} Sports Passport(s)`);
  }

  return { ok: true, user, propagated };
}
