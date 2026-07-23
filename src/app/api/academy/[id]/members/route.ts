import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid academy ID' }, { status: 400 });
    }

    const academy = await Academy.findById(id)
      .populate('trainers', 'name email phone sports')
      .populate('students', 'name email phone level');

    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        trainers: academy.trainers,
        students: academy.students
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
