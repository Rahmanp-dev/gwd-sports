import mongoose, { Schema, Document } from 'mongoose';

/**
 * A dashboard notification for the academy owner. NEVER sent to a parent.
 *
 * This model exists because of a deliberate product rule in the fee cadence: past
 * a certain point, escalation stops being automated and becomes the owner's
 * personal call.
 *
 *   T+3  overdue → parent gets a WhatsApp AND an alert is raised here
 *   T+7  overdue → alert ONLY. No further automated message to the parent.
 *   T+15 overdue → alert marked as a decision point.
 *
 * The system NEVER restricts a student's access or attendance on its own. Barring
 * a child from practice over a late fee is a relationship decision with
 * consequences the platform cannot see, so `requiresOwnerDecision` surfaces it
 * and stops there. Any code that reads this model to gate access is a bug.
 */

export type OwnerAlertType =
  | 'fee_overdue_3'
  | 'fee_overdue_7'
  | 'fee_overdue_15'
  | 'message_delivery_failed'
  | 'student_missing_contact'
  | 'payment_reconciliation_mismatch'
  | 'payment_failed';

export type OwnerAlertSeverity = 'info' | 'warning' | 'critical';

export interface IOwnerAlert extends Document {
  academyId: mongoose.Types.ObjectId;
  type: OwnerAlertType;
  severity: OwnerAlertSeverity;

  /** Who this is about. */
  passportId?: string | null;
  studentUserId?: mongoose.Types.ObjectId | null;
  studentName?: string | null;
  parentPhone?: string | null;

  title: string;
  body: string;

  /** The concrete next action, phrased for a human. */
  suggestedAction?: string | null;

  /**
   * True when the platform is explicitly declining to act and handing the
   * decision to the owner. The T+15 case sets this.
   */
  requiresOwnerDecision: boolean;

  /** Amount in integer paise, when the alert concerns money. */
  amountPaise?: number | null;
  daysOverdue?: number | null;

  acknowledgedAt?: Date | null;
  acknowledgedBy?: mongoose.Types.ObjectId | null;
  resolvedAt?: Date | null;

  /** Unique sparse: one alert per student per stage, not one per cron run. */
  dedupeKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ownerAlertSchema = new Schema<IOwnerAlert>(
  {
    academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },

    passportId: { type: String, default: null, uppercase: true, trim: true },
    studentUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    studentName: { type: String, default: null },
    parentPhone: { type: String, default: null },

    title: { type: String, required: true },
    body: { type: String, required: true },
    suggestedAction: { type: String, default: null },

    requiresOwnerDecision: { type: Boolean, default: false },

    amountPaise: { type: Number, default: null, min: 0 },
    daysOverdue: { type: Number, default: null },

    acknowledgedAt: { type: Date, default: null },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },

    dedupeKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// The dashboard's default view: unresolved alerts, most severe and newest first.
ownerAlertSchema.index({ academyId: 1, resolvedAt: 1, severity: 1, createdAt: -1 });
ownerAlertSchema.index({ academyId: 1, passportId: 1 });

export const OwnerAlert: mongoose.Model<IOwnerAlert> =
  (mongoose.models.OwnerAlert as mongoose.Model<IOwnerAlert>) ||
  mongoose.model<IOwnerAlert>('OwnerAlert', ownerAlertSchema);

export default OwnerAlert;
