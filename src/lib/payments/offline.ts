import mongoose from 'mongoose';
import StudentProfile from '@/lib/models/Student';
import { FeePayment } from '@/lib/models/FeePayment';
import { paiseToRupees } from './money';
import { validateAdminSuppliedAmount } from './dues';
import { emitEvent } from '@/lib/events/emit';

export class OfflinePaymentError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface OfflinePaymentResult {
  feePaymentId: string;
  totalPaid: number;
  outstanding: number;
}

/**
 * Records money the academy received outside the platform (cash, direct UPI,
 * bank transfer) against a student's ledger.
 *
 * Shared by /api/payments/pay and /api/student/pay-fees, which were two
 * divergent implementations of the same operation — one credited the wrong
 * student, the other wrote no FeePayment record at all, and neither checked
 * tenant boundaries. One implementation is easier to keep correct than two.
 */
export async function recordOfflinePayment(params: {
  studentUserId: string;
  amount: unknown;
  period?: string;
  transactionId?: string;
  note?: string;
  actor: { _id: unknown; role: string; academyId?: string | null };
}): Promise<OfflinePaymentResult> {
  const { studentUserId, amount, period, transactionId, note, actor } = params;

  if (!studentUserId || !mongoose.Types.ObjectId.isValid(studentUserId)) {
    throw new OfflinePaymentError('A valid studentUserId is required', 400);
  }

  const amountPaise = validateAdminSuppliedAmount(amount);

  const profile = await StudentProfile.findOne({ userId: studentUserId });
  if (!profile) {
    throw new OfflinePaymentError('Student profile not found', 404);
  }

  // Tenant isolation — an academy admin may only record payments for their own
  // students. Super admins are unrestricted.
  if (
    actor.role !== 'gwd_super_admin' &&
    actor.academyId &&
    String(profile.academyId) !== String(actor.academyId)
  ) {
    throw new OfflinePaymentError('Student belongs to another academy', 403);
  }

  const amountRupees = paiseToRupees(amountPaise);
  const normalizedPeriod = ['monthly', 'quarterly', 'yearly'].includes(String(period))
    ? (period as 'monthly' | 'quarterly' | 'yearly')
    : 'monthly';

  /**
   * Off-platform money never touched Razorpay: no gateway fee, no GWD margin,
   * academy received 100%. Recording a notional split here would corrupt the
   * reconciliation report, which compares recorded splits against Razorpay's
   * actual settlements.
   */
  const feeRecord = await FeePayment.create({
    orderId: `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    paymentId: transactionId || undefined,
    amount: amountRupees,
    baseAmount: amountRupees,
    platformFee: 0,
    gatewayFee: 0,
    parentTotalPaise: amountPaise,
    academyAmountPaise: amountPaise,
    gatewayFeePaise: 0,
    gwdNetPaise: 0,
    currency: 'INR',
    status: 'success',
    settledAt: new Date(),
    settlementStrategy: 'offline_direct_to_academy',
    transferStatus: 'not_applicable',
    studentId: profile.userId,
    academyId: profile.academyId || actor.academyId || undefined,
    description: note || 'Offline payment recorded by academy',
    period: normalizedPeriod,
  });

  profile.feePayments.push({
    amount: amountRupees,
    paymentDate: new Date(),
    period: normalizedPeriod,
    status: 'paid',
    transactionId: feeRecord.paymentId || String(feeRecord.orderId),
  } as any);

  profile.totalFeesPaid = (profile.totalFeesPaid || 0) + amountRupees;
  profile.outstandingFees = Math.max(0, (profile.outstandingFees || 0) - amountRupees);
  await profile.save();

  await emitEvent({
    name: 'payment.settled',
    academyId: profile.academyId ?? null,
    payload: {
      studentUserId: String(profile.userId),
      feePaymentId: String(feeRecord._id),
      parentTotalPaise: amountPaise,
      academyAmountPaise: amountPaise,
      gwdNetPaise: 0,
      period: normalizedPeriod,
      source: 'offline_admin_entry',
      recordedBy: String(actor._id),
    },
  });

  return {
    feePaymentId: String(feeRecord._id),
    totalPaid: profile.totalFeesPaid,
    outstanding: profile.outstandingFees,
  };
}
