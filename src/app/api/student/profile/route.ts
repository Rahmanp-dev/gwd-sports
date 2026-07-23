import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import StudentProfile from '@/lib/models/Student';
import { authMiddleware } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    const student = await StudentProfile.findOne({ userId: auth.user._id })
      .populate('userId', 'name email phone')
      .populate('academyId', 'name location fees')
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
    return NextResponse.json({ success: true, data: { student } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
