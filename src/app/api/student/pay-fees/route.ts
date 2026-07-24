import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { studentUserId, amount, period, transactionId } = await req.json();
    if (!studentUserId || !amount) {
      return NextResponse.json({ success: false, message: 'studentUserId and amount are required' }, { status: 400 });
    }

    const userId = studentUserId;

    const studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    studentProfile.feePayments.push({
      amount,
      paymentDate: new Date(),
      period,
      status: 'paid',
      transactionId
    });

    studentProfile.totalFeesPaid += amount;
    if (studentProfile.outstandingFees >= amount) {
      studentProfile.outstandingFees -= amount;
    } else {
      studentProfile.outstandingFees = 0;
    }

    await studentProfile.save();

    return NextResponse.json({
      success: true,
      message: 'Fee payment recorded successfully',
      data: {
        totalPaid: studentProfile.totalFeesPaid,
        outstanding: studentProfile.outstandingFees
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
