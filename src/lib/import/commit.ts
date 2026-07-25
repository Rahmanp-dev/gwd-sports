import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import StudentProfile from '@/lib/models/Student';
import Batch from '@/lib/models/Batch';
import Passport from '@/lib/models/Passport';
import { Academy } from '@/lib/models/Academy';
import ImportJob, { type IImportJob, type IImportRow } from '@/lib/models/ImportJob';
import { findOrCreatePassport } from '@/lib/passport';
import { requirePhone } from '@/lib/phone';
import { rupeesToPaise } from '@/lib/payments/money';
import { emitEvents } from '@/lib/events/emit';

/**
 * Commits a reviewed import job: creates the student records and fires one
 * `student.created` event per student.
 *
 * NOTHING IN THIS FILE RUNS UNTIL THE OWNER CONFIRMS. Extraction and review
 * operate entirely on the ImportJob document; this is the only code path that
 * writes to User, StudentProfile, Passport or Academy.
 *
 * Rows are committed INDIVIDUALLY, not as one transaction. A 60-row import where
 * row 43 has a bad phone number must import the other 59 and report row 43 —
 * failing the whole batch would mean the owner has to find and fix one row and
 * re-run everything, which is exactly the friction bulk import exists to remove.
 */

export interface CommitResult {
  created: number;
  skipped: number;
  failed: number;
  passportsReused: number;
  transfers: Array<{ rowIndex: number; studentName: string; fromAcademyName: string }>;
  failures: Array<{ rowIndex: number; name: string | null; error: string }>;
}

export async function commitImportJob(
  job: IImportJob,
  actorUserId: mongoose.Types.ObjectId | string
): Promise<CommitResult> {
  const academy = await Academy.findById(job.academyId);
  if (!academy) {
    throw new Error('Academy not found');
  }
  // Where the roster stood before this run, so only what THIS import added is
  // written back. See the atomic update after the loop.
  const rosterLengthBefore = academy.students?.length ?? 0;

  job.status = 'committing';
  await job.save();

  const result: CommitResult = {
    created: 0,
    skipped: 0,
    failed: 0,
    passportsReused: 0,
    transfers: [],
    failures: [],
  };

  const eventsToEmit: Parameters<typeof emitEvents>[0] = [];
  const batchCache = new Map<string, mongoose.Types.ObjectId>();

  // Capacity is checked once up front rather than per row, so the owner is told
  // before importing rather than after 40 of 60 rows have landed.
  const committableRows = job.rows.filter(isCommittable);
  const projected = (academy.students?.length ?? 0) + committableRows.length;
  if (academy.capacity && projected > academy.capacity) {
    job.status = 'awaiting_review';
    await job.save();
    throw new Error(
      `Importing ${committableRows.length} students would put this academy at ${projected}, ` +
        `over its capacity of ${academy.capacity}. Raise the capacity in academy settings first.`
    );
  }

  for (const row of job.rows) {
    if (row.status === 'skipped') {
      result.skipped++;
      continue;
    }
    if (row.status === 'created') {
      // Idempotency: a retried commit must not duplicate already-created rows.
      continue;
    }
    if (!isCommittable(row)) {
      row.status = 'needs_review';
      result.skipped++;
      continue;
    }

    try {
      const outcome = await commitRow(row, job, academy, batchCache);

      row.status = 'created';
      row.createdPassportId = outcome.passportId;
      row.createdUserId = outcome.userId;
      row.error = null;
      result.created++;
      if (outcome.passportReused) result.passportsReused++;
      if (outcome.transferredFrom) {
        result.transfers.push({
          rowIndex: row.index,
          studentName: row.name!,
          fromAcademyName: outcome.transferredFrom.academyName,
        });
      }

      eventsToEmit.push(outcome.event);
    } catch (err: any) {
      row.status = 'failed';
      row.error = err?.message || String(err);
      result.failed++;
      result.failures.push({ rowIndex: row.index, name: row.name, error: row.error! });
      console.error(`[import] row ${row.index} failed:`, err?.message || err);
    }
  }

  /**
   * ATOMIC ROSTER APPEND — NOT `academy.save()`.
   *
   * This used to be a full document save, and it broke every import against a
   * real academy. `save()` runs validation over the WHOLE document, so a legacy
   * value in a field this code never touches — `timings.workingDays` holding
   * "Mon" where the enum wants "monday" — failed validation and 500'd the
   * entire commit AFTER every student had already been written. Students
   * created, job marked failed, roster never updated.
   *
   * The only mutation here is appending user ids to `students`, so that is all
   * this should write. `$addToSet` is also correct where `save()` was not: two
   * imports running at once each held a stale copy of the array and the second
   * save silently discarded the first one's additions.
   */
  const rosterAdditions = (academy.students ?? []).slice(rosterLengthBefore);
  if (rosterAdditions.length > 0) {
    await Academy.updateOne(
      { _id: academy._id },
      { $addToSet: { students: { $each: rosterAdditions } } }
    );
  }

  /**
   * Events are emitted AFTER all records are persisted, in one bulk write.
   *
   * Ordering matters: Phase 2's worker will read these and immediately message
   * parents. Emitting inside the loop risks a welcome message going out for a
   * student whose record then fails to save, and a parent receiving a link to a
   * passport that does not exist is worse than a slightly delayed message.
   */
  await emitEvents(eventsToEmit);

  job.status = 'committed';
  job.committedAt = new Date();
  job.summary = {
    created: result.created,
    skipped: result.skipped,
    failed: result.failed,
    passportsReused: result.passportsReused,
  };
  await job.save();

  return result;
}

