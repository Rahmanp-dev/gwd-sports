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

    /**
     * Tenant isolation. Without it any academy admin could list ANY academy's
     * roster by id — and the populate makes that names, emails AND phone
     * numbers for every student and coach a competitor has. The same scoping
     * as api/admin/students/[id], and the same reasoning: a 404 for another
     * academy is indistinguishable from one that does not exist, so this
     * cannot be used to discover which ids are real.
     */
    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'No academy assigned to your account' },
          { status: 403 },
        );
      }
      if (String(auth.academyId) !== String(id)) {
        return NextResponse.json(
          { success: false, message: 'Academy not found' },
          { status: 404 },
        );
      }
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
    console.error('[api/academy/[id]/members]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
