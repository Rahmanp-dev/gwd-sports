import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';
import User from '@/lib/models/User';
import StudentProfile from '@/lib/models/Student';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE TRANSACTION LEDGER
 * ════════════════════════════════════════════════════════════════════════════
 *
 * WHY THERE WAS NO STUDENT NAME. `FeePayment.studentId` is a ref to **User**,
 * but this route populated it selecting `totalFeesPaid outstandingFees level
 * sports` — fields that live on **StudentProfile**, not User. Mongoose ran it
 * happily and returned a User document with essentially nothing on it, so the
 * ledger showed a payment id and an amount with no way to tell whose payment
 * it was. An owner answering "a parent says they paid" had to copy a Razorpay
 * id and go looking somewhere else.
 *
 * Now the User ref is populated with real User fields, and the passport id is
 * fetched separately from StudentProfile — one extra query for the page, not a
 * wrong populate, because those genuinely are two collections.
 *
 * The response carries a flattened `student` object so the client never has to
 * guess which of `studentId` / `student` / `user` is populated on a given row.
 * ════════════════════════════════════════════════════════════════════════════
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limitNum = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    const query: any = {};

    // Tenant isolation. Super admins see the whole platform.
    const isSuperAdmin = auth.user.role === 'gwd_super_admin';
    if (!isSuperAdmin && auth.academyId) {
      query.academyId = new mongoose.Types.ObjectId(String(auth.academyId));
    }

    if (status && status !== 'all') query.status = status;

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    if (search) {
      // Escaped: an owner pasting a receipt id that contains regex characters
      // should search for that text, not compile it as a pattern.
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = { $regex: safe, $options: 'i' };

      /**
       * Searching by the CHILD'S NAME is what an owner actually reaches for —
       * they know "Rehan", not `pay_TIcXMzHtzEi1KE`. Names live on User, so
       * resolve them to ids first and match on those. Capped, because an
       * unbounded $in built from a one-letter query would be enormous.
       *
       * No tenant filter is needed on this lookup: even if it matches a user
       * at another academy, `query.academyId` above still scopes the payments,
       * so nothing leaks.
       */
      const matchingUsers = await User.find({ name: rx })
        .select('_id')
        .limit(500)
        .lean<{ _id: any }[]>();

      query.$or = [
        { paymentId: rx },
        { orderId: rx },
        { receipt: rx },
        { receiptNumber: rx },
        ...(matchingUsers.length
          ? [{ studentId: { $in: matchingUsers.map((u) => u._id) } }]
          : []),
      ];
    }

    const sortOptions: any = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [rows, total] = await Promise.all([
      FeePayment.find(query)
        .populate('studentId', 'name email phone')
        .populate('academyId', 'name slug')
        .sort(sortOptions)
        .skip((page - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      FeePayment.countDocuments(query),
    ]);

    /**
     * Passport ids for the rows on THIS page only — one extra query for ten
     * rows rather than one per row. The passport is what an owner quotes back
     * to a parent, so it belongs beside the payment.
     */
    const studentUserIds = rows
      .map((p: any) => p.studentId?._id ?? p.studentId)
      .filter(Boolean);

    const profiles = studentUserIds.length
      ? await StudentProfile.find({ userId: { $in: studentUserIds } })
          .select('userId passportId')
          .lean<{ userId: any; passportId?: string }[]>()
      : [];

    const passportByUser = new Map(
      profiles.map((p) => [String(p.userId), p.passportId ?? null]),
    );

    const payments = rows.map((p: any) => {
      const user = p.studentId && typeof p.studentId === 'object' ? p.studentId : null;
      const userId = user?._id ?? p.studentId ?? null;

      return {
        ...p,
        // Flattened so the client reads one shape regardless of what populated.
        student: {
          id: userId ? String(userId) : null,
          /**
           * Null, not "Unknown". A payment made through a passport link has no
           * account behind it at all, and an offline entry may predate one —
           * those are legitimately anonymous, and the UI says so in its own
           * words rather than inheriting a placeholder from here.
           */
          name: user?.name ?? null,
          email: user?.email ?? null,
          phone: user?.phone ?? null,
          passportId: userId ? (passportByUser.get(String(userId)) ?? null) : null,
        },
        academy:
          p.academyId && typeof p.academyId === 'object'
            ? { id: String(p.academyId._id), name: p.academyId.name }
            : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: { total, page, pages: Math.ceil(total / limitNum) || 1 },
      },
    });
  } catch (error: any) {
    console.error('[payments/admin/all]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
