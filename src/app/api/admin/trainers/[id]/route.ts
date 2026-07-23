import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import mongoose from 'mongoose';
import TrainerProfile from '@/lib/models/Trainer';
import StudentProfile from '@/lib/models/Student';
import Academy from '@/lib/models/Academy';
import User from '@/lib/models/User';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid trainer ID' }, { status: 400 });
    }

    const trainer = await TrainerProfile.findOne({ userId: id })
      .populate('userId', 'name email phone')
      .populate('academyId', 'name location')
      .populate('students', 'name email phone');

    if (!trainer) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { trainer } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
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

    const trainer = await TrainerProfile.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!trainer || !trainer.isActive) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Trainer updated successfully', data: { trainer } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
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

    const trainer = await TrainerProfile.findById(id);
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
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