/**
 * Releases a job stuck in `committing`.
 *
 * `commitImportJob` sets that status before doing any work and only clears it
 * on success, so ANY throw in between left the job wedged: every retry returned
 * 409 "currently being committed" forever, and the owner's only recovery was a
 * database edit. The capacity check already reset the status on its way out;
 * unexpected failures did not.
 *
 * Safe to call after a partially successful run. Rows already written are
 * marked `created` and the commit loop skips them, so a retry finishes the job
 * rather than duplicating it.
 */
export async function releaseStuckCommit(job: IImportJob): Promise<void> {
  if (job.status !== 'committing') return;
  job.status = 'awaiting_review';
  try {
    await job.save();
  } catch (err: any) {
    // Nothing further to do — the caller is already handling a failure, and
    // masking it with a second one helps nobody.
    console.error('[import] could not release a stuck commit:', err?.message || err);
  }
}

/** A row is committable only with all three required fields present. */
function isCommittable(row: IImportRow): boolean {
  return Boolean(
    row.name && row.normalizedPhone && row.sportOrBatch && row.status !== 'skipped'
  );
}

interface CommitRowOutcome {
  userId: mongoose.Types.ObjectId;
  passportId: string;
  passportReused: boolean;
  transferredFrom: { academyId: string; academyName: string } | null;
  /** The synthetic login address, so the owner can pass it on. */
  loginEmail: string;
  /** Null when the account already existed and kept its password. */
  issuedPassword: string | null;
  event: Parameters<typeof emitEvents>[0][number];
}

