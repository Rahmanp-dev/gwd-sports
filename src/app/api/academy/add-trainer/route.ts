import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
import User from '@/lib/models/User';
import TrainerProfile from '@/lib/models/Trainer';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { academyId, trainerId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
      return NextResponse.json({ success: false, message: 'Invalid academy or trainer ID' }, { status: 400 });
    }

    const academy = await Academy.findById(academyId);
    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    const user = await User.findById(trainerId);
    if (!user || user.role !== 'trainer') {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    if (academy.trainers.includes(trainerId)) {
      return NextResponse.json({ success: false, message: 'Trainer is already in this academy' }, { status: 400 });
    }

    let trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile) {
      trainerProfile = new TrainerProfile({
        userId: trainerId,
        academyId: academyId,
        joinedDate: new Date(),
        sports: user.sports || []
      });
    } else {
      trainerProfile.academyId = academyId;
      if (!trainerProfile.joinedDate) {
        trainerProfile.joinedDate = new Date();
      }
    }
    await trainerProfile.save();

    academy.trainers.push(trainerId);
    await academy.save();

    return NextResponse.json({
      success: true,
      message: 'Trainer added to academy successfully',
      data: { trainer: user, academy: { _id: academy._id, name: academy.name } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
