import crypto from 'crypto';
import mongoose from 'mongoose';
import Passport, { type IPassport } from '@/lib/models/Passport';
import { requirePhone } from '@/lib/phone';

/**
 * Passport ID alphabet: Crockford-style base32 with the ambiguous characters
 * removed (no I, L, O, U, 0, 1). A parent reads these off a phone screen and
 * types them, or reads them aloud over a phone call, so O/0 and I/1 confusion is
 * a real support cost.
 */
const ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const ID_LENGTH = 6;
const ID_PREFIX = 'GWD';

/**
 * Generates a random passport ID. 30^6 ≈ 729 million combinations, which is
 * ample, and being random rather than sequential means the ID does not leak how
 * many students are on the platform.
 */
export function generatePassportId(): string {
  const bytes = crypto.randomBytes(ID_LENGTH);
  let out = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  }
  return `${ID_PREFIX}-${out}`;
}

/**
 * Normalises a student name for identity matching.
 *
 * Collapses case, whitespace and punctuation so "Rohan  Sharma", "rohan sharma"
 * and "Rohan Sharma." are recognised as the same child. Deliberately
 * conservative — it does NOT attempt nickname or transliteration matching
 * ("Rohan" vs "Rohit", "Priya" vs "Preeya"), because guessing wrong merges two
 * different children's records, which is far worse than creating two records the
 * owner can merge later.
 */
export function normalizeStudentName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      // Punctuation becomes a SPACE, not nothing. Deleting it made
      // "Rohan-Sharma" normalise to "rohansharma" while "Rohan Sharma" became
      // "rohan sharma" — two different keys, so the same child imported once
      // from a register and once from a spreadsheet would get two passports.
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

export function buildIdentityKey(parentPhoneE164: string, studentName: string): string {
  return `${parentPhoneE164}::${normalizeStudentName(studentName)}`;
}

export interface FindOrCreatePassportInput {
  studentName: string;
  parentPhone: string;
  parentName?: string | null;
  sports?: string[];
  dateOfBirth?: Date | null;
  academyId?: mongoose.Types.ObjectId | string | null;
  academyName?: string;
  studentProfileId?: mongoose.Types.ObjectId | string | null;
}

export interface FindOrCreatePassportResult {
  passport: IPassport;
  /** True when a brand-new global identity was minted. */
  created: boolean;
  /**
   * True when an existing passport was found that belonged to a DIFFERENT
   * academy — i.e. this is a transfer or a re-enrolment, not a new student.
   * The caller should surface this to the owner.
   */
  transferredFrom?: { academyId: string; academyName: string } | null;
}

/**
 * Finds the student's existing global Passport, or mints one.
 *
 * THIS IS THE FUNCTION THAT MUST NOT CREATE DUPLICATES. A student who leaves one
 * academy and joins another, or who re-enrols after a gap, must come back to the
 * same Passport — same ID, same history, same URL the parent already bookmarked.
 *
 * Matching is on (normalised parent phone + normalised student name). Phone
 * alone is insufficient because siblings share a parent's number; name alone is
 * insufficient because names repeat. The combination is enforced by a unique
 * index on identityKey, so even a race between two concurrent imports cannot
 * produce two passports for one child — the loser catches the duplicate-key
 * error and re-reads the winner's document.
 */
export async function findOrCreatePassport(
  input: FindOrCreatePassportInput
): Promise<FindOrCreatePassportResult> {
  const phone = requirePhone(input.parentPhone);
  const identityKey = buildIdentityKey(phone.e164, input.studentName);

  const existing = await Passport.findOne({ identityKey });
  if (existing) {
    return {
      passport: await attachToAcademy(existing, input),
      created: false,
      transferredFrom: detectTransfer(existing, input.academyId),
    };
  }

  const academyId = input.academyId ? new mongoose.Types.ObjectId(String(input.academyId)) : null;
  const history: Array<Record<string, unknown>> =
    academyId && input.academyName
      ? [{ academyId, academyName: input.academyName, joinedAt: new Date(), leftAt: null }]
      : [];

  // Retry on passportId collision. Astronomically unlikely, but a collision that
  // surfaces as a 500 during a 60-student import is not an acceptable outcome.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const passport = await Passport.create({
        passportId: generatePassportId(),
        studentName: input.studentName.trim(),
        dateOfBirth: input.dateOfBirth ?? null,
        parentName: input.parentName?.trim() || null,
        parentPhone: phone.e164,
        sports: (input.sports ?? []).filter(Boolean),
        identityKey,
        currentAcademyId: academyId,
        currentStudentProfileId: input.studentProfileId
          ? new mongoose.Types.ObjectId(String(input.studentProfileId))
          : null,
        academyHistory: history,
        isActive: true,
      });
      return { passport, created: true, transferredFrom: null };
    } catch (err: any) {
      if (err?.code !== 11000) throw err;

      // Which unique index tripped?
      const keyPattern = err?.keyPattern ?? {};
      if (keyPattern.identityKey) {
        // A concurrent writer created this same student's passport first. That is
        // the correct outcome — adopt theirs rather than forcing a second.
        const winner = await Passport.findOne({ identityKey });
        if (winner) {
          return {
            passport: await attachToAcademy(winner, input),
            created: false,
            transferredFrom: detectTransfer(winner, input.academyId),
          };
        }
      }
      // Otherwise it was a passportId collision — loop and generate a new one.
    }
  }

  throw new Error('Could not allocate a unique passport ID after 5 attempts');
}

