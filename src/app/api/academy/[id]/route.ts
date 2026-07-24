import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Academy from '@/lib/models/Academy';
import { adminMiddleware } from '@/lib/middleware/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const academy = await Academy.findById(id);
    return NextResponse.json({ success: true, data: { academy } });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    const { id } = await params;

    if (auth.user.role !== 'gwd_super_admin' && auth.academyId !== id) {
      return NextResponse.json({ success: false, message: 'Unauthorized to edit this academy' }, { status: 403 });
    }

    const data = await req.json();
    const academy = await Academy.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json({ success: true, data: { academy } });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    const { id } = await params;
    await Academy.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
