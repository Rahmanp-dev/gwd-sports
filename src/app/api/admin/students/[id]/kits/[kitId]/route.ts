import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; kitId: string }> }) {
  try {
    const { id, kitId } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();


    const { status, cost } = await req.json();

    const student = await StudentProfile.findOne({ userId: id });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const kit = student.kits.id(kitId);
    if (!kit) {
      return NextResponse.json({ success: false, message: 'Kit not found' }, { status: 404 });
    }

    if (kit.status === 'rejected') {
      return NextResponse.json({ success: false, message: 'Cannot update a rejected kit' }, { status: 400 });
    }

    kit.status = status;
    if (cost !== undefined) kit.cost = cost;
    if (status === 'delivered') {
      kit.deliveredAt = new Date();
    }

    await student.save();

    return NextResponse.json({ success: true, message: 'Kit status updated successfully', data: { kit } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
