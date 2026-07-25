import mongoose from 'mongoose';
import StudentProfile from '@/lib/models/Student';
import Passport from '@/lib/models/Passport';
import { normalizePhone } from '@/lib/phone';
import { buildIdentityKey, normalizeStudentName } from '@/lib/passport';
import type { ExtractedRow } from './types';
import type { IImportRow, IImportRowFlag, ImportRowStatus } from '@/lib/models/ImportJob';

/**
 * Turns extracted rows into staged import rows: normalises phones, validates the
 * three required fields, and raises duplicate flags.
 *
 * FLAGS ARE RAISED, NEVER AUTO-RESOLVED. A phone number appearing twice has at
 * least three innocent explanations and one bad one:
 *
 *   - siblings sharing a parent's number      → both records are correct
 *   - a student transferring in               → reuse the existing Passport
 *   - the same student entered twice          → one is a mistake
 *   - a typo copying the number from the row above → one is plain wrong
 *
 * Only the owner can tell these apart, and they can tell instantly by looking at
 * the names. So the system's job is to put the conflict in front of them, not to
 * silently merge (which loses a sibling) or silently duplicate (which sends two
 * welcome messages and bills twice).
 */

/** The three fields a student record cannot be created without. */
export interface RequiredFieldCheck {
  hasName: boolean;
  hasPhone: boolean;
  hasSport: boolean;
}

export interface StageRowsOptions {
  academyId: mongoose.Types.ObjectId | string;
  /**
   * Fallback sport when a row has none. Academies that only teach one sport
   * shouldn't have to type it 60 times, and "sport" being required must not
   * become the thing that blocks a whole import.
   */
  defaultSport?: string | null;
}

export async function stageRows(
  rows: ExtractedRow[],
  options: StageRowsOptions
): Promise<IImportRow[]> {
  const staged: IImportRow[] = rows.map((row, index) => buildStagedRow(row, index, options));

  flagDuplicatesWithinFile(staged);
  await flagDuplicatesAgainstAcademy(staged, options.academyId);
  await flagExistingPassports(staged, options.academyId);

  // Final status pass, after every flag is known.
  for (const row of staged) {
    row.status = deriveStatus(row);
  }

  return staged;
}

function buildStagedRow(
  row: ExtractedRow,
  index: number,
  options: StageRowsOptions
): IImportRow {
  const flags: IImportRowFlag[] = [];

  const normalized = normalizePhone(row.mobileNumber);
  if (row.mobileNumber && !normalized) {
    flags.push({
      type: 'unparseable_phone',
      message: `"${row.mobileNumber}" is not a valid 10-digit Indian mobile number.`,
    });
  }

  const sport = row.sportOrBatch ?? options.defaultSport ?? null;

  const missing: string[] = [];
  if (!row.name) missing.push('name');
  if (!normalized) missing.push('parent mobile number');
  if (!sport) missing.push('sport');

  if (missing.length > 0) {
    flags.push({
      type: 'missing_required_field',
      message: `Missing ${missing.join(', ')}. Fill this in to import the row, or skip it.`,
    });
  }

  return {
    index,
    name: row.name,
    mobileNumber: row.mobileNumber,
    parentName: row.parentName,
    sportOrBatch: sport,
    feeAmount: row.feeAmount,
    normalizedPhone: normalized?.e164 ?? null,
    status: 'pending',
    flags,
    createdPassportId: null,
    createdUserId: null,
    error: null,
    editedByOwner: false,
  };
}

/** Rows within this one upload that share a phone number. */
function flagDuplicatesWithinFile(rows: IImportRow[]): void {
  const byPhone = new Map<string, number[]>();

  for (const row of rows) {
    if (!row.normalizedPhone) continue;
    const group = byPhone.get(row.normalizedPhone) ?? [];
    group.push(row.index);
    byPhone.set(row.normalizedPhone, group);
  }

  for (const [phone, indexes] of byPhone) {
    if (indexes.length < 2) continue;

    for (const index of indexes) {
      const row = rows[index];
      const others = indexes.filter((i) => i !== index);
      const otherNames = others
        .map((i) => rows[i].name ?? `row ${i + 1}`)
        .join(', ');

      // Same phone AND effectively the same name is very likely one student
      // entered twice. Same phone with different names is very likely siblings.
      const sameName = others.some(
        (i) =>
          rows[i].name &&
          row.name &&
          normalizeStudentName(rows[i].name!) === normalizeStudentName(row.name)
      );

      row.flags.push({
        type: 'duplicate_phone_in_file',
        message: sameName
          ? `Same number (${phone}) and same name as ${otherNames} — likely the same student entered twice.`
          : `Shares number ${phone} with ${otherNames} — siblings, or a copy-paste error?`,
        relatedRowIndexes: others,
      });
    }
  }
}