function detectTransfer(
  passport: IPassport,
  incomingAcademyId?: mongoose.Types.ObjectId | string | null
): { academyId: string; academyName: string } | null {
  if (!incomingAcademyId || !passport.currentAcademyId) return null;
  if (String(passport.currentAcademyId) === String(incomingAcademyId)) return null;

  const previous = passport.academyHistory.find(
    (stint) => String(stint.academyId) === String(passport.currentAcademyId)
  );
  return {
    academyId: String(passport.currentAcademyId),
    academyName: previous?.academyName ?? 'a previous academy',
  };
}

/**
 * Points an existing passport at the academy the student is now training with,
 * closing out the previous stint. Appends to history; never rewrites it.
 */
async function attachToAcademy(
  passport: IPassport,
  input: FindOrCreatePassportInput
): Promise<IPassport> {
  if (!input.academyId) return passport;

  const academyId = new mongoose.Types.ObjectId(String(input.academyId));
  const isSameAcademy = String(passport.currentAcademyId ?? '') === String(academyId);

  if (isSameAcademy) {
    // Re-import of a student already here. Backfill anything newly supplied but
    // never overwrite an existing value with an empty one.
    let dirty = false;
    if (input.parentName && !passport.parentName) {
      passport.parentName = input.parentName.trim();
      dirty = true;
    }
    if (input.dateOfBirth && !passport.dateOfBirth) {
      passport.dateOfBirth = input.dateOfBirth;
      dirty = true;
    }
    for (const sport of input.sports ?? []) {
      if (sport && !passport.sports.includes(sport.toLowerCase())) {
        passport.sports.push(sport.toLowerCase());
        dirty = true;
      }
    }
    if (input.studentProfileId && !passport.currentStudentProfileId) {
      passport.currentStudentProfileId = new mongoose.Types.ObjectId(
        String(input.studentProfileId)
      );
      dirty = true;
    }
    if (dirty) await passport.save();
    return passport;
  }

  // A genuine move. Close the open stint, open a new one.
  const now = new Date();
  for (const stint of passport.academyHistory) {
    if (!stint.leftAt && String(stint.academyId) === String(passport.currentAcademyId)) {
      stint.leftAt = now;
    }
  }
  passport.academyHistory.push({
    academyId,
    academyName: input.academyName ?? 'Unknown academy',
    joinedAt: now,
    leftAt: null,
  });
  passport.currentAcademyId = academyId;
  passport.currentStudentProfileId = input.studentProfileId
    ? new mongoose.Types.ObjectId(String(input.studentProfileId))
    : null;
  passport.isActive = true;

  await passport.save();
  return passport;
}

/**
 * Records that the parent opened a passport or payment link. Drives the
 * activation dashboard's "engaged" count.
 */
export async function recordParentEngagement(passportId: string): Promise<void> {
  const now = new Date();
  const id = passportId.toUpperCase();
  try {
    // Two writes rather than one, because $min cannot be used to "set if unset"
    // here: a null field compares as less than any date, so $min would leave the
    // null in place and first-engagement would never be recorded.
    await Passport.updateOne(
      { passportId: id, parentFirstEngagedAt: null },
      { $set: { parentFirstEngagedAt: now } }
    );
    await Passport.updateOne({ passportId: id }, { $set: { parentLastEngagedAt: now } });
  } catch (err: any) {
    // Engagement tracking is a metric, never a blocker on serving the page.
    console.warn('[passport] engagement update failed:', err?.message);
  }
}
