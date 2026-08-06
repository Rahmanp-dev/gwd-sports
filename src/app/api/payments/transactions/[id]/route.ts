import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import { FeePayment } from '@/lib/models/FeePayment';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const payment = await FeePayment.findById(id).populate('studentId', 'user academyId level');
    if (!payment) return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: payment });
  } catch (error: any) {
    console.error('[api/payments/transactions/[id]]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
