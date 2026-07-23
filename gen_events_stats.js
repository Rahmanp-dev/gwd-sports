const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// EVENTS
// 1. /api/events/[id]/join/route.ts
const joinEventRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Event from '@/lib/models/Event';
import mongoose from 'mongoose';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const id = params.id;
    const userId = (req as any).user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid event ID' }, { status: 400 });

    const event = await Event.findById(id);
    if (!event || !event.isActive) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    if (!event.registrationOpen) return NextResponse.json({ success: false, message: 'Registration is closed' }, { status: 400 });
    if (event.participants.includes(userId)) return NextResponse.json({ success: false, message: 'Already registered' }, { status: 400 });
    
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      return NextResponse.json({ success: false, message: 'Event is full' }, { status: 400 });
    }

    event.participants.push(userId);
    await event.save();
    
    return NextResponse.json({ success: true, message: 'Successfully joined the event', data: { event: { _id: event._id, name: event.name, participantCount: event.participants.length } } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;
ensureDir('src/app/api/events/[id]/join');
fs.writeFileSync('src/app/api/events/[id]/join/route.ts', joinEventRoute);

// 2. /api/events/[id]/leave/route.ts
const leaveEventRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Event from '@/lib/models/Event';
import mongoose from 'mongoose';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const id = params.id;
    const userId = (req as any).user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid event ID' }, { status: 400 });

    const event = await Event.findById(id);
    if (!event || !event.isActive) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });

    if (!event.participants.includes(userId)) return NextResponse.json({ success: false, message: 'You are not registered for this event' }, { status: 400 });

    if (new Date() >= event.startDate) return NextResponse.json({ success: false, message: 'Cannot leave event after it has started' }, { status: 400 });

    event.participants = event.participants.filter((p: any) => p.toString() !== userId.toString());
    await event.save();

    return NextResponse.json({ success: true, message: 'Successfully left the event' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;
ensureDir('src/app/api/events/[id]/leave');
fs.writeFileSync('src/app/api/events/[id]/leave/route.ts', leaveEventRoute);

// 3. /api/events/user/my-events/route.ts
const myEventsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Event from '@/lib/models/Event';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';

    const filter: any = { participants: userId, isActive: true };
    if (status) filter.status = status;
    if (upcoming) filter.startDate = { $gte: new Date() };

    const [events, total] = await Promise.all([
      Event.find(filter).populate('createdBy', 'name email').sort({ startDate: 1 }).skip((page - 1) * limitNum).limit(limitNum).lean(),
      Event.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: { events, pagination: { currentPage: page, totalPages: Math.ceil(total / limitNum), totalEvents: total, hasNextPage: page < Math.ceil(total / limitNum), hasPrevPage: page > 1 } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;
ensureDir('src/app/api/events/user/my-events');
fs.writeFileSync('src/app/api/events/user/my-events/route.ts', myEventsRoute);

// 4. /api/events/admin/stats/route.ts
const eventStatsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Event from '@/lib/models/Event';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const stats = await Event.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalParticipants: { $sum: { $size: '$participants' } } } }
    ]);

    const sportStats = await Event.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$sport', count: { $sum: 1 }, totalParticipants: { $sum: { $size: '$participants' } } } },
      { $sort: { count: -1 } }
    ]);

    const totalEvents = await Event.countDocuments({ isActive: true });
    const upcomingEvents = await Event.countDocuments({ isActive: true, startDate: { $gte: new Date() }, status: 'published' });
    const ongoingEvents = await Event.countDocuments({ isActive: true, status: 'ongoing' });

    return NextResponse.json({
      success: true,
      data: { totalEvents, upcomingEvents, ongoingEvents, eventsByStatus: stats, eventsBySport: sportStats }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;
ensureDir('src/app/api/events/admin/stats');
fs.writeFileSync('src/app/api/events/admin/stats/route.ts', eventStatsRoute);

// 5. /api/events/admin/all-events/route.ts
const adminAllEventsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Event from '@/lib/models/Event';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limitNum;
    
    const filter: any = {};
    const sport = searchParams.get('sport');
    if (sport) filter.sport = sport;
    const status = searchParams.get('status');
    if (status) filter.status = status;
    const isPublic = searchParams.get('isPublic');
    if (isPublic !== null) filter.isPublic = isPublic === 'true';
    
    const search = searchParams.get('search');
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sort: any = {};
    const sortBy = searchParams.get('sortBy') || 'startDate';
    sort[sortBy] = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

    const [events, total] = await Promise.all([
      Event.find(filter).populate('createdBy', 'name email').populate('participants', 'name email').sort(sort).skip(skip).limit(limitNum).lean(),
      Event.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: { currentPage: page, totalPages: Math.ceil(total / limitNum), totalEvents: total, hasNextPage: page < Math.ceil(total / limitNum), hasPrevPage: page > 1 }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;
ensureDir('src/app/api/events/admin/all-events');
fs.writeFileSync('src/app/api/events/admin/all-events/route.ts', adminAllEventsRoute);

// STATS
// 6. /api/admin/students/leaderboard/route.ts
const studentLeaderboardRoute = `import { NextRequest, NextResponse } from 'next/server';
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
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;
ensureDir('src/app/api/admin/students/leaderboard');
fs.writeFileSync('src/app/api/admin/students/leaderboard/route.ts', studentLeaderboardRoute);

// 7. /api/admin/students/stats/route.ts
const studentStatsRoute = `import { NextRequest, NextResponse } from 'next/server';
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
`;
ensureDir('src/app/api/admin/students/stats');
fs.writeFileSync('src/app/api/admin/students/stats/route.ts', studentStatsRoute);

// 8. /api/admin/users/stats/route.ts
const userStatsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const activeStats = await User.aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } }
    ]);

    const totalUsers = await User.countDocuments();

    return NextResponse.json({ success: true, data: { totalUsers, roleDistribution: roleStats, activeDistribution: activeStats } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;
ensureDir('src/app/api/admin/users/stats');
fs.writeFileSync('src/app/api/admin/users/stats/route.ts', userStatsRoute);
