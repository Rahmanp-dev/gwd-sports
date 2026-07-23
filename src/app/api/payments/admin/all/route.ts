import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }
    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
        { receipt: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions: any = { [sortBy]: order === 'asc' ? 1 : -1 };

    const payments = await FeePayment.find(query)
      .populate({ path: 'studentId', select: 'totalFeesPaid outstandingFees level sports' })
      .sort(sortOptions)
      .skip((page - 1) * limitNum)
      .limit(limitNum);

    const total = await FeePayment.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: { payments, pagination: { total, page, pages: Math.ceil(total / limitNum) } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
