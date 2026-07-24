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

    const trainerId = auth.user._id;
    const { studentId, sport, score, maxScore, remarks, category } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
    }

    const student = await StudentProfile.findOne({ userId: studentId });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    student.performance.push({
      sport,
      score,
      maxScore,
      remarks,
      category,
      evaluatedBy: trainerId,
      evaluatedAt: new Date()
    });

    await student.save();
    return NextResponse.json({ success: true, message: 'Performance record added successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
