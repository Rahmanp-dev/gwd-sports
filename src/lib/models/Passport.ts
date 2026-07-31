import mongoose, { Schema, Document, Types } from 'mongoose';
import { RECORD_KINDS, RECORD_LEVELS } from '@/lib/passport/records';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE STUDENT SPORTS PASSPORT — GLOBAL, PERMANENT, NEVER TENANT-SCOPED
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every other model in this system is scoped by academyId. This one is NOT, and
 * that is the entire point of it.
 *
 * A Passport is the child's athletic identity. It outlives their membership of
 * any particular academy: a student who moves from MasterGrade Cricket to
 * another academy keeps the same Passport, the same passportId, the same URL,
 * and the same history. Their record does not restart.
 *
 * RULES FOR ANYONE TOUCHING THIS FILE:
 *
 *  1. DO NOT add an `academyId` scoping field. `currentAcademyId` below is a
 *     pointer to where the student trains right now — it is not ownership, and
 *     changing it must never be treated as re-scoping the record.
 *  2. DO NOT filter Passport queries by the caller's tenant by default. Tenant
 *     filtering belongs on StudentProfile, which is the academy's enrolment
 *     record. A cross-academy transfer has to be able to FIND the existing
 *     passport, which is impossible if lookups are tenant-filtered.
 *  3. DO NOT delete or recreate a Passport on transfer or re-enrolment. Append
 *     to academyHistory instead.
 *  4. `passportId` is public and permanent. It appears in URLs the parent
 *     bookmarks (/passport/<id>, /pay/<id>). It must never be regenerated.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface IAcademyStint {
  academyId: mongoose.Types.ObjectId;
  /** Denormalised so history survives even if the academy record is removed. */
  academyName: string;
  joinedAt: Date;
  leftAt?: Date | null;
}

/**
 * One curated entry in the child's sporting history — a tournament played, a
 * league entered, a camp completed, a trial attended, a certification earned.
 *
 * These live HERE rather than on StudentProfile for the same reason
 * academyHistory does: they happened to the child, not to their current
 * enrolment, and rule 3 above says a transfer must not restart the record.
 * `academyName` is denormalised in so provenance survives the academy itself
 * being removed.
 *
 * Every field on this subdocument is published by lib/passport/records.ts —
 * except `recordedBy`, which is retained for accountability inside the academy
 * and deliberately never leaves the server. See that module's header.
 */
export interface IPassportRecord {
  _id: mongoose.Types.ObjectId;
  kind: string;
  title: string;
  organisation?: string | null;
  sport?: string | null;
  level?: string | null;
  result?: string | null;
  startedOn: Date;
  endedOn?: Date | null;
  location?: string | null;
  /** Public-facing. Named "summary" and not "notes" on purpose — see records.ts. */
  summary?: string | null;

  /** Which academy entered it. NOT a tenant scope — it is provenance. */
  academyId?: mongoose.Types.ObjectId | null;
  academyName?: string | null;

  /** Internal accountability. Never published. */
  recordedBy?: mongoose.Types.ObjectId | null;
  recordedAt: Date;
  updatedAt?: Date | null;
}

export interface IPassport extends Document {
  /** Public, permanent, URL-safe identifier. e.g. "GWD-7K2M9X". */
  passportId: string;

  studentName: string;
  dateOfBirth?: Date | null;
  photoUrl?: string | null;

  parentName?: string | null;
  /** E.164 normalised. The identity key for parent lookups and QR check-in. */
  parentPhone: string;

  sports: string[];

  /**
   * Deterministic dedupe key: `${parentPhone}::${normalisedStudentName}`.
   * Uniquely indexed, which is what makes "never create a duplicate Passport
   * for the same student" a database guarantee rather than a hopeful check.
   */
  identityKey: string;

  /** Where the student trains NOW. A pointer. Null when unaffiliated. */
  currentAcademyId?: mongoose.Types.ObjectId | null;
  /** The academy-scoped enrolment record backing the current placement. */
  currentStudentProfileId?: mongoose.Types.ObjectId | null;

  academyHistory: IAcademyStint[];

  /** Curated sporting history. See IPassportRecord. */
  records: Types.DocumentArray<IPassportRecord>;

  /**
   * Set the first time the parent opens any passport or payment link. This is
   * the "engaged parent" signal the activation dashboard counts, and what
   * Phase 2's welcome-message click-through will populate.
   */
  parentFirstEngagedAt?: Date | null;
  parentLastEngagedAt?: Date | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const academyStintSchema = new Schema<IAcademyStint>(
  {
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true },
    academyName: { type: String, required: true },
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date, default: null },
  },
  { _id: false }
);

/**
 * `_id` is left ON (unlike academyStintSchema) because these are individually
 * editable and deletable by a coach — the id is the handle the PATCH and DELETE
 * routes address, and without it there is no stable way to name one row.
 */
const passportRecordSchema = new Schema<IPassportRecord>(
  {
    kind: { type: String, required: true, enum: RECORD_KINDS as unknown as string[] },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    organisation: { type: String, trim: true, default: null, maxlength: 120 },
    sport: { type: String, trim: true, lowercase: true, default: null },
    level: { type: String, enum: [...RECORD_LEVELS, null], default: null },
    result: { type: String, trim: true, default: null, maxlength: 80 },
    startedOn: { type: Date, required: true },
    endedOn: { type: Date, default: null },
    location: { type: String, trim: true, default: null, maxlength: 120 },
    summary: { type: String, trim: true, default: null, maxlength: 400 },

    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', default: null },
    academyName: { type: String, trim: true, default: null },

    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    recordedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
  },
  { _id: true }
);

const passportSchema = new Schema<IPassport>(
  {
    passportId: { type: String, required: true, unique: true, uppercase: true, trim: true },

    studentName: { type: String, required: true, trim: true, maxlength: 100 },
    dateOfBirth: { type: Date, default: null },
    photoUrl: { type: String, default: null },

    parentName: { type: String, trim: true, default: null, maxlength: 100 },
    parentPhone: { type: String, required: true, trim: true },

    sports: [{ type: String, trim: true, lowercase: true }],

    identityKey: { type: String, required: true, unique: true },

    // NOT a tenant scope. See the header comment.
    currentAcademyId: { type: Schema.Types.ObjectId, ref: 'Academy', default: null },
    currentStudentProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentProfile',
      default: null,
    },

    academyHistory: { type: [academyStintSchema], default: [] },

    records: { type: [passportRecordSchema], default: [] },

    parentFirstEngagedAt: { type: Date, default: null },
    parentLastEngagedAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Parent lookup for QR check-in and sibling resolution.
passportSchema.index({ parentPhone: 1 });
// Roster views for the academy a student currently trains at.
passportSchema.index({ currentAcademyId: 1, isActive: 1 });
// Activation dashboard: engaged vs dormant per academy.
passportSchema.index({ currentAcademyId: 1, parentFirstEngagedAt: 1 });

export const Passport =
  mongoose.models.Passport || mongoose.model<IPassport>('Passport', passportSchema);

export default Passport;
