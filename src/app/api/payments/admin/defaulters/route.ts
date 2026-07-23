import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');

    // Tenant isolation
    const tenantFilter: any = {};
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      tenantFilter.academyId = auth.academyId;
    }

    const students = await StudentProfile.find({ outstandingFees: { $gt: 0 }, ...tenantFilter })
      .populate('userId', 'name email phone')
      .sort({ outstandingFees: -1 })
      .skip((page - 1) * limitNum)
      .limit(limitNum);

    const total = await StudentProfile.countDocuments({ outstandingFees: { $gt: 0 }, ...tenantFilter });

    return NextResponse.json({
      success: true,
      data: { students, pagination: { total, page, pages: Math.ceil(total / limitNum) } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
