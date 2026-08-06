import { NextRequest, NextResponse } from 'next/server';
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
    console.error('[api/events/admin/all-events]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
