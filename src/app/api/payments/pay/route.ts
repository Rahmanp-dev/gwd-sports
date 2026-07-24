import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware, adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import { FeePayment } from '@/lib/models/FeePayment';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
       return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const userId = auth.user._id;
    const { amount, transactionId } = await req.json();
    const studentProfile = await StudentProfile.findOne({ userId });

    if (!studentProfile) return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });

    const feeRecord = new FeePayment({
      orderId: `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      paymentId: transactionId || `PAY-${Date.now()}`,
      amount,
      baseAmount: amount,
      currency: 'INR',
      status: 'success',
      studentId: auth.user._id,
      academyId: studentProfile.academyId || auth.academyId || undefined
    });
    await feeRecord.save();

    studentProfile.feePayments.push({
      amount,
      paymentDate: new Date(),
      period: 'monthly',
      status: 'paid',
      transactionId: feeRecord.paymentId,
    });

    studentProfile.outstandingFees = Math.max(0, studentProfile.outstandingFees - amount);
    studentProfile.totalFeesPaid += amount;

    await studentProfile.save();

    return NextResponse.json({ success: true, message: 'Payment processed successfully', data: feeRecord });
  } catch (error: any) {
    console.error('[API_PAYMENTS_PAY]', error);
    return NextResponse.json({ success: false, message: error?.message || 'Payment processing failed' }, { status: 500 });
  }
}
