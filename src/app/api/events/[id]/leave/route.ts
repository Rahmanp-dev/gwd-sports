import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Event from '@/lib/models/Event';
import mongoose from 'mongoose';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { id } = await params;
    const userId = auth.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid event ID' }, { status: 400 });

    const event = await Event.findById(id);
    if (!event || !event.isActive) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });

    if (!event.participants.includes(userId)) return NextResponse.json({ success: false, message: 'You are not registered for this event' }, { status: 400 });

    if (new Date() >= event.startDate) return NextResponse.json({ success: false, message: 'Cannot leave event after it has started' }, { status: 400 });

    event.participants = event.participants.filter((p: any) => p.toString() !== userId.toString());
    await event.save();

    return NextResponse.json({ success: true, message: 'Successfully left the event' });
  } catch (error: any) {
    console.error('[api/events/[id]/leave]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
