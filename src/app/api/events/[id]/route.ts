import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Event from '@/lib/models/Event';
import { adminMiddleware } from '@/lib/middleware/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const event = await Event.findById(id);
    return NextResponse.json({ success: true, data: { event } });
  } catch (error) {
    console.error('[api/events/[id]]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    const data = await req.json();
    const event = await Event.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json({ success: true, data: { event } });
  } catch (error) {
    console.error('[api/events/[id]]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    await Event.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/events/[id]]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
