import mongoose from "mongoose";
import Passport from "@/lib/models/Passport";
import Achievement from "@/lib/models/Achievement";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * RENAMING AN ACADEMY — and the three places its name is copied
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `academyName` is denormalised into three collections:
 *
 *   Passport.academyHistory[].academyName   every stint a child has had
 *   Passport.records[].academyName          who recorded a tournament entry
 *   Achievement.academyName                 where a badge was earned
 *
 * The model headers explain why: so a child's history survives the academy
 * record being **deleted**. Without the copy, closing an academy would erase
 * the provenance of every badge and tournament its students ever earned.
 *
 * THE QUESTION A RENAME RAISES is whether those copies are a snapshot of what
 * the academy was called at the time, or a cache of its current name.
 *
 * They are a cache. The denormalisation exists to survive DELETION, not to
 * record naming history — and every one of those rows also carries the
 * `academyId`, so the entity is unambiguous. A rename is the same organisation
 * choosing a different name for itself, which means:
 *
 *   · Leaving the copies stale would show one child two different names for
 *     the same academy on the same page — their current stint under the new
 *     name, a tournament from March under the old one — with nothing to
 *     explain the discrepancy. That reads as a bug, because it is one.
 *
 *   · Updating them is precise, because we match on `academyId` and never on
 *     the name string. A different academy that happens to share a name is
 *     untouched, and the deletion-survival property is completely unaffected:
 *     the copies still exist, they are simply current.
 *
 * If an academy ever genuinely rebrands and wants the old name preserved on
 * historical records, that is a different feature — an explicit "trading as"
 * history — and it should be built as one rather than emerging from a stale
 * cache nobody chose to leave stale.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface RenameCascadeResult {
  /** Passport stints repointed (a child may have more than one at this academy). */
  academyHistory: number;
  /** Sporting-record entries repointed. */
  passportRecords: number;
  /** Achievements repointed. */
  achievements: number;
  /** Documents touched, for the audit line. */
  passportsTouched: number;
}

/**
 * Rewrites every denormalised copy of an academy's name.
 *
 * Matches on `academyId` throughout — never on the old name — so a rename can
 * be run repeatedly, is safe when two academies share a name, and cannot be
 * fooled by a row whose copy was already stale.
 *
 * Errors are NOT swallowed. Unlike a metric or a message, a half-applied
 * rename leaves the product visibly inconsistent, so the caller must be able
 * to report it rather than claim success.
 */
export async function cascadeAcademyRename(
  academyId: string | mongoose.Types.ObjectId,
  nextName: string,
): Promise<RenameCascadeResult> {
  const id = new mongoose.Types.ObjectId(String(academyId));
  const name = String(nextName ?? "").trim();
  if (!name)
    throw new Error(
      "cascadeAcademyRename: refusing to write an empty academy name",
    );

  /**
   * `arrayFilters` updates only the matching subdocuments, in one write per
   * collection. Loading each passport, mutating it and saving would be one
   * round trip per student and would race with a coach editing the same
   * document mid-rename.
   */
  const [historyRes, recordsRes, achievementsRes] = await Promise.all([
    Passport.updateMany(
      { "academyHistory.academyId": id },
      { $set: { "academyHistory.$[stint].academyName": name } },
      { arrayFilters: [{ "stint.academyId": id }] },
    ),
    Passport.updateMany(
      { "records.academyId": id },
      { $set: { "records.$[rec].academyName": name } },
      { arrayFilters: [{ "rec.academyId": id }] },
    ),
    Achievement.updateMany({ academyId: id }, { $set: { academyName: name } }),
  ]);

  return {
    academyHistory: historyRes.modifiedCount ?? 0,
    passportRecords: recordsRes.modifiedCount ?? 0,
    achievements: achievementsRes.modifiedCount ?? 0,
    passportsTouched:
      (historyRes.modifiedCount ?? 0) + (recordsRes.modifiedCount ?? 0),
  };
}

/**
 * What a rename WOULD touch, without writing.
 *
 * An owner or platform admin renaming an academy should be able to see the
 * blast radius first — "this also updates 47 passports and 132 achievements"
 * is the difference between a confident click and a support ticket.
 */
export async function previewAcademyRename(
  academyId: string | mongoose.Types.ObjectId,
): Promise<Omit<RenameCascadeResult, "passportsTouched">> {
  const id = new mongoose.Types.ObjectId(String(academyId));
  const [history, records, achievements] = await Promise.all([
    Passport.countDocuments({ "academyHistory.academyId": id }),
    Passport.countDocuments({ "records.academyId": id }),
    Achievement.countDocuments({ academyId: id }),
  ]);
  return { academyHistory: history, passportRecords: records, achievements };
}
