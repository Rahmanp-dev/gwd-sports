import mongoose from 'mongoose';
import StudentProfile from '@/lib/models/Student';
import User from '@/lib/models/User';
import Academy from '@/lib/models/Academy';
import { findOrCreatePassport } from '@/lib/passport';
import { emitEvent } from '@/lib/events/emit';
import { rupeesToPaise } from '@/lib/payments/money';
import { logger } from '@/lib/logger';
import { appUrl as resolveAppUrl } from '@/lib/appUrl';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * SELF-REGISTERED STUDENTS NEVER GOT A PASSPORT
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `findOrCreatePassport()` — the one function that is allowed to mint a
 * Passport, because it enforces one identity per (parent phone, student name)
 * — was called from exactly one place: the bulk CSV import commit. A student
 * who signs up through the app themselves (`POST /api/student/profile`) got a
 * StudentProfile with `passportId: undefined` and stayed that way forever.
 *
 * The consequence was not cosmetic. The student dashboard's "My Passport"
 * button is already conditional on `passportId` — correctly, it hides itself
 * rather than link to nothing — but that meant every self-registered student
 * saw NO button at all, with nothing to explain why. Their WhatsApp welcome
 * message, and every reminder after it, also had no passport link to send,
 * because there is a comment in `lib/messaging/consumers.ts` that will not
 * enqueue that message without one.
 *
 * WHY A SEPARATE MODULE FROM ensureRoleProfile. That one guarantees the
 * StudentProfile row exists. This one guarantees the row is COMPLETE. Passport
 * creation needs a parent phone number, which is validated and normalised
 * (`requirePhone`) and can throw on garbage input — a failure here must never
 * take down the profile read that triggered it, so it is wrapped and logged,
 * never re-thrown.
 *
 * Two call sites, same reasoning as ensureRoleProfile: at self-registration,
 * so new accounts are whole; and lazily on profile read, so every account
 * broken by the missing call before this file existed repairs itself on next
 * login instead of staying broken forever.
 * ════════════════════════════════════════════════════════════════════════════
 */
export async function ensureStudentPassport(
  studentProfileId: mongoose.Types.ObjectId | string,
): Promise<void> {
  try {
    const profile = await StudentProfile.findById(studentProfileId);
    if (!profile || profile.passportId) return;

    const user = await User.findById(profile.userId).select('name phone email').lean();
    if (!user) return;

    // A phone is the one thing findOrCreatePassport cannot proceed without.
    // The student's own account phone is the best available fallback for a
    // self-registered account, where no separate "parent phone" was ever
    // collected — the same assumption the messaging layer already makes for
    // an older player whose account phone IS the contact number.
    const parentPhone = profile.parentPhone || (user as any).phone;
    if (!parentPhone) {
      logger.warn(
        `[ensureStudentPassport] No phone available for student ${String(profile.userId)}; cannot mint a passport.`,
      );
      return;
    }

    const academy = profile.academyId
      ? await Academy.findById(profile.academyId).select('name slug contactInfo').lean()
      : null;

    const { passport } = await findOrCreatePassport({
      studentName: (user as any).name || 'Student',
      parentPhone,
      parentName: profile.parentName || (user as any).name || null,
      sports: profile.sports ?? [],
      academyId: profile.academyId ?? null,
      academyName: (academy as any)?.name,
      studentProfileId: profile._id,
    });

    profile.passportId = passport.passportId;
    // The import path stamps this on every row (commit.ts); self-registration
    // never collected it. Backfilling it here — from the already-normalised
    // number the passport itself was keyed on — means a self-registered
    // student is findable by parent phone exactly like an imported one, for
    // both admin search and any future phone-keyed message trigger.
    if (!profile.parentPhoneE164) {
      profile.parentPhoneE164 = passport.parentPhone;
    }
    await profile.save();

    logger.info(
      `[ensureStudentPassport] Backfilled passport ${passport.passportId} for student ${String(profile.userId)}`,
    );

    // Mirrors buildStudentCreatedEvent() in lib/import/commit.ts — that one only
    // runs for the bulk-CSV path, so a self-registered student (or one repaired
    // by the lazy backfill above) never got the welcome WhatsApp message, the
    // passport link, or a payment link for a fee already on file. dedupeKey
    // makes this safe to call from both call sites (self-registration and the
    // profile-read backfill) without risking a duplicate send.
    const appUrl = resolveAppUrl();
    const feeAmountPaise =
      typeof profile.feeAmount === 'number' && profile.feeAmount > 0
        ? rupeesToPaise(profile.feeAmount)
        : null;

    await emitEvent({
      name: 'student.created',
      academyId: profile.academyId ?? null,
      dedupeKey: `student.created:${passport.passportId}:${profile.academyId ?? 'none'}`,
      payload: {
        eventVersion: 1,
        passportId: passport.passportId,
        studentUserId: String((user as any)._id),
        studentProfileId: String(profile._id),
        studentName: passport.studentName,
        parentName: profile.parentName || null,
        parentPhone: profile.parentPhoneE164 || passport.parentPhone,
        passportUrl: `${appUrl}/passport/${passport.passportId}`,
        paymentUrl: `${appUrl}/pay/${passport.passportId}`,
        // Self-registration means the student set their own password — unlike
        // import, there is no issued password to relay, so the login line
        // falls back to "sign in with the email you registered" (see
        // renderWelcomeLoginLine's null handling).
        loginEmail: (user as any).email ?? null,
        loginPassword: null,
        loginUrl: `${appUrl}/user/auth`,
        academyId: profile.academyId ? String(profile.academyId) : null,
        academyName: (academy as any)?.name ?? null,
        academySlug: (academy as any)?.slug ?? null,
        academyOwnerPhone: (academy as any)?.contactInfo?.phone ?? null,
        sports: profile.sports ?? [],
        batchId: profile.batchId ? String(profile.batchId) : null,
        batchName: null,
        feeAmountPaise,
        feePeriod: profile.feePeriod ?? 'monthly',
        feeDueDayOfMonth: profile.feeDueDayOfMonth ?? 5,
        isFeeDue: feeAmountPaise !== null && feeAmountPaise > 0,
        source: 'self-registration',
        passportReused: false,
        transferredFrom: null,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    // Never block a profile read or registration on this. Logged loudly so a
    // bad phone number on one account does not silently stay broken forever.
    logger.error(
      `[ensureStudentPassport] Could not ensure passport for profile ${String(studentProfileId)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
