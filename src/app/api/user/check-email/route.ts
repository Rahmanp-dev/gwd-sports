import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import Student from '@/lib/models/Student';
import Trainer from '@/lib/models/Trainer';
import { isPlaceholderAccount, PLACEHOLDER_SIGNUP_MESSAGE } from '@/lib/auth/placeholder';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ success: true, message: 'User not found' });

    /**
     * An imported student's address is derived from their public passport id.
     * Without this, anyone holding a passport id could confirm it maps to a
     * real student AND receive that student's user record below. Answered as a
     * registration prompt: the person is most likely a parent holding their own
     * child's details, and should be told what to do rather than stonewalled.
     */
    if (isPlaceholderAccount(user)) {
      return NextResponse.json({ success: true, message: PLACEHOLDER_SIGNUP_MESSAGE });
    }

    if (user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: user._id });
      if (!studentProfile) return NextResponse.json({ success: true, message: 'Student profile not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'User has a student profile', data: { user } });
    }

    const studentProfile = await Student.findOne({ userId: user._id });
    if (studentProfile) {
      return NextResponse.json({ success: true, message: 'User has a student profile', data: { user } });
    }

    if (user.role === 'trainer') {
      const trainerProfile = await Trainer.findOne({ userId: user._id });
      if (!trainerProfile) return NextResponse.json({ success: true, message: 'Trainer profile not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'User has a trainer profile', data: { user } });
    } else if (user.role === 'admin') {
      return NextResponse.json({ success: false, message: 'Invalid user role for this operation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User has no other profile', data: { user } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
