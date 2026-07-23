import mongoose, { Schema, Document } from "mongoose";

export interface IFeePayment extends Document {
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  baseAmount: number;
  platformFee: number;
  gatewayFee: number;
  currency: string;
  status: "pending" | "success" | "failed";
  receipt?: string;
  studentId?: mongoose.Types.ObjectId;
  academyId?: mongoose.Types.ObjectId;
  transferId?: string;
  transferStatus: "pending" | "processed" | "failed";
  description?: string;
  period?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feePaymentSchema = new Schema<IFeePayment>(
  {
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, sparse: true },
    signature: { type: String },
    amount: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    gatewayFee: { type: Number, default: 0 },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    receipt: { type: String },
    studentId: { type: Schema.Types.ObjectId, ref: "User" },
    academyId: { type: Schema.Types.ObjectId, ref: "Academy" },
    transferId: { type: String },
    transferStatus: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
    description: { type: String },
    period: { type: String },
  },
  { timestamps: true }
);

// Indexes for financial queries
feePaymentSchema.index({ academyId: 1, status: 1 });
feePaymentSchema.index({ studentId: 1 });
feePaymentSchema.index({ createdAt: -1 });

export const FeePayment = mongoose.models.FeePayment || mongoose.model<IFeePayment>("FeePayment", feePaymentSchema);

export default FeePayment;
