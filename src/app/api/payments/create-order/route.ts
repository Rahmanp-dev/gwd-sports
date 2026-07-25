import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Razorpay from 'razorpay';
import { FeePayment } from '@/lib/models/FeePayment';
import { Academy } from '@/lib/models/Academy';
import StudentProfile from '@/lib/models/Student';
import {
  computeFeeSplit,
  configuredSplitConfig,
  percentToBps,
  paiseToRupees,
  formatInr,
  MoneyError,
} from '@/lib/payments/money';
import {
  resolveAmountDue,
  validateAdminSuppliedAmount,
  NoFeeConfiguredError,
  type FeePeriod,
} from '@/lib/payments/dues';
import { resolveSettlementStrategy } from '@/lib/payments/settlement';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const ADMIN_ROLES = ['admin', 'gwd_super_admin'];

/**
 * Creates a Razorpay order for a student's fee.
 *
 * The amount is ALWAYS derived server-side (see dues.ts). A `baseAmount` in the
 * request body is ignored for non-admin callers — it used to be trusted, which
 * let a parent open devtools and set their own price.
 *
 * Body:
 *   period?        'monthly' | 'quarterly' | 'halfYearly' | 'yearly'
 *   studentUserId? admin only — collect on behalf of a specific student
 *   amount?        admin only — an explicit ad-hoc amount in rupees
 *   description?   free text shown on the receipt
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();
    const body = await req.json().catch(() => ({}));

    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    const period: FeePeriod = body.period ?? 'monthly';
    const description: string | undefined = body.description;

    // ---- Who is being charged ------------------------------------------------
    // Non-admins can only ever create an order for themselves.
    let studentUserId = auth.user._id;
    if (isAdmin && body.studentUserId) {
      const target = await StudentProfile.findOne({ userId: body.studentUserId }).select(
        'userId academyId'
      );
      if (!target) {
        return NextResponse.json(
          { success: false, message: 'Student profile not found' },
          { status: 404 }
        );
      }
      // Tenant isolation: a non-super admin cannot collect for another academy.
      if (
        auth.user.role !== 'gwd_super_admin' &&
        auth.academyId &&
        String(target.academyId) !== String(auth.academyId)
      ) {
        return NextResponse.json(
          { success: false, message: 'Student belongs to another academy' },
          { status: 403 }
        );
      }
      studentUserId = target.userId;
    }

    const profile = await StudentProfile.findOne({ userId: studentUserId }).select('academyId');
    const academyId = profile?.academyId ?? auth.academyId ?? null;

    // ---- How much -----------------------------------------------------------
    let baseAmountPaise: number;
    let amountSource: string;

    if (isAdmin && body.amount !== undefined) {
      // Admins may enter an ad-hoc amount (kit charge, partial settlement).
      baseAmountPaise = validateAdminSuppliedAmount(body.amount);
      amountSource = 'admin_supplied';
    } else {
      const due = await resolveAmountDue({ studentUserId, academyId, period });
      baseAmountPaise = due.baseAmountPaise;
      amountSource = due.source;
    }

    if (baseAmountPaise <= 0) {
      return NextResponse.json(
        { success: false, message: 'Nothing is currently due for this student' },
        { status: 400 }
      );
    }

    // ---- Split --------------------------------------------------------------
    const academy = academyId ? await Academy.findById(academyId) : null;
    const marginRateBps =
      academy && typeof academy.platformFeePercent === 'number'
        ? percentToBps(academy.platformFeePercent)
        : undefined;

    const split = computeFeeSplit(baseAmountPaise, configuredSplitConfig(marginRateBps));

    // ---- Settlement ---------------------------------------------------------
    const strategy = resolveSettlementStrategy(academy);
    const settlementInstruction = strategy.buildOrderInstruction({
      split,
      academyRzpAccount: academy?.rzp_account,
      currency: 'INR',
    });

    const receipt = `rcpt_${Date.now()}_${String(studentUserId).slice(-5)}`;

    const orderOptions: Record<string, any> = {
      // Razorpay takes paise. The split is already integer paise, so there is no
      // float multiplication anywhere in this path.
      amount: split.parentTotalPaise,
      currency: 'INR',
      receipt,
      notes: {
        studentUserId: String(studentUserId),
        academyId: academyId ? String(academyId) : '',
        description: description || 'Academy Fees',
        period,
        amountSource,
        academyAmountPaise: String(split.academyAmountPaise),
        gatewayFeePaise: String(split.gatewayFeePaise),
        gwdNetPaise: String(split.gwdNetPaise),
        settlementStrategy: strategy.name,
      },
      ...settlementInstruction.orderFields,
    };

    const order = await razorpay.orders.create(orderOptions as any);

    await FeePayment.create({
      orderId: order.id,
      // Legacy rupee fields, derived — kept so existing dashboards keep working.
      amount: paiseToRupees(split.parentTotalPaise),
      baseAmount: paiseToRupees(split.academyAmountPaise),
      platformFee: paiseToRupees(split.gwdNetPaise),
      gatewayFee: paiseToRupees(split.gatewayFeePaise),
      // Exact paise — the source of truth for reconciliation.
      parentTotalPaise: split.parentTotalPaise,
      academyAmountPaise: split.academyAmountPaise,
      gatewayFeePaise: split.gatewayFeePaise,
      gwdNetPaise: split.gwdNetPaise,
      currency: 'INR',
      status: 'pending',
      receipt,
      studentId: studentUserId,
      academyId: academyId || undefined,
      settlementStrategy: strategy.name,
      transferStatus: settlementInstruction.transferStatus,
      description,
      period,
    });

    return NextResponse.json({
      success: true,
      data: {
        order,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        // The breakdown the payment page must disclose to the parent.
        breakdown: {
          academyFee: paiseToRupees(split.academyAmountPaise),
          convenienceFee: paiseToRupees(split.convenienceFeePaise),
          total: paiseToRupees(split.parentTotalPaise),
          totalFormatted: formatInr(split.parentTotalPaise),
          period,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof NoFeeConfiguredError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    }
    if (error instanceof MoneyError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('[create-order]', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
