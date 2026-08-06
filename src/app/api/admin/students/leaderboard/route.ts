import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const leaderboard = await StudentProfile.aggregate([
      { $match: { isActive: true } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $addFields: { 
          averageScore: { $avg: '$performance.score' },
          totalAssessments: { $size: { $ifNull: ['$performance', []] } } 
      } },
      { $match: { totalAssessments: { $gt: 0 } } },
      { $sort: { averageScore: -1 } },
      { $limit: 10 },
      { $project: { _id: 1, studentName: '$user.name', email: '$user.email', level: 1, averageScore: 1, totalAssessments: 1 } }
    ]);

    return NextResponse.json({ success: true, data: { leaderboard } });
  } catch (error: any) {
    console.error('[api/admin/students/leaderboard]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