/** Rows whose phone already belongs to a student enrolled at THIS academy. */
async function flagDuplicatesAgainstAcademy(
  rows: IImportRow[],
  academyId: mongoose.Types.ObjectId | string
): Promise<void> {
  const phones = [...new Set(rows.map((r) => r.normalizedPhone).filter(Boolean))] as string[];
  if (phones.length === 0) return;

  const existing = await StudentProfile.find({
    academyId,
    parentPhoneE164: { $in: phones },
  })
    .select('parentPhoneE164 passportId userId')
    .populate('userId', 'name')
    .lean();

  if (existing.length === 0) return;

  const byPhone = new Map<string, any[]>();
  for (const profile of existing as any[]) {
    const group = byPhone.get(profile.parentPhoneE164) ?? [];
    group.push(profile);
    byPhone.set(profile.parentPhoneE164, group);
  }

  for (const row of rows) {
    if (!row.normalizedPhone) continue;
    const matches = byPhone.get(row.normalizedPhone);
    if (!matches?.length) continue;

    const names = matches.map((m) => m.userId?.name ?? 'an existing student').join(', ');
    row.flags.push({
      type: 'duplicate_phone_in_academy',
      message: `${names} at this academy already uses ${row.normalizedPhone}. A sibling, or already imported?`,
    });
  }
}

/**
 * Rows that already have a global Passport — a transfer or a re-enrolment.
 * This is informational, not a problem: commit will reuse the passport.
 */
async function flagExistingPassports(
  rows: IImportRow[],
  academyId: mongoose.Types.ObjectId | string
): Promise<void> {
  const keys = rows
    .filter((row) => row.normalizedPhone && row.name)
    .map((row) => ({
      index: row.index,
      identityKey: buildIdentityKey(row.normalizedPhone!, row.name!),
    }));

  if (keys.length === 0) return;

  const passports = await Passport.find({
    identityKey: { $in: keys.map((k) => k.identityKey) },
  })
    .select('identityKey passportId currentAcademyId academyHistory studentName')
    .lean();

  if (passports.length === 0) return;

  const byKey = new Map(passports.map((p: any) => [p.identityKey, p]));

  for (const { index, identityKey } of keys) {
    const passport: any = byKey.get(identityKey);
    if (!passport) continue;

    const row = rows[index];
    const isSameAcademy = String(passport.currentAcademyId ?? '') === String(academyId);

    if (isSameAcademy) {
      row.flags.push({
        type: 'existing_passport_same_academy',
        message: `${passport.studentName} already has passport ${passport.passportId} at this academy. Importing again will update the existing record, not create a second one.`,
        relatedPassportId: passport.passportId,
      });
    } else {
      const previous = passport.academyHistory?.find(
        (stint: any) => String(stint.academyId) === String(passport.currentAcademyId)
      );
      row.flags.push({
        type: 'existing_passport_other_academy',
        message: `${passport.studentName} already holds passport ${passport.passportId}${
          previous?.academyName ? ` at ${previous.academyName}` : ''
        }. Importing will transfer them here and keep their existing history.`,
        relatedPassportId: passport.passportId,
      });
    }
  }
}

/**
 * A row is `ready` only when all three required fields are present. Anything
 * with a duplicate flag goes to `needs_review` even if complete — the owner must
 * consciously accept a duplicate rather than have it slip through.
 *
 * An existing-passport flag alone does NOT force review: a transfer is a normal
 * outcome that commit handles correctly, and stopping on it would make every
 * re-import a manual chore.
 */
function deriveStatus(row: IImportRow): ImportRowStatus {
  const hasRequired = Boolean(row.name && row.normalizedPhone && row.sportOrBatch);
  if (!hasRequired) return 'needs_review';

  const needsDecision = row.flags.some(
    (flag) =>
      flag.type === 'duplicate_phone_in_file' ||
      flag.type === 'duplicate_phone_in_academy' ||
      flag.type === 'low_ocr_confidence'
  );

  return needsDecision ? 'needs_review' : 'ready';
}

/** Re-validates a single row after the owner edits it in the review table. */
export function revalidateRow(row: IImportRow, defaultSport?: string | null): IImportRow {
  const normalized = normalizePhone(row.mobileNumber);
  row.normalizedPhone = normalized?.e164 ?? null;

  if (!row.sportOrBatch && defaultSport) {
    row.sportOrBatch = defaultSport;
  }

  // Drop the flags that owner edits can resolve; keep the duplicate flags, which
  // are recomputed against the whole job.
  row.flags = row.flags.filter(
    (flag) => flag.type !== 'missing_required_field' && flag.type !== 'unparseable_phone'
  );

  if (row.mobileNumber && !normalized) {
    row.flags.push({
      type: 'unparseable_phone',
      message: `"${row.mobileNumber}" is not a valid 10-digit Indian mobile number.`,
    });
  }

  const missing: string[] = [];
  if (!row.name) missing.push('name');
  if (!row.normalizedPhone) missing.push('parent mobile number');
  if (!row.sportOrBatch) missing.push('sport');
  if (missing.length > 0) {
    row.flags.push({
      type: 'missing_required_field',
      message: `Missing ${missing.join(', ')}. Fill this in to import the row, or skip it.`,
    });
  }

  row.editedByOwner = true;
  row.status = deriveStatus(row);
  return row;
}
