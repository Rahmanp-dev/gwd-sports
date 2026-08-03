import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * MANUAL FEE LEDGER OVERRIDE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A deliberate escape hatch — an owner reconciling a balance that drifted, or
 * writing off a discount agreed in person. Because it writes money figures
 * directly, with no payment behind them, it should be the most careful handler
 * in this tree. It was the least.
 *
 * 🔴 NO TENANT SCOPING. `findById(studentId)` on an id straight off the URL let
 *    ANY academy admin rewrite the fee ledger of ANY student on the platform —
 *    clearing a competitor's outstanding balances, or inventing arrears against
 *    their families. Now scoped exactly as api/admin/students/[id] is.
 *
 * 🔴 NO VALIDATION. Both figures were assigned straight from the body. A string
 *    sailed into a Number path (mongoose casts "1e5" happily and throws on
 *    "abc", reported as the bare word "Server Error"), and nothing stopped a
 *    negative balance — which then flows into the defaulter list, the dashboard
 *    totals and the reminder cadence as if it were real.
 * ════════════════════════════════════════════════════════════════════════════
 */

type MoneyResult = { ok: true; value: number | null } | { ok: false; error: string };

/** Rupees. Rejects NaN, Infinity, negatives and anything non-numeric. */
function readMoney(value: unknown, field: string): MoneyResult {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: null };
  }
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return { ok: false, error: `${field} must be a number.` };
  if (n < 0) return { ok: false, error: `${field} cannot be negative.` };
  // A ceiling catches a mistyped extra zero before it reaches a parent as a
  // plausible-looking demand.
  if (n > 10_000_000) return { ok: false, error: `${field} looks wrong — that is over ₹1 crore.` };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid student id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const outstanding = readMoney(body.outstandingFees, 'Outstanding fees');
    if (!outstanding.ok) {
      return NextResponse.json(
        { success: false, message: outstanding.error, field: 'outstandingFees' },
        { status: 400 },
      );
    }
    const paid = readMoney(body.totalFeesPaid, 'Total fees paid');
    if (!paid.ok) {
      return NextResponse.json(
        { success: false, message: paid.error, field: 'totalFeesPaid' },
        { status: 400 },
      );
    }
    if (outstanding.value === null && paid.value === null) {
      return NextResponse.json(
        { success: false, message: 'Send outstandingFees, totalFeesPaid, or both.' },
        { status: 400 },
      );
    }

    // Tenant isolation, matching api/admin/students/[id].
    const filter: Record<string, unknown> = { _id: studentId };
    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'No academy assigned to your account' },
          { status: 403 },
        );
      }
      filter.academyId = auth.academyId;
    }

    const student = await StudentProfile.findOne(filter);
    if (!student) {
      // Indistinguishable from "no such student", so this cannot be used to
      // discover which ids belong to other academies.
      return NextResponse.json(
        { success: false, message: 'Student profile not found' },
        { status: 404 },
      );
    }

    const before = {
      outstandingFees: student.outstandingFees,
      totalFeesPaid: student.totalFeesPaid,
    };

    if (outstanding.value !== null) student.outstandingFees = outstanding.value;
    if (paid.value !== null) student.totalFeesPaid = paid.value;
    await student.save();

    // Money moved by hand with no transaction behind it. Logged so there is a
    // trail of who changed a balance and from what.
    console.info('[payments/override]', {
      by: String(auth.user._id),
      student: String(student._id),
      before,
      after: {
        outstandingFees: student.outstandingFees,
        totalFeesPaid: student.totalFeesPaid,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Fee balance updated.',
      data: student,
    });
  } catch (error: any) {
    console.error('[payments/admin/override]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