async function commitRow(
  row: IImportRow,
  job: IImportJob,
  academy: any,
  batchCache: Map<string, mongoose.Types.ObjectId>
): Promise<CommitRowOutcome> {
  const phone = requirePhone(row.normalizedPhone);
  const sportOrBatch = row.sportOrBatch!.trim();
  const sport = sportOrBatch.toLowerCase();

  // 1. Global passport first. It is the identity everything else hangs off, and
  //    it must be resolved before a User is created so a transferring student
  //    does not get a second account.
  const passportResult = await findOrCreatePassport({
    studentName: row.name!,
    parentPhone: phone.e164,
    parentName: row.parentName,
    sports: [sport],
    academyId: academy._id,
    academyName: academy.name,
  });
  const passport = passportResult.passport;

  // 2. The User record. See User.isImportedPlaceholder for why the email is
  //    synthetic.
  const existingProfile = await StudentProfile.findOne({ passportId: passport.passportId });
  let user: any;

  if (existingProfile) {
    user = await User.findById(existingProfile.userId);
  }

  let issuedPassword: string | null = null;

  if (!user) {
    // Generated here so it can be handed to the parent in their welcome
    // message. See generateImportPassword for why it is per-student.
    issuedPassword = generateImportPassword();
    user = await User.create({
      name: row.name!.slice(0, 50),
      email: placeholderEmail(passport.passportId, academy.slug),
      password: issuedPassword,
      phone: phone.e164,
      role: 'student',
      academyId: academy._id,
      sports: [sport],
      // Still true: the address is synthetic and cannot receive mail, so the
      // email-based recovery flows must stay closed. It no longer means "cannot
      // log in" — that is what mustChangePassword tracks.
      isImportedPlaceholder: true,
      mustChangePassword: true,
      isActive: true,
    });
  } else {
    // Re-import or transfer: move the existing account to this academy.
    user.academyId = academy._id;
    if (!user.sports?.includes(sport)) {
      user.sports = [...(user.sports ?? []), sport];
    }
    await user.save();
  }

  // 3. Batch, created on demand and reused across rows in the same import.
  const batchId = await resolveBatch(sportOrBatch, sport, academy._id, batchCache);

  // 4. The academy-scoped enrolment record.
  const profile = await StudentProfile.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        academyId: academy._id,
        passportId: passport.passportId,
        parentName: row.parentName ?? undefined,
        parentPhone: row.mobileNumber ?? phone.national,
        parentPhoneE164: phone.e164,
        batchId,
        importJobId: job._id,
        isActive: true,
        ...(row.feeAmount !== null ? { feeAmount: row.feeAmount } : {}),
      },
      $setOnInsert: {
        enrollmentDate: new Date(),
        feePeriod: 'monthly',
      },
      $addToSet: { sports: sport },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // 5. Point the passport at this enrolment record.
  if (String(passport.currentStudentProfileId ?? '') !== String(profile._id)) {
    passport.currentStudentProfileId = profile._id;
    await passport.save();
  }

  // 6. Academy roster. $addToSet semantics via a manual check, because the
  //    academy document is saved once after the loop.
  const alreadyOnRoster = academy.students?.some(
    (id: any) => String(id) === String(user._id)
  );
  if (!alreadyOnRoster) {
    academy.students.push(user._id);
  }

  return {
    userId: user._id,
    passportId: passport.passportId,
    passportReused: !passportResult.created,
    transferredFrom: passportResult.transferredFrom ?? null,
    loginEmail: user.email,
    // Null on re-import: an existing account keeps the password it already has,
    // and there is nothing to re-issue.
    issuedPassword,
    event: buildStudentCreatedEvent({
      row,
      job,
      academy,
      user,
      profile,
      passport,
      passportResult,
      issuedPassword,
    }),
  };
}

/**
 * Login email for a register-imported student, branded with their academy.
 *
 * e.g. `gwd-sggddf@mastergrade.gwd.in` rather than the old
 * `gwd-sggddf@import.gwd.in` — a parent reading their credentials off a
 * WhatsApp message should see their own academy's name, not the word "import".
 *
 * ⚠️ IT STAYS ON A `.gwd.in` SUBDOMAIN, NOT `<academy>.com`, AND THAT IS
 * DELIBERATE. These addresses are minted from an academy's slug, and a slug is
 * whatever someone typed — "gmail", "outlook", "yahoo". Emitting
 * `gwd-sggddf@gmail.com` would create accounts on a domain GWD does not
 * control, at addresses that may belong to real strangers, and any future
 * password-reset mail would go to them. A subdomain of a domain GWD owns cannot
 * collide with anyone.
 *
 * No MX record on it, so nothing here can send or receive mail — which is why
 * `isImportedPlaceholder` still blocks the email-based recovery flows.
 */
