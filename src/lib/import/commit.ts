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

  await academy.save();

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

  if (!user) {
    user = await User.create({
      name: row.name!.slice(0, 50),
      email: placeholderEmail(passport.passportId),
      // Random and never disclosed: this account is not meant to be logged into.
      password: crypto.randomBytes(24).toString('hex'),
      phone: phone.e164,
      role: 'student',
      academyId: academy._id,
      sports: [sport],
      isImportedPlaceholder: true,
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
    event: buildStudentCreatedEvent({ row, job, academy, user, profile, passport, passportResult }),
  };
}

/**
 * Synthetic email for a register-imported student.
 *
 * On a subdomain of a domain GWD controls, with no MX record, so it can never
 * collide with a real address and can never receive or send mail. Derived from
 * the passport ID so it is stable and traceable back to the student.
 *
 * The alternative — making User.email sparse and optional — is cleaner but
 * requires dropping and rebuilding a unique index on a live collection. Flagged
 * as follow-up rather than done silently two days before onboarding customers.
 */
function placeholderEmail(passportId: string): string {
  return `${passportId.toLowerCase()}@import.gwd.in`;
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
