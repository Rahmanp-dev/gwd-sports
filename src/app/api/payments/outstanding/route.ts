import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;
    const studentProfile = await StudentProfile.findOne({ userId });
    
    if (!studentProfile) return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });

    const now = new Date();
    let isDue = false;
    const amountToPay = 500; 

    if (studentProfile.feePayments.length > 0) {
      const lastPayment = studentProfile.feePayments[studentProfile.feePayments.length - 1];
      const lastPaymentDate = new Date(lastPayment.paymentDate);
      if (lastPaymentDate.getMonth() !== now.getMonth() || lastPaymentDate.getFullYear() !== now.getFullYear()) {
        isDue = true;
      }
    } else {
      isDue = true;
    }

    if (isDue && studentProfile.outstandingFees === 0) {
      studentProfile.outstandingFees = amountToPay;
      await studentProfile.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        outstandingFees: studentProfile.outstandingFees,
        totalFeesPaid: studentProfile.totalFeesPaid,
        isDue,
        nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        lastPayment: studentProfile.feePayments[studentProfile.feePayments.length - 1] || null
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
