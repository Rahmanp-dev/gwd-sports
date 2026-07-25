import mongoose, { Schema, Document } from 'mongoose';

/**
 * A staged bulk import.
 *
 * WHY EXTRACTION IS PERSISTED RATHER THAN HELD IN THE BROWSER: the hard
 * requirement is that nothing reaches the student collections until the owner
 * confirms. Holding 60 OCR-extracted rows in React state satisfies that, but
 * loses everything if the tab reloads mid-review — and reviewing 60 handwritten
 * rows takes long enough that this will happen. It also means an OCR call
 * (billed, slow) would have to be repeated.
 *
 * So extraction writes here, review edits here, and only `commit` writes to
 * Passport / User / StudentProfile.
 */

export type ImportMethod = 'register_ocr' | 'whatsapp_text' | 'csv';

export type ImportRowStatus =
  | 'pending'      // awaiting owner review
  | 'ready'        // reviewed, valid, will be created on commit
  | 'needs_review' // missing a required field or flagged as a possible duplicate
  | 'skipped'      // owner chose to exclude
  | 'created'      // committed successfully
  | 'failed';      // commit attempted and failed

/**
 * A duplicate flag. These are raised, never auto-resolved: the same phone number
 * appearing twice could be siblings (legitimate), a transferring student
 * (legitimate), or a data-entry error (not). Only the owner knows which, so the
 * system's job is to surface it clearly rather than to silently merge.
 */
export interface IImportRowFlag {
  type:
    | 'duplicate_phone_in_file'
    | 'duplicate_phone_in_academy'
    | 'existing_passport_same_academy'
    | 'existing_passport_other_academy'
    | 'missing_required_field'
    | 'unparseable_phone'
    | 'low_ocr_confidence';
  message: string;
  /** Other rows in this job involved in the same conflict, by index. */
  relatedRowIndexes?: number[];
  /** An existing passport this row may be a duplicate of. */
  relatedPassportId?: string;
}

export interface IImportRow {
  /** Stable index within the job, used by the review UI to address rows. */
  index: number;

  // The extracted fields. Everything except name/phone/sport may be null —
  // import must never be blocked on optional data.
  name: string | null;
  mobileNumber: string | null;
  parentName: string | null;
  sportOrBatch: string | null;
  feeAmount: number | null;

  /** Normalised E.164, derived from mobileNumber. Null when unparseable. */
  normalizedPhone: string | null;

  status: ImportRowStatus;
  flags: IImportRowFlag[];

  /** Set on commit. */
  createdPassportId?: string | null;
  createdUserId?: mongoose.Types.ObjectId | null;
  error?: string | null;

  /** True once the owner has edited this row, so re-extraction won't clobber it. */
  editedByOwner?: boolean;
}

export interface IImportJob extends Document {
  academyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  method: ImportMethod;

  status: 'extracting' | 'awaiting_review' | 'committing' | 'committed' | 'failed';

  rows: IImportRow[];

  /** Provenance for audit and for re-running a failed extraction. */
  sourceImageUrl?: string | null;
  sourceTextPreview?: string | null;
  sourceFileName?: string | null;

  /** Which model produced the extraction, for debugging bad OCR results. */
  extractionModel?: string | null;
  extractionError?: string | null;

  committedAt?: Date | null;
  summary?: {
    created: number;
    skipped: number;
    failed: number;
    passportsReused: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const importRowFlagSchema = new Schema<IImportRowFlag>(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    relatedRowIndexes: [{ type: Number }],
    relatedPassportId: { type: String },
  },
  { _id: false }
);

const importRowSchema = new Schema<IImportRow>(
  {
    index: { type: Number, required: true },

    name: { type: String, default: null, trim: true },
    mobileNumber: { type: String, default: null, trim: true },
    parentName: { type: String, default: null, trim: true },
    sportOrBatch: { type: String, default: null, trim: true },
    feeAmount: { type: Number, default: null, min: 0 },

    normalizedPhone: { type: String, default: null },

    status: {
      type: String,
      enum: ['pending', 'ready', 'needs_review', 'skipped', 'created', 'failed'],
      default: 'pending',
    },
    flags: { type: [importRowFlagSchema], default: [] },

    createdPassportId: { type: String, default: null },
    createdUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    error: { type: String, default: null },
    editedByOwner: { type: Boolean, default: false },
  },
  { _id: false }
);

const importJobSchema = new Schema<IImportJob>(
  {
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    method: {
      type: String,
      enum: ['register_ocr', 'whatsapp_text', 'csv'],
      required: true,
    },
    status: {
      type: String,
      enum: ['extracting', 'awaiting_review', 'committing', 'committed', 'failed'],
      default: 'extracting',
    },

    rows: { type: [importRowSchema], default: [] },

    sourceImageUrl: { type: String, default: null },
    sourceTextPreview: { type: String, default: null },
    sourceFileName: { type: String, default: null },

    extractionModel: { type: String, default: null },
    extractionError: { type: String, default: null },

    committedAt: { type: Date, default: null },
    summary: {
      created: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      passportsReused: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

importJobSchema.index({ academyId: 1, createdAt: -1 });
importJobSchema.index({ academyId: 1, status: 1 });

// Explicitly typed: the `models.X || model<X>()` idiom used elsewhere in this
// project widens to `any`, which silently erases row typing everywhere the
// import pipeline touches job.rows.
export const ImportJob: mongoose.Model<IImportJob> =
  (mongoose.models.ImportJob as mongoose.Model<IImportJob>) ||
  mongoose.model<IImportJob>('ImportJob', importJobSchema);

export default ImportJob;
