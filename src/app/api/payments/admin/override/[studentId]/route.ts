import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { outstandingFees, totalFeesPaid } = await req.json();

    const student = await StudentProfile.findById(studentId);
    if (!student) return NextResponse.json({ success: false, message: 'Student Profile not found' }, { status: 404 });

    if (outstandingFees !== undefined) student.outstandingFees = outstandingFees;
    if (totalFeesPaid !== undefined) student.totalFeesPaid = totalFeesPaid;

    await student.save();

    return NextResponse.json({ success: true, message: 'Student fees overridden successfully', data: student });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
