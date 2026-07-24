import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import TrainerProfile from '@/lib/models/Trainer';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid trainer ID' }, { status: 400 });
    }

    const trainer = await TrainerProfile.findOne({ userId: id });
    if (!trainer) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    if (auth.user.role !== 'gwd_super_admin' && auth.academyId && trainer.academyId?.toString() !== auth.academyId) {
      return NextResponse.json({ success: false, message: 'Unauthorized to modify this trainer' }, { status: 403 });
    }

    trainer.isActive = !trainer.isActive;
    await trainer.save();

    await User.findByIdAndUpdate(id, { isActive: trainer.isActive });

    return NextResponse.json({
      success: true,
      message: `Trainer ${trainer.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { trainer },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
