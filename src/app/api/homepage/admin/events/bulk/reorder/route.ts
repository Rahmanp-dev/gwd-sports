import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import LandingPageEventCard from '@/lib/models/HomepageEventCard';

export async function PUT(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { cards } = await req.json();

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ success: false, message: 'Cards array is required' }, { status: 400 });
    }

    const updatePromises = cards.map((card) =>
      LandingPageEventCard.findByIdAndUpdate(card.id, { order: card.order })
    );

    await Promise.all(updatePromises);

    const updatedCards = await LandingPageEventCard.find()
      .sort({ order: 1 })
      .populate({
        path: 'eventId',
        select: 'name description sport startDate endDate location venue status'
      });

    return NextResponse.json({ success: true, message: 'Cards reordered successfully', data: updatedCards });
  } catch (error: any) {
    console.error('[api/homepage/admin/events/bulk/reorder]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Failed to reorder cards' }, { status: 500 });
  }
}
