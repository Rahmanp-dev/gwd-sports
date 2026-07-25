import mongoose, { Schema, Document } from 'mongoose';

/**
 * A training batch — "Cricket, Evening" — within one academy.
 *
 * Tenant-scoped by academyId, unlike Passport.
 *
 * Introduced in Phase 1 because bulk import captures a batch name per student
 * and needs somewhere real to put it. Kept deliberately minimal here: Phase 3
 * builds the session/QR machinery on top, and `qrToken` plus the schedule fields
 * exist now so the batch identity a student is imported into is the same one the
 * QR code will later resolve to. No throwaway string field to migrate later.
 */

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface IBatch extends Document {
  academyId: mongoose.Types.ObjectId;
  name: string;
  sport: string;

  /** Coaches assigned to this batch. Ref User (role: trainer). */
  coaches: mongoose.Types.ObjectId[];

  /** Recurring schedule. Drives which dated session a QR scan resolves to. */
  daysOfWeek: Weekday[];
  /** "HH:MM" 24-hour, academy-local time. */
  startTime?: string;
  endTime?: string;

  /**
   * Opaque token embedded in this batch's printed QR code. One static code per
   * batch, per the Phase 3 design — not one per student. Rotatable without
   * changing the batch identity, so a leaked or photographed code can be
   * replaced by reprinting rather than by rebuilding the roster.
   */
  qrToken?: string;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    sport: { type: String, required: true, trim: true, lowercase: true },

    coaches: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    daysOfWeek: [
      {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    ],
    startTime: { type: String, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM'] },
    endTime: { type: String, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM'] },

    qrToken: { type: String, unique: true, sparse: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One batch name per sport per academy — stops import creating "Evening" twice.
batchSchema.index({ academyId: 1, name: 1, sport: 1 }, { unique: true });
batchSchema.index({ academyId: 1, isActive: 1 });

export const Batch = mongoose.models.Batch || mongoose.model<IBatch>('Batch', batchSchema);

export default Batch;
