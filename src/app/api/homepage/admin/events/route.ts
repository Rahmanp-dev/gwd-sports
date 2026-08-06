import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import LandingPageEventCard from '@/lib/models/HomepageEventCard';
import Event from '@/lib/models/Event';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const eventCards = await LandingPageEventCard.find()
      .sort({ order: 1 })
      .populate({
        path: 'eventId',
        select: 'name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status'
      });

    return NextResponse.json({ success: true, data: eventCards });
  } catch (error: any) {
    console.error('[api/homepage/admin/events]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Failed to fetch landing page events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { eventId, colorScheme } = await req.json();

    const event = await Event.findById(eventId);
    if (!event) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });

    const existingCard = await LandingPageEventCard.findOne({ eventId });
    if (existingCard) return NextResponse.json({ success: false, message: 'Event is already added to landing page' }, { status: 400 });

    const highestOrder = await LandingPageEventCard.findOne().sort({ order: -1 }).select('order');
    const newOrder = highestOrder ? highestOrder.order + 1 : 1;

    const eventCard = await LandingPageEventCard.create({
      eventId,
      order: newOrder,
      colorScheme: colorScheme || 'from-green-600 to-emerald-500',
    });

    const populatedCard = await LandingPageEventCard.findById(eventCard._id).populate({
      path: 'eventId',
      select: 'name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status'
    });

    return NextResponse.json({ success: true, message: 'Event card added to landing page', data: populatedCard }, { status: 201 });
  } catch (error: any) {
    console.error('[api/homepage/admin/events]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Failed to add event card' }, { status: 500 });
  }
}
