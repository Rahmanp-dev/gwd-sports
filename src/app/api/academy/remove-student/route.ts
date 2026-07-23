import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
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

    academy.students = academy.students.filter((sid: any) => sid.toString() !== studentId);
    await academy.save();

    await StudentProfile.findOneAndUpdate({ userId: studentId }, { $unset: { academyId: 1 } });

    return NextResponse.json({ success: true, message: 'Student removed from academy successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
