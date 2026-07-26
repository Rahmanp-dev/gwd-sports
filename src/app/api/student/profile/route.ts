import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import StudentProfile from '@/lib/models/Student';
import User from '@/lib/models/User';
import { authMiddleware } from '@/lib/middleware/auth';
import { ensureRoleProfile } from '@/lib/auth/ensureRoleProfile';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();

    /**
     * Self-heal, as on the trainer route. A student with no profile row cannot
     * be charged at all — resolveAmountDue throws "Student profile not found"
     * before it ever reaches the fee schedule.
     */
    if (auth.user.role === 'student') {
      await ensureRoleProfile({
        userId: auth.user._id,
        role: 'student',
        academyId: auth.academyId ?? null,
      });
    }

    const student = await StudentProfile.findOne({ userId: auth.user._id })
      .populate('userId', 'name email phone')
      // `theme` drives the dashboard's colours and typeface — without it a
      // student sees the platform's default palette, not their academy's.
      .populate('academyId', 'name location fees theme')
      .populate('trainers', 'name phone email sports');
    return NextResponse.json({ success: true, data: { studentProfile: student } });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    const data = await req.json();
    data.userId = auth.user._id;
    const student = new StudentProfile(data);
    await student.save();

    if (auth.user.role !== 'student') {
      await User.findByIdAndUpdate(auth.user._id, { role: 'student' });
    }

    return NextResponse.json({ success: true, data: { studentProfile: student } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
