import mongoose, { Schema, Document } from "mongoose";

export interface IFeePayment extends Document {
  orderId: string;
  paymentId?: string;
  signature?: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed";
  receipt?: string;
  studentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const feePaymentSchema = new Schema<IFeePayment>(
  {
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, sparse: true },
    signature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    receipt: { type: String },
    studentId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const FeePayment = mongoose.model<IFeePayment>("FeePayment", feePaymentSchema);
