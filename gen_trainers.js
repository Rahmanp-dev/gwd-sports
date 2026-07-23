const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. /api/admin/trainers/route.ts
const trainersRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import TrainerProfile from '@/lib/models/Trainer';
import User from '@/lib/models/User';
import Academy from '@/lib/models/Academy';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limitNum;
    
    const academyId = searchParams.get('academyId');
    const sport = searchParams.get('sport');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'joinedDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const filter: any = {};
    if (academyId) filter.academyId = academyId;
    if (sport) filter.sports = { $in: [sport] };
    if (isActive !== null && isActive !== undefined) filter.isActive = isActive === 'true';

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let aggregatePipeline: any[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'academies',
          localField: 'academyId',
          foreignField: '_id',
          as: 'academy'
        }
      },
      {
        $addFields: {
          studentCount: { $size: { $ifNull: ['$students', []] } }
        }
      }
    ];

    if (search) {
      aggregatePipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { sports: { $regex: search, $options: 'i' } },
            { specializations: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    aggregatePipeline.push(
      { $sort: sort },
      { $skip: skip },
      { $limit: limitNum }
    );

    const [trainers, total] = await Promise.all([
      TrainerProfile.aggregate(aggregatePipeline),
      TrainerProfile.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return NextResponse.json({
      success: true,
      data: {
        trainers,
        pagination: {
          currentPage: page,
          totalPages,
          totalTrainers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const body = await req.json();
    // Simplified trainer creation logic based on what standard trainer profiles need
    // Since creating users usually happens first, we'll just handle the profile
    const trainer = new TrainerProfile(body);
    await trainer.save();

    return NextResponse.json({ success: true, message: 'Trainer created successfully', data: { trainer } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/admin/trainers');
fs.writeFileSync('src/app/api/admin/trainers/route.ts', trainersRoute);

// 2. /api/admin/trainers/[id]/route.ts
const trainerIdRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import mongoose from 'mongoose';
import TrainerProfile from '@/lib/models/Trainer';
import StudentProfile from '@/lib/models/Student';
import Academy from '@/lib/models/Academy';
import User from '@/lib/models/User';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid trainer ID' }, { status: 400 });
    }

    const trainer = await TrainerProfile.findOne({ userId: id })
      .populate('userId', 'name email phone')
      .populate('academyId', 'name location')
      .populate('students', 'name email phone');

    if (!trainer) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { trainer } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const id = params.id;
    const updates = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid trainer ID' }, { status: 400 });
    }

    delete updates.userId;
    delete updates.students;
    delete updates.rating;

    const trainer = await TrainerProfile.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!trainer || !trainer.isActive) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Trainer updated successfully', data: { trainer } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid trainer ID' }, { status: 400 });
    }

    const trainer = await TrainerProfile.findById(id);
    if (!trainer || !trainer.isActive) {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    trainer.isActive = false;
    await trainer.save();

    await StudentProfile.updateMany(
      { trainers: trainer.userId },
      { $pull: { trainers: trainer.userId } }
    );

    if (trainer.academyId) {
      await Academy.findByIdAndUpdate(
        trainer.academyId,
        { $pull: { trainers: trainer.userId } }
      );
    }

    return NextResponse.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/admin/trainers/[id]');
fs.writeFileSync('src/app/api/admin/trainers/[id]/route.ts', trainerIdRoute);

// 3. /api/admin/trainers/stats/route.ts
const trainerStatsRoute = `import { NextRequest, NextResponse } from 'next/server';
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
`;

ensureDir('src/app/api/admin/trainers/stats');
fs.writeFileSync('src/app/api/admin/trainers/stats/route.ts', trainerStatsRoute);
