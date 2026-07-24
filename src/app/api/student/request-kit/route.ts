import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = auth.user._id;
    const { kitName } = await req.json();

    const studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    const existingKit = studentProfile.kits.find((kit: any) => 
      kit.kitName.toLowerCase() === kitName.toLowerCase() && 
      kit.status !== 'delivered'
    );

    if (existingKit) {
      return NextResponse.json({ success: false, message: 'Kit already requested or being processed' }, { status: 400 });
    }

    studentProfile.kits.push({
      kitName,
      status: 'requested',
      requestedAt: new Date()
    });

    await studentProfile.save();

    return NextResponse.json({ success: true, message: 'Kit requested successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
