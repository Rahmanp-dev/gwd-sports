import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const trainerId = (req as any).user._id;
    const { studentId, date, present, remarks } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
    }

    const student = await StudentProfile.findOne({ userId: studentId });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const attendanceDate = new Date(date);
    const existingAttendance = student.attendance.find((record: any) => 
      record.date.toDateString() === attendanceDate.toDateString()
    );

    if (existingAttendance) {
      existingAttendance.present = present;
      existingAttendance.markedBy = trainerId;
      if (remarks) existingAttendance.remarks = remarks;
    } else {
      student.attendance.push({
        date: attendanceDate,
        present,
        markedBy: trainerId,
        remarks
      });
    }

    await student.save();
    return NextResponse.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
