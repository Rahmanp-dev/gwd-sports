import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import Batch from '@/lib/models/Batch';
import StudentProfile from '@/lib/models/Student';
import { weekdayOf } from '@/lib/attendance/session';

/**
 * The batches this coach can mark a register for.
 *
 * A trainer sees the batches they are assigned to. An admin sees every batch in
 * their academy, because they cover for absent coaches — and a register that
 * cannot be marked on the evening the coach is ill is a register that stops
 * being trusted.
 *
 * `meetsToday` is computed here rather than in the client so the coach's phone
 * timezone cannot disagree with the server about which day it is.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const filter: Record<string, unknown> = { isActive: true };

    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'No academy assigned to your account' },
          { status: 403 }
        );
      }
      filter.academyId = auth.academyId;
    }
    if (auth.user.role === 'trainer') {
      filter.coaches = auth.user._id;
    }

    const batches = await Batch.find(filter).sort({ name: 1 }).lean();

    // One grouped count rather than a query per batch.
    const counts = await StudentProfile.aggregate([
      { $match: { batchId: { $in: (batches as any[]).map((b) => b._id) }, isActive: true } },
      { $group: { _id: '$batchId', count: { $sum: 1 } } },
    ]);
    const sizeByBatch = new Map(
      (counts as { _id: any; count: number }[]).map((row) => [String(row._id), row.count])
    );

    const today = weekdayOf(new Date());

    return NextResponse.json({
      success: true,
      data: {
        today,
        batches: (batches as any[]).map((batch) => ({
          _id: String(batch._id),
          name: batch.name,
          sport: batch.sport,
          daysOfWeek: batch.daysOfWeek ?? [],
          startTime: batch.startTime ?? null,
          endTime: batch.endTime ?? null,
          studentCount: sizeByBatch.get(String(batch._id)) ?? 0,
          meetsToday:
            (batch.daysOfWeek ?? []).length === 0 ||
            (batch.daysOfWeek ?? [])
              .map((d: string) => String(d).toLowerCase())
              .includes(today),
        })),
      },
    });
  } catch (error: any) {
    console.error('[trainer/batches]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
