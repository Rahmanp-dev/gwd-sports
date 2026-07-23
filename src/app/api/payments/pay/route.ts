import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import { FeePayment } from '@/lib/models/FeePayment';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) {
       await session.abortTransaction();
       session.endSession();
       return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const userId = (req as any).user._id;
    const { amount, transactionId } = await req.json();
    const studentProfile = await StudentProfile.findOne({ userId }).session(session);

    if (!studentProfile) throw new Error('Profile not found');

    const feeRecord = new FeePayment({
      orderId: `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      paymentId: transactionId || `PAY-${Date.now()}`,
      amount,
      currency: 'INR',
      status: 'success',
      studentId: studentProfile._id,
    });
    await feeRecord.save({ session });

    studentProfile.feePayments.push({
      amount,
      paymentDate: new Date(),
      period: 'monthly',
      status: 'paid',
      transactionId: feeRecord.paymentId,
    });

    studentProfile.outstandingFees = Math.max(0, studentProfile.outstandingFees - amount);
    studentProfile.totalFeesPaid += amount;

    await studentProfile.save({ session });
    await session.commitTransaction();

    return NextResponse.json({ success: true, message: 'Payment processed successfully', data: feeRecord });
  } catch (error: any) {
    await session.abortTransaction();
    return NextResponse.json({ success: false, message: 'Payment processing failed' }, { status: 500 });
  } finally {
    session.endSession();
  }
}
