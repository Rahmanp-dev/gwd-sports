import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import { MoneyError } from '@/lib/payments/money';
import {
  validateAdminSuppliedAmount,
  NoFeeConfiguredError,
  type FeePeriod,
} from '@/lib/payments/dues';
import { createFeeOrder, NothingDueError } from '@/lib/payments/createOrder';

const ADMIN_ROLES = ['admin', 'gwd_super_admin'];

/**
 * Creates a Razorpay order for a student's fee.
 *
 * The amount is ALWAYS derived server-side (see dues.ts). A `baseAmount` in the
 * request body is ignored for non-admin callers — it used to be trusted, which
 * let a parent open devtools and set their own price.
 *
 * This route now owns only AUTHORISATION — who may be charged, and who may name
 * an ad-hoc amount. The money itself (split, settlement, order, ledger row)
 * lives in lib/payments/createOrder.ts, shared with the public /pay/<passportId>
 * page so the two cannot drift apart on what a parent is charged.
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
    // Admins may enter an ad-hoc amount (kit charge, partial settlement). Anyone
    // else gets the server-derived figure, whatever they put in the body.
    const overrideBaseAmountPaise =
      isAdmin && body.amount !== undefined
        ? validateAdminSuppliedAmount(body.amount)
        : undefined;

    const result = await createFeeOrder({
      studentUserId,
      academyId,
      period,
      description,
      overrideBaseAmountPaise,
    });

    return NextResponse.json({
      success: true,
      data: {
        order: result.order,
        key_id: result.keyId,
        // The breakdown the payment page must disclose to the parent.
        breakdown: result.breakdown,
      },
    });
  } catch (error: any) {
    if (error instanceof NoFeeConfiguredError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    }
    // 400, matching this route's behaviour before the shared path was extracted.
    if (error instanceof NothingDueError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
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
