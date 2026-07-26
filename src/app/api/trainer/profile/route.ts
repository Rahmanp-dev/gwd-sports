import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import TrainerProfile from '@/lib/models/Trainer';
import { authMiddleware } from '@/lib/middleware/auth';
import { ensureRoleProfile } from '@/lib/auth/ensureRoleProfile';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    /**
     * Self-heal: coaches created through the Users tab before profiles were
     * created alongside the user have no TrainerProfile, which rendered the
     * whole dashboard as "No Trainer Profile Found" with no way forward. Build
     * the missing row on first read rather than making an admin notice and
     * re-create the account. No-ops when the profile already exists.
     */
    if (auth.user.role === 'trainer') {
      await ensureRoleProfile({
        userId: auth.user._id,
        role: 'trainer',
        academyId: auth.academyId ?? null,
      });
    }

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
