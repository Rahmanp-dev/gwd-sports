import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import TrainerProfile from '@/lib/models/Trainer';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { studentId, trainerId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }

    // OWNERSHIP — mirrors add-student: a plain trainer may only remove their
    // own assignment, not unassign a different trainer from a student.
    if (auth.user.role === 'trainer' && String(trainerId) !== String(auth.user._id)) {
      return NextResponse.json(
        { success: false, message: 'A trainer may only remove their own assignment' },
        { status: 403 }
      );
    }

    const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile) return NextResponse.json({ success: false, message: 'Trainer profile not found' }, { status: 404 });

    const studentFilter: Record<string, unknown> = { userId: studentId };
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      studentFilter.academyId = auth.academyId;
    }

    const studentProfile = await StudentProfile.findOne(studentFilter);
    if (!studentProfile) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    if (studentProfile.trainers) {
      studentProfile.trainers = studentProfile.trainers.filter((t: any) => t.toString() !== trainerId.toString());
      await studentProfile.save();
    }

    if (trainerProfile.students.includes(studentId)) {
      trainerProfile.students = trainerProfile.students.filter((s: any) => s.toString() !== studentId.toString());
      await trainerProfile.save();
    }

    return NextResponse.json({ success: true, message: 'Student removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
