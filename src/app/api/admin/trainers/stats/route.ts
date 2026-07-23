import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import TrainerProfile from '@/lib/models/Trainer';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const stats = await TrainerProfile.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalTrainers: { $sum: 1 },
          averageRating: { $avg: '$rating.average' },
          totalStudents: { $sum: { $size: { $ifNull: ['$students', []] } } },
          averageStudentsPerTrainer: { $avg: { $size: { $ifNull: ['$students', []] } } }
        }
      }
    ]);

    const sportStats = await TrainerProfile.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$sports' },
      {
        $group: {
          _id: '$sports',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const academyStats = await TrainerProfile.aggregate([
      { $match: { isActive: true, academyId: { $ne: null } } },
      {
        $group: {
          _id: '$academyId',
          trainerCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'academies',
          localField: '_id',
          foreignField: '_id',
          as: 'academy'
        }
      },
      { $unwind: '$academy' },
      {
        $project: {
          academyName: '$academy.name',
          trainerCount: 1
        }
      },
      { $sort: { trainerCount: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalTrainers: 0,
          averageRating: 0,
          totalStudents: 0,
          averageStudentsPerTrainer: 0
        },
        sportDistribution: sportStats,
        academyDistribution: academyStats
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
