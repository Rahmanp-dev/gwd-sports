import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import Academy from '@/lib/models/Academy';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { academyId } = await req.json();
    const userId = auth.user._id;

    if (!mongoose.Types.ObjectId.isValid(academyId)) {
      return NextResponse.json({ success: false, message: 'Invalid academy ID' }, { status: 400 });
    }

    const academy = await Academy.findById(academyId);
    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    if (academy.students.length >= academy.capacity) {
      return NextResponse.json({ success: false, message: 'Academy is at full capacity' }, { status: 400 });
    }

    let studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      studentProfile = new StudentProfile({ userId });
    }

    if (studentProfile.academyId?.toString() === academyId) {
      return NextResponse.json({ success: false, message: 'Already enrolled in this academy' }, { status: 400 });
    }

    studentProfile.academyId = academyId;
    studentProfile.enrollmentDate = new Date();
    await studentProfile.save();

    if (!academy.students.includes(userId)) {
      academy.students.push(userId);
      await academy.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined academy',
      data: { academy: { _id: academy._id, name: academy.name } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
