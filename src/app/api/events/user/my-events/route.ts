import { NextRequest, NextResponse } from 'next/server';
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
