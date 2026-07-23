import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
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

    academy.trainers = academy.trainers.filter((tid: any) => tid.toString() !== trainerId);
    await academy.save();

    await TrainerProfile.findOneAndUpdate({ userId: trainerId }, { $unset: { academyId: 1 } });

    return NextResponse.json({ success: true, message: 'Trainer removed from academy successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
