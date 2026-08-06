import { NextRequest, NextResponse } from 'next/server';
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
    // Tenant isolation: force academyId from auth for non-super-admins
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      filter.academyId = auth.academyId;
    } else if (academyId) {
      filter.academyId = academyId;
    }
    if (sport) filter.sports = { $in: [sport] };
    if (isActive === 'true') filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;

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
    console.error('[api/admin/trainers]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const body = await req.json();
    // Tenant isolation: force academyId for non-super-admins
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      body.academyId = auth.academyId;
    }
    const trainer = new TrainerProfile(body);
    await trainer.save();

    return NextResponse.json({ success: true, message: 'Trainer created successfully', data: { trainer } });
  } catch (error: any) {
    console.error('[api/admin/trainers]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
