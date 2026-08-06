import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = auth.user._id;
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport');
    const category = searchParams.get('category');

    const studentProfile = await StudentProfile.findOne({ userId })
      .populate({ path: 'performance.evaluatedBy', model: User, select: 'name' });

    if (!studentProfile) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    let performance = studentProfile.performance;

    if (sport) {
      performance = performance.filter((record: any) => 
        record.sport.toLowerCase() === sport.toLowerCase()
      );
    }

    if (category) {
      performance = performance.filter((record: any) => 
        record.category.toLowerCase() === category.toLowerCase()
      );
    }

    performance = performance.sort((a: any, b: any) => 
      new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
    );

    return NextResponse.json({ success: true, data: { performance } });
  } catch (error: any) {
    console.error('[api/student/performance]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
