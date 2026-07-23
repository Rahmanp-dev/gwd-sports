import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import HomepageEvent from '@/lib/models/HomepageEventCard';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const events = await HomepageEvent.find({ isActive: true })
      .sort({ order: 1 })
      .populate({
        path: 'eventId',
        select: 'name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status'
      });
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
