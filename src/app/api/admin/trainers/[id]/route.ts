import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import mongoose from 'mongoose';
import TrainerProfile from '@/lib/models/Trainer';
import StudentProfile from '@/lib/models/Student';
import Academy from '@/lib/models/Academy';
import User from '@/lib/models/User';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * TWO DEFECTS THIS FILE HAD
 * ════════════════════════════════════════════════════════════════════════════
 *
 * 🔴 GET LOOKED UP A DIFFERENT IDENTIFIER FROM PUT AND DELETE. It ran
 *    `findOne({ userId: id })` while its siblings ran `findById(id)`. The
 *    trainers list is an aggregation over TrainerProfile, so the `_id` the
 *    table hands back — and passes to all three — is the PROFILE id. GET was
 *    therefore matching a profile id against a userId field and returning 404
 *    every single time: "view trainer details" has never worked.
 *
 * 🔴 NONE OF THE THREE WERE TENANT-SCOPED. Any academy admin could read, edit
 *    or deactivate any trainer on the platform by id.
 *
 * `resolveTrainer` fixes both in one place. It accepts either identifier —
 * profile id first, then userId — so any caller still passing a userId keeps
 * working, and it applies the academy filter that all three were missing.
 * ════════════════════════════════════════════════════════════════════════════
 */
async function resolveTrainer(id: string, auth: any) {
  const scope: Record<string, unknown> = {};
  if (auth.user.role !== 'gwd_super_admin') {
    if (!auth.academyId) return { error: 'no-academy' as const };
    scope.academyId = auth.academyId;
  }

  // Profile id is what the admin table actually passes; userId is accepted as
  // a fallback so an older caller is not broken by tightening this.
  return {
    trainer:
      (await TrainerProfile.findOne({ _id: id, ...scope })) ??
      (await TrainerProfile.findOne({ userId: id, ...scope })),
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid trainer ID' }, { status: 400 });
    }

    const resolved = await resolveTrainer(id, auth);
    if ('error' in resolved) {
      return NextResponse.json(
        { success: false, message: 'No academy assigned to your account' },
        { status: 403 },
      );
    }
    if (!resolved.trainer) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    const trainer = await TrainerProfile.findById(resolved.trainer._id)
      .populate('userId', 'name email phone')
      .populate('academyId', 'name location')
      .populate('students', 'name email phone');

    return NextResponse.json({ success: true, data: { trainer } });
  } catch (error: any) {
    console.error('[admin/trainers GET]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { id } = await params;
    const updates = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid trainer ID' }, { status: 400 });
    }

    delete updates.userId;
    delete updates.students;
    delete updates.rating;
    // Moving a trainer between academies is a transfer, not a field edit.
    delete updates.academyId;

    const resolved = await resolveTrainer(id, auth);
    if ('error' in resolved) {
      return NextResponse.json(
        { success: false, message: 'No academy assigned to your account' },
        { status: 403 },
      );
    }
    if (!resolved.trainer || !resolved.trainer.isActive) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    const trainer = await TrainerProfile.findByIdAndUpdate(
      resolved.trainer._id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    return NextResponse.json({ success: true, message: 'Trainer updated successfully', data: { trainer } });
  } catch (error: any) {
    console.error('[admin/trainers PUT]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid trainer ID' }, { status: 400 });
    }

    const resolved = await resolveTrainer(id, auth);
    if ('error' in resolved) {
      return NextResponse.json(
        { success: false, message: 'No academy assigned to your account' },
        { status: 403 },
      );
    }
    const trainer = resolved.trainer;
    if (!trainer || !trainer.isActive) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    trainer.isActive = false;
    await trainer.save();

    await StudentProfile.updateMany(
      { trainers: trainer.userId },
      { $pull: { trainers: trainer.userId } }
    );

    if (trainer.academyId) {
      await Academy.findByIdAndUpdate(
        trainer.academyId,
        { $pull: { trainers: trainer.userId } }
      );
    }

    return NextResponse.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (error: any) {
    console.error('[admin/trainers DELETE]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
