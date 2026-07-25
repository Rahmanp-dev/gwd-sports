import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';
import { Academy } from '@/lib/models/Academy';
import User from '@/lib/models/User';
import StudentProfile from '@/lib/models/Student';
import { paiseToRupees, formatInr } from '@/lib/payments/money';
import { issueReceiptNumber } from '@/lib/payments/issueReceipt';

/**
 * A payment receipt a parent can download, print or attach to a reimbursement
 * claim.
 *
 * ═══ THIS IS A RECEIPT, NOT A GST TAX INVOICE ═══════════════════════════════
 *
 * The distinction is deliberate and is flagged rather than papered over. A
 * single payment here is really TWO supplies: the academy supplies coaching to
 * the parent (`academyAmountPaise`), and GWD supplies a payment convenience
 * service (`gwdNetPaise`). A GST tax invoice has to be issued by each supplier
 * for their own portion, carrying their own GSTIN, HSN/SAC code and tax
 * breakdown.
 *
 * Issuing one combined document under the academy's name for the full amount
 * would misstate who supplied what, and neither party holds the other's tax
 * registration in this system to do it properly. So this document itemises both
 * components honestly and calls itself a receipt. Producing a compliant tax
 * invoice needs a finance decision about registration and who invoices whom —
 * see the pricing note in lib/payments/pricing.test.ts, which is blocked on the
 * same conversation.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * ACCESS: the student who paid, or an admin of the academy that received it.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { paymentId } = await params;
    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return NextResponse.json(
        { success: false, message: 'A valid payment id is required' },
        { status: 400 }
      );
    }

    const payment = await FeePayment.findById(paymentId);
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    // A receipt exists only for money actually taken.
    if (payment.status !== 'success' || !payment.settledAt) {
      return NextResponse.json(
        { success: false, message: 'This payment has not completed, so there is no receipt.' },
        { status: 409 }
      );
    }

    const isAdmin = ['admin', 'gwd_super_admin'].includes(auth.user.role);
    const isPayer = String(payment.studentId ?? '') === String(auth.user._id);
    const sameAcademy =
      auth.user.role === 'gwd_super_admin' ||
      (auth.academyId && String(payment.academyId ?? '') === String(auth.academyId));

    if (!isPayer && !(isAdmin && sameAcademy)) {
      // Indistinguishable from "does not exist", so a receipt id cannot be used
      // to confirm that some other family made a payment.
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    // Lazy allocation: if numbering failed at settlement, close the gap now
    // rather than showing the parent a receipt with no number on it.
    const receiptNumber =
      payment.receiptNumber ?? (await issueReceiptNumber(String(payment._id)));

    const [academy, student, profile] = await Promise.all([
      payment.academyId
        ? Academy.findById(payment.academyId).select('name address location contactInfo').lean()
        : null,
      payment.studentId ? User.findById(payment.studentId).select('name email').lean() : null,
      payment.studentId
        ? StudentProfile.findOne({ userId: payment.studentId })
            .select('passportId parentName')
            .lean()
        : null,
    ]);

    /**
     * Prefer the exact paise fields. The legacy rupee columns are floats and
     * derived — a receipt is the last place to do arithmetic on them.
     */
    const academyPaise = payment.academyAmountPaise ?? Math.round((payment.baseAmount ?? 0) * 100);
    const totalPaise = payment.parentTotalPaise ?? Math.round((payment.amount ?? 0) * 100);
    const conveniencePaise = Math.max(totalPaise - academyPaise, 0);

    return NextResponse.json({
      success: true,
      data: {
        documentType: 'receipt',
        receiptNumber,
        issuedAt: payment.receiptIssuedAt ?? payment.settledAt,
        paidAt: payment.settledAt,

        payer: {
          name: (student as any)?.name ?? 'Student',
          email: (student as any)?.email ?? null,
          parentName: (profile as any)?.parentName ?? null,
          passportId: (profile as any)?.passportId ?? null,
        },

        academy: {
          name: (academy as any)?.name ?? 'Academy',
          address: (academy as any)?.address ?? null,
          location: (academy as any)?.location ?? null,
          phone: (academy as any)?.contactInfo?.phone ?? null,
          email: (academy as any)?.contactInfo?.email ?? null,
        },

        // Both components named, because they are two different supplies by two
        // different parties. See the header.
        lines: [
          {
            label: payment.description || 'Academy fees',
            sublabel: payment.period ? `${payment.period} fee` : null,
            suppliedBy: (academy as any)?.name ?? 'Academy',
            amount: paiseToRupees(academyPaise),
            amountFormatted: formatInr(academyPaise),
          },
          ...(conveniencePaise > 0
            ? [
                {
                  label: 'Convenience fee',
                  sublabel: 'Online payment processing',
                  suppliedBy: 'GWD Sports',
                  amount: paiseToRupees(conveniencePaise),
                  amountFormatted: formatInr(conveniencePaise),
                },
              ]
            : []),
        ],

        total: paiseToRupees(totalPaise),
        totalFormatted: formatInr(totalPaise),
        currency: payment.currency ?? 'INR',

        payment: {
          method: 'Online (Razorpay)',
          reference: payment.paymentId ?? payment.orderId,
          status: payment.status,
        },

        refunded:
          (payment.refundedTotalPaise ?? 0) > 0
            ? {
                amount: paiseToRupees(payment.refundedTotalPaise ?? 0),
                amountFormatted: formatInr(payment.refundedTotalPaise ?? 0),
              }
            : null,
      },
    });
  } catch (error: any) {
    console.error('[payments/receipt]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
