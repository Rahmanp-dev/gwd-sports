import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const totalStudents = await StudentProfile.countDocuments({ isActive: true });
    
    const levelStats = await StudentProfile.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);

    const sportStats = await StudentProfile.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$sports' },
      { $group: { _id: '$sports', count: { $sum: 1 } } }
    ]);

    return NextResponse.json({ success: true, data: { totalStudents, levelDistribution: levelStats, sportDistribution: sportStats } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
