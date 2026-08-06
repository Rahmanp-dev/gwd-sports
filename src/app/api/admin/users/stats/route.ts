import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const activeStats = await User.aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } }
    ]);

    const totalUsers = await User.countDocuments();

    return NextResponse.json({ success: true, data: { totalUsers, roleDistribution: roleStats, activeDistribution: activeStats } });
  } catch (error: any) {
    console.error('[api/admin/users/stats]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
