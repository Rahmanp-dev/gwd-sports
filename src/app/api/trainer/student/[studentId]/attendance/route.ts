import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const trainerId = auth.user._id;
    const { studentId } = await params;
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
    }

    // TENANT ISOLATION — had none: any trainer at any academy could read any
    // other academy's student's full attendance history by studentId alone.
    const filter: Record<string, unknown> = { userId: studentId };
    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json({ success: false, message: 'No academy assigned to your account' }, { status: 403 });
      }
      filter.academyId = auth.academyId;
    }

    const student = await StudentProfile.findOne(filter).populate('userId', 'name email');
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    let attendance = student.attendance;
    if (fromDate || toDate) {
      attendance = attendance.filter((record: any) => {
        const recordDate = new Date(record.date);
        if (fromDate && recordDate < new Date(fromDate)) return false;
        if (toDate && recordDate > new Date(toDate)) return false;
        return true;
      });
    }

    attendance = attendance.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalRecords = attendance.length;
    const totalPresent = attendance.filter((record: any) => record.present).length;
    const attendancePercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        student: student.userId,
        attendance,
        stats: { totalRecords, totalPresent, totalAbsent: totalRecords - totalPresent, attendancePercentage }
      }
    });
  } catch (error: any) {
    console.error('[api/trainer/student/[studentId]/attendance]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
