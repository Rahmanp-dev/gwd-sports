import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ studentId: string, performanceId: string }> }) {
  try {
    const { studentId, performanceId } = await params;
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const updates = await req.json();

    const student = await StudentProfile.findOne({ userId: studentId });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const performanceRecord = student.performance.id(performanceId);
    if (!performanceRecord) {
      return NextResponse.json({ success: false, message: 'Performance record not found' }, { status: 404 });
    }

    if (updates.score !== undefined) performanceRecord.score = updates.score;
    if (updates.maxScore !== undefined) performanceRecord.maxScore = updates.maxScore;
    if (updates.remarks !== undefined) performanceRecord.remarks = updates.remarks;
    if (updates.category !== undefined) performanceRecord.category = updates.category;
    
    await student.save();

    return NextResponse.json({ success: true, message: 'Performance record updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ studentId: string, performanceId: string }> }) {
  try {
    const { studentId, performanceId } = await params;
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const student = await StudentProfile.findOne({ userId: studentId });
    
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    (student.performance as any).pull(performanceId);
    await student.save();

    return NextResponse.json({ success: true, message: 'Performance record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
