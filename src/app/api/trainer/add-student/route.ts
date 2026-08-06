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

    /**
     * OWNERSHIP + TENANT ISOLATION. This route had neither: any trainer could
     * assign themselves — or any other trainer — to any student anywhere in
     * the system, with no academy check at all. Two consequences: a trainer
     * self-assigning to a foreign academy's student, and (worse) that student
     * then appearing with full PII in the trainer's own /api/trainer/students
     * list, which trusts TrainerProfile.students without its own academy
     * filter. A plain trainer may only assign themselves; only an admin (or
     * super admin) may assign a different trainer.
     */
    if (auth.user.role === 'trainer' && String(trainerId) !== String(auth.user._id)) {
      return NextResponse.json(
        { success: false, message: 'A trainer may only assign themselves to a student' },
        { status: 403 }
      );
    }

    const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile) return NextResponse.json({ success: false, message: 'Trainer profile not found' }, { status: 404 });

    const studentFilter: Record<string, unknown> = { userId: studentId };
    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json({ success: false, message: 'No academy assigned to your account' }, { status: 403 });
      }
      studentFilter.academyId = auth.academyId;
      // The trainer being assigned must also belong to this academy — an
      // admin assigning a trainer from a different academy would otherwise
      // silently create a cross-tenant relationship.
      if (String(trainerProfile.academyId) !== String(auth.academyId)) {
        return NextResponse.json({ success: false, message: 'Trainer belongs to another academy' }, { status: 403 });
      }
    }

    const studentProfile = await StudentProfile.findOne(studentFilter);
    if (!studentProfile) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    if (studentProfile.trainers?.some((t: any) => t.toString() === trainerId.toString())) {
      return NextResponse.json({ success: false, message: 'Student is already assigned' }, { status: 400 });
    }

    if (!studentProfile.trainers) studentProfile.trainers = [];
    studentProfile.trainers.push(trainerId);
    await studentProfile.save();

    if (!trainerProfile.students.includes(studentId)) {
      trainerProfile.students.push(studentId);
      await trainerProfile.save();
    }

    return NextResponse.json({ success: true, message: 'Student assigned successfully' });
  } catch (error: any) {
    console.error('[api/trainer/add-student]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
