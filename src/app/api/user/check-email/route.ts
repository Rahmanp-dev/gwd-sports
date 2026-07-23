import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import Student from '@/lib/models/Student';
import Trainer from '@/lib/models/Trainer';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ success: true, message: 'User not found' });

    if (user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: user._id });
      if (!studentProfile) return NextResponse.json({ success: true, message: 'Student profile not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'User has a student profile', data: { user } });
    } else if (user.role === 'trainer') {
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
