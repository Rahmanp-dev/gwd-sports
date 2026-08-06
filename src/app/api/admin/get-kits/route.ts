import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    // Tenant isolation
    const pipeline: any[] = [];
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      pipeline.push({ $match: { academyId: auth.academyId } });
    }

    const kits = await StudentProfile.aggregate([
      ...pipeline,
      { $unwind: '$kits' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          studentProfileId: '$_id',
          studentId: '$user._id',
          studentName: '$user.name',
          studentEmail: '$user.email',
          kitId: '$kits._id',
          kitName: '$kits.kitName',
          kitStatus: '$kits.status',
          kitCost: '$kits.cost',
          requestedAt: '$kits.requestedAt',
          deliveredAt: '$kits.deliveredAt'
        }
      }
    ]);

    return NextResponse.json({ success: true, data: { kits } });
  } catch (error: any) {
    console.error('[api/admin/get-kits]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