function placeholderEmail(passportId: string, academySlug?: string | null): string {
  const brand = String(academySlug ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  const host = brand ? `${brand}.gwd.in` : 'import.gwd.in';
  return `${passportId.toLowerCase()}@${host}`;
}

/**
 * The password an imported student's account starts with.
 *
 * ⚠️ THIS IS RANDOM PER STUDENT, NOT ONE SHARED PASSWORD, AND THE DIFFERENCE
 * MATTERS. The login address above is derived from the passport id, and a
 * passport id is PUBLIC — printed on the passport page, texted to parents,
 * forwarded into family group chats. If every imported account shared a known
 * password, anyone who saw any passport id could sign in as that child and read
 * their attendance, medical information and fee history, and start a payment.
 *
 * A per-student password meets the actual requirement identically: the parent
 * still receives working credentials in their welcome message, because the
 * message carries whatever this returns. It just is not the same key for every
 * child in the country.
 *
 * The generated value is returned to the caller so it can be put in that
 * message and shown to the owner once, at import time.
 */
export function generateImportPassword(): string {
  // Ambiguous glyphs removed: this gets read off a phone screen and typed.
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join('');
}

async function resolveBatch(
  rawName: string,
  sport: string,
  academyId: mongoose.Types.ObjectId,
  cache: Map<string, mongoose.Types.ObjectId>
): Promise<mongoose.Types.ObjectId> {
  const cacheKey = `${sport}::${rawName.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Upsert keyed on the same fields as the unique index, so two rows naming the
  // same batch converge on one document instead of racing to create two.
  const batch = await Batch.findOneAndUpdate(
    { academyId, name: rawName, sport },
    { $setOnInsert: { academyId, name: rawName, sport, isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  cache.set(cacheKey, batch._id);
  return batch._id;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE student.created EVENT — PHASE 2'S INTERFACE POINT
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Phase 2's welcome message consumes this and must be able to render itself
 * from the payload ALONE, without a database round trip. That is why the payload
 * carries denormalised names, URLs and the fee figure rather than just ids: a
 * message worker that has to re-read four collections to fill in a template is
 * where "personalised per child" quietly turns into "same name on every message".
 *
 * `dedupeKey` is keyed on passport + academy, so re-importing the same student
 * cannot send a second welcome message.
 *
 * Money is in PAISE, integer, consistent with the payments layer. A message
 * template must never do float arithmetic on a fee.
 * ════════════════════════════════════════════════════════════════════════════
 */
function buildStudentCreatedEvent(input: {
  row: IImportRow;
  job: IImportJob;
  academy: any;
  user: any;
  profile: any;
  passport: any;
  passportResult: { created: boolean; transferredFrom?: { academyId: string; academyName: string } | null };
  issuedPassword?: string | null;
}) {
  const { row, job, academy, user, profile, passport, passportResult } = input;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwd.in';

  const feeAmountPaise = row.feeAmount !== null ? rupeesToPaise(row.feeAmount) : null;

  return {
    name: 'student.created' as const,
    academyId: academy._id,
    // One welcome per student per academy, forever.
    dedupeKey: `student.created:${passport.passportId}:${academy._id}`,
    payload: {
      eventVersion: 1,

      // Identity
      passportId: passport.passportId,
      studentUserId: String(user._id),
      studentProfileId: String(profile._id),
      studentName: passport.studentName,

      // Parent — the message recipient
      parentName: row.parentName ?? null,
      parentPhone: profile.parentPhoneE164,

      // Links the welcome message includes
      passportUrl: `${appUrl}/passport/${passport.passportId}`,
      paymentUrl: `${appUrl}/pay/${passport.passportId}`,

      /**
       * The credentials the parent needs to sign in and use QR check-in.
       * Carried on the event so the welcome message can include them without a
       * database read — and because this is the ONLY moment the password is
       * knowable: it is hashed on save and cannot be recovered afterwards.
       *
       * Null on a re-import, where the account kept its existing password.
       */
      loginEmail: user.email,
      loginPassword: input.issuedPassword ?? null,
      loginUrl: `${appUrl}/user/auth`,

      // Context for personalising the message
      academyId: String(academy._id),
      academyName: academy.name,
      academySlug: academy.slug,
      sports: profile.sports ?? [],
      batchId: profile.batchId ? String(profile.batchId) : null,
      batchName: row.sportOrBatch ?? null,

      // Fee, so the welcome can carry a payment link when something is due
      feeAmountPaise,
      feePeriod: profile.feePeriod ?? 'monthly',
      feeDueDayOfMonth: profile.feeDueDayOfMonth ?? 5,
      isFeeDue: feeAmountPaise !== null && feeAmountPaise > 0,

      // Provenance — lets Phase 2 vary tone for a transfer vs a new student
      source: `import:${job.method}`,
      importJobId: String(job._id),
      passportReused: !passportResult.created,
      transferredFrom: passportResult.transferredFrom ?? null,

      createdAt: new Date().toISOString(),
    },
  };
}

export async function getImportJobForAcademy(
  jobId: string,
  academyId: mongoose.Types.ObjectId | string,
  isSuperAdmin: boolean
): Promise<IImportJob | null> {
  if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
  const filter: Record<string, unknown> = { _id: jobId };
  // Tenant isolation: an owner may only ever touch their own import jobs.
  if (!isSuperAdmin) filter.academyId = academyId;
  return ImportJob.findOne(filter);
}
