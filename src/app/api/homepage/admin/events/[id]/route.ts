import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import LandingPageEventCard from '@/lib/models/HomepageEventCard';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { id } = await params;
    const { order, colorScheme, isActive } = await req.json();

    const eventCard = await LandingPageEventCard.findById(id);
    if (!eventCard) return NextResponse.json({ success: false, message: 'Event card not found' }, { status: 404 });

    if (order && order !== eventCard.order) {
      if (!Number.isInteger(order) || order < 1) {
        return NextResponse.json({ success: false, message: 'Order must be a positive integer' }, { status: 400 });
      }

      const totalCards = await LandingPageEventCard.countDocuments();
      if (order > totalCards) {
        return NextResponse.json({ success: false, message: `Order cannot exceed ${totalCards}` }, { status: 400 });
      }

      const oldOrder = eventCard.order;
      const newOrder = order;

      if (newOrder < oldOrder) {
        await LandingPageEventCard.updateMany(
          { order: { $gte: newOrder, $lt: oldOrder }, _id: { $ne: id } },
          { $inc: { order: 1 } }
        );
      } else {
        await LandingPageEventCard.updateMany(
          { order: { $gt: oldOrder, $lte: newOrder }, _id: { $ne: id } },
          { $inc: { order: -1 } }
        );
      }
      eventCard.order = newOrder;
    }

    if (colorScheme) eventCard.colorScheme = colorScheme;
    if (typeof isActive === 'boolean') eventCard.isActive = isActive;
    await eventCard.save();

    const updatedCard = await LandingPageEventCard.findById(id).populate({
      path: 'eventId',
      select: 'name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status'
    });

    return NextResponse.json({ success: true, message: 'Event card updated successfully', data: updatedCard });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to update event card' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { id } = await params;
    const eventCard = await LandingPageEventCard.findById(id);
    if (!eventCard) return NextResponse.json({ success: false, message: 'Event card not found' }, { status: 404 });

    const deletedOrder = eventCard.order;
    await LandingPageEventCard.findByIdAndDelete(id);
    await LandingPageEventCard.updateMany(
      { order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    return NextResponse.json({ success: true, message: 'Event card deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to delete event card' }, { status: 500 });
  }
}
