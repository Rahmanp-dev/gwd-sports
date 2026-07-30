import mongoose, { Schema, Document } from "mongoose";

export interface IFeePayment extends Document {
  orderId: string;
  paymentId?: string;
  signature?: string;

  /**
   * LEGACY RUPEE FIELDS — kept so existing dashboards and finance-analytics
   * queries keep working. These are derived from the paise fields below on
   * write. Do NOT do arithmetic on them: they are floats. Read the *Paise
   * fields for anything that has to balance.
   */
  amount: number;
  baseAmount: number;
  platformFee: number;
  gatewayFee: number;

  /**
   * EXACT INTEGER PAISE FIELDS — the source of truth for all money math and for
   * the daily reconciliation job. Optional because records created before this
   * migration do not have them; treat `undefined` as "legacy, unreconcilable".
   */
  parentTotalPaise?: number;
  academyAmountPaise?: number;
  gatewayFeePaise?: number;
  gwdNetPaise?: number;

  /**
   * What Razorpay actually charged, pulled from the payment entity's `fee` and
   * `tax` fields on capture. Our own gatewayFeePaise is an estimate computed at
   * order time; this is the real number. Reconciliation compares the two.
   */
  gatewayFeeActualPaise?: number;

  currency: string;
  status: "pending" | "success" | "failed" | "refunded" | "partially_refunded";
  receipt?: string;
  studentId?: mongoose.Types.ObjectId;
  academyId?: mongoose.Types.ObjectId;

  transferId?: string;
  transferStatus: "pending" | "processed" | "failed" | "not_applicable" | "reversed";

  /** Which settlement strategy produced this record. See settlement/index.ts. */
  settlementStrategy?: string;

  /**
   * Set once the student's ledger has been credited. This is the idempotency
   * guard: settlement is attempted by both the client verify call and the
   * Razorpay webhook, and whichever arrives second must be a no-op.
   */
  settledAt?: Date;

  refundedTotalPaise?: number;

  description?: string;
  period?: string;

  /**
   * The parent-facing receipt number, e.g. "MGFC/2627/00042".
   *
   * Distinct from `receipt`, which is the internal Razorpay order reference.
   * Allocated ONLY on successful settlement — see lib/payments/receiptNumber.ts
   * for why numbering an unpaid order would leave permanent gaps in a series
   * that is required to be gapless.
   */
  receiptNumber?: string;
  receiptIssuedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const feePaymentSchema = new Schema<IFeePayment>(
  {
    orderId: { type: String, required: true, unique: true },

    // Unique so a webhook replay cannot create a second record for one payment.
    // Sparse because pending orders have no paymentId yet.
    paymentId: { type: String, unique: true, sparse: true },
    signature: { type: String },

    amount: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    gatewayFee: { type: Number, default: 0 },

    parentTotalPaise: { type: Number, min: 0 },
    academyAmountPaise: { type: Number, min: 0 },
    gatewayFeePaise: { type: Number, min: 0 },
    gwdNetPaise: { type: Number, min: 0 },
    gatewayFeeActualPaise: { type: Number, min: 0 },

    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded", "partially_refunded"],
      default: "pending",
    },
    receipt: { type: String },
    studentId: { type: Schema.Types.ObjectId, ref: "User" },
    academyId: { type: Schema.Types.ObjectId, ref: "Academy" },

    transferId: { type: String },
    transferStatus: {
      type: String,
      enum: ["pending", "processed", "failed", "not_applicable", "reversed"],
      default: "pending",
    },

    settlementStrategy: { type: String },
    settledAt: { type: Date },
    refundedTotalPaise: { type: Number, min: 0, default: 0 },

    description: { type: String },
    period: { type: String },

    // Unique sparse: two payments must never share a receipt number, and
    // unsettled orders have none.
    receiptNumber: { type: String, unique: true, sparse: true },
    receiptIssuedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for financial queries
feePaymentSchema.index({ academyId: 1, status: 1 });
/**
 * The engagement rollup and the per-academy insights panel both filter on
 * (academyId, status, settledAt >= window). Without `settledAt` in the index
 * that becomes a scan of every successful payment an academy has ever taken,
 * which only gets slower as a customer succeeds.
 */
feePaymentSchema.index({ academyId: 1, status: 1, settledAt: -1 });
feePaymentSchema.index({ studentId: 1 });
feePaymentSchema.index({ createdAt: -1 });
// Drives the daily reconciliation sweep: recent successful payments.
feePaymentSchema.index({ status: 1, createdAt: -1 });

export const FeePayment = mongoose.models.FeePayment || mongoose.model<IFeePayment>("FeePayment", feePaymentSchema);

export default FeePayment;
