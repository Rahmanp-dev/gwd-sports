import mongoose, { Schema, Document } from 'mongoose';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * AN ACHIEVEMENT BELONGS TO THE CHILD, NOT TO THE ACADEMY
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Keyed on `passportId`, deliberately, and NOT tenant-scoped — the same rule
 * the Passport model states and for the same reason. A child who earned a
 * hundred-session badge at one academy and transfers has still attended a
 * hundred sessions. Scoping this by academyId would delete their record on
 * transfer, which is precisely what the Passport exists to prevent.
 *
 * `academyId` and `academyName` below record WHERE it was earned. That is
 * provenance, not ownership — the name is denormalised so the history survives
 * even if the academy record is later removed.
 *
 * WHY A COLLECTION AND NOT A SUBDOCUMENT ON StudentProfile: StudentProfile is
 * the academy's enrolment record and is created afresh on each enrolment. An
 * achievement has to outlive it.
 * ════════════════════════════════════════════════════════════════════════════
 */

export type AchievementSource = 'automatic' | 'coach_awarded';

export interface IAchievement extends Document {
  /** Public, permanent. The link between a child and everything they earned. */
  passportId: string;

  /** Stable identifier for the rule that produced this, e.g. 'streak_10'. */
  key: string;
  name: string;
  description: string;
  /** Single emoji, shown on the passport. Kept out of the name for layout. */
  icon?: string | null;

  source: AchievementSource;
  /** The coach, when a human awarded it. Null for automatic. */
  awardedBy?: mongoose.Types.ObjectId | null;

  /** Provenance — where this was earned, not who owns it. */
  academyId?: mongoose.Types.ObjectId | null;
  academyName?: string | null;
  studentUserId?: mongoose.Types.ObjectId | null;

  /**
   * The numbers that triggered the rule, frozen at the moment of earning. A
   * badge that says "10 sessions in a row" must keep meaning that even after
   * the streak breaks.
   */
  evidence?: Record<string, unknown>;

  earnedAt: Date;

  /**
   * Unique sparse. One award per rule per passport, forever — otherwise every
   * cron tick that re-evaluates the rules awards the same badge again and the
   * parent gets the same congratulations message every fifteen minutes.
   */
  dedupeKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    passportId: { type: String, required: true, uppercase: true, trim: true, index: true },

    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    icon: { type: String, default: null },

    source: { type: String, enum: ['automatic', 'coach_awarded'], default: 'automatic' },
    awardedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', default: null },
    academyName: { type: String, default: null },
    studentUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    evidence: { type: Schema.Types.Mixed, default: {} },

    earnedAt: { type: Date, default: Date.now },

    dedupeKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// The passport page: everything this child has earned, newest first.
achievementSchema.index({ passportId: 1, earnedAt: -1 });

export const Achievement: mongoose.Model<IAchievement> =
  (mongoose.models.Achievement as mongoose.Model<IAchievement>) ||
  mongoose.model<IAchievement>('Achievement', achievementSchema);

export default Achievement;
