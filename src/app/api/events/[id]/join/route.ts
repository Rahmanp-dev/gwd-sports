import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import Event from '@/lib/models/Event';
import mongoose from 'mongoose';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { id } = await params;
    const userId = auth.user._id;

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
    console.error('[api/events/[id]/join]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
