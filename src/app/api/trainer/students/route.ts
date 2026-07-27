import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import TrainerProfile from '@/lib/models/Trainer';
import StudentProfile from '@/lib/models/Student';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const requestedTrainerId = searchParams.get('trainerId');
    const trainerId = auth.user.role === 'admin'
      ? (requestedTrainerId || auth.user._id.toString())
      : auth.user._id.toString();

    if (auth.user.role === 'trainer' && requestedTrainerId && requestedTrainerId !== auth.user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Unauthorized to view another trainer\'s students' }, { status: 403 });
    }
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const skip = (page - 1) * limitNum;

    const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile) {
      return NextResponse.json({ success: false, message: 'Trainer profile not found' }, { status: 404 });
    }

    const studentUserIds = (trainerProfile.students || []).map((id: any) => {
      try {
        return new mongoose.Types.ObjectId(id._id ? id._id.toString() : id.toString());
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    if (studentUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          students: [],
          pagination: { currentPage: page, totalPages: 0, totalStudents: 0, hasNextPage: false, hasPrevPage: false }
        }
      });
    }

    const matchStage: any = { _id: { $in: studentUserIds } };
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const aggregatePipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      {
        $unwind: { path: '$profile', preserveNullAndEmptyArrays: true }
      }
    ];

    /**
     * DEFENSE IN DEPTH. This list trusts TrainerProfile.students, which is
     * meant to only ever contain same-academy students — add-student now
     * enforces that at write time. This is a second, independent check at
     * read time so a bad row (from before that fix, or any future bug that
     * writes to TrainerProfile.students) cannot leak a foreign academy's
     * student PII into this response.
     */
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      const academyObjectId = new mongoose.Types.ObjectId(String(auth.academyId));
      aggregatePipeline.push({ $match: { 'profile.academyId': academyObjectId } });
    }

    if (level) {
      aggregatePipeline.push({ $match: { 'profile.level': level } });
    }

    aggregatePipeline.push({
      $project: {
        _id: { $ifNull: ['$profile._id', '$_id'] },
        userId: '$_id',
        level: { $ifNull: ['$profile.level', 'unassigned'] },
        sports: { $ifNull: ['$profile.sports', '$sports'] },
        enrollmentDate: { $ifNull: ['$profile.enrollmentDate', '$createdAt'] },
        totalFeesPaid: { $ifNull: ['$profile.totalFeesPaid', 0] },
        outstandingFees: { $ifNull: ['$profile.outstandingFees', 0] },
        isActive: { $ifNull: ['$profile.isActive', true] },
        academyId: { $ifNull: ['$profile.academyId', null] },
        attendance: { $ifNull: ['$profile.attendance', []] },
        performance: { $ifNull: ['$profile.performance', []] },
        user: {
          _id: '$_id',
          name: '$name',
          email: '$email',
          phone: '$phone',
          sports: '$sports',
          isActive: '$isActive'
        }
      }
    });

    aggregatePipeline.push({ $sort: { enrollmentDate: -1 } }, { $skip: skip }, { $limit: limitNum });

    const countPipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
    ];

    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      const academyObjectId = new mongoose.Types.ObjectId(String(auth.academyId));
      countPipeline.push({ $match: { 'profile.academyId': academyObjectId } });
    }

    if (level) {
      countPipeline.push({ $match: { 'profile.level': level } });
    }
    countPipeline.push({ $count: 'total' });

    const [students, countResult] = await Promise.all([
      User.aggregate(aggregatePipeline),
      User.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limitNum);

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages,
          totalStudents: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
