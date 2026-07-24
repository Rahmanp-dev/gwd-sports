import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  studentId: mongoose.Types.ObjectId;
  academyId: mongoose.Types.ObjectId;
  razorpaySubscriptionId: string;
  razorpayPlanId: string;
  planType: 'monthly' | 'quarterly' | 'yearly';
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'halted' | 'cancelled' | 'completed' | 'expired';
  amount: number;
  currentStart?: Date;
  currentEnd?: Date;
  nextBillingAt?: Date;
  chargeAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true },
  razorpaySubscriptionId: { type: String, required: true, unique: true },
  razorpayPlanId: { type: String, required: true },
  planType: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true,
  },
  status: {
    type: String,
    enum: ['created', 'authenticated', 'active', 'paused', 'halted', 'cancelled', 'completed', 'expired'],
    default: 'created',
  },
  amount: { type: Number, required: true },
  currentStart: Date,
  currentEnd: Date,
  nextBillingAt: Date,
  chargeAt: Date,
}, { timestamps: true });

SubscriptionSchema.index({ studentId: 1, academyId: 1 });
SubscriptionSchema.index({ razorpaySubscriptionId: 1 });
SubscriptionSchema.index({ status: 1 });

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
