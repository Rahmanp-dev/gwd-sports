import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
import User from '@/lib/models/User';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { academyId, studentId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid academy or student ID' }, { status: 400 });
    }

    const academy = await Academy.findById(academyId);
    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    if (academy.students.length >= academy.capacity) {
      return NextResponse.json({ success: false, message: 'Academy is at full capacity' }, { status: 400 });
    }

    const user = await User.findById(studentId);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    if (academy.students.includes(studentId)) {
      return NextResponse.json({ success: false, message: 'Student is already in this academy' }, { status: 400 });
    }

    let studentProfile = await StudentProfile.findOne({ userId: studentId });
    if (!studentProfile) {
      studentProfile = new StudentProfile({
        userId: studentId,
        academyId: academyId,
        enrollmentDate: new Date()
      });
    } else {
      studentProfile.academyId = academyId;
      if (!studentProfile.enrollmentDate) {
        studentProfile.enrollmentDate = new Date();
      }
    }
    await studentProfile.save();

    academy.students.push(studentId);
    await academy.save();

    return NextResponse.json({
      success: true,
      message: 'Student added to academy successfully',
      data: { student: user, academy: { _id: academy._id, name: academy.name } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
