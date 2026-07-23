import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Event from '@/lib/models/Event';
import { adminMiddleware } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const events = await Event.find({ status: 'published' }).sort({ startDate: 1 });
    return NextResponse.json({ success: true, data: { events } });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    const data = await req.json();
    const event = new Event(data);
    await event.save();
    return NextResponse.json({ success: true, data: { event } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
