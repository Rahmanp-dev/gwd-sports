import { NextRequest, NextResponse } from 'next/server';
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
    console.error('[api/events/admin/stats]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
