import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import TrainerProfile from '@/lib/models/Trainer';
import { authMiddleware } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    const trainer = await TrainerProfile.findOne({ userId: auth.user._id })
      .populate('userId', 'name email phone')
      // `theme` drives the dashboard's colours and typeface — without it a
      // coach sees the platform's default palette instead of their academy's.
      .populate('academyId', 'name location theme')
      .populate('students', 'name email phone');
    return NextResponse.json({ success: true, data: { trainer } });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
