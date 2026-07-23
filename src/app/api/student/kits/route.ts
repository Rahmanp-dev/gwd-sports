import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;

    const studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { kits: studentProfile.kits } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
