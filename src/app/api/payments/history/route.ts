import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = auth.user._id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');

    const payments = await FeePayment.find({ studentId: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limitNum)
      .limit(limitNum);

    const total = await FeePayment.countDocuments({ studentId: userId });

    return NextResponse.json({
      success: true,
      data: { payments, pagination: { total, page, pages: Math.ceil(total / limitNum) } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
