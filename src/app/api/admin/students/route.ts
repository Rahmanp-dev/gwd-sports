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
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Tenant isolation: scope by academyId (super admins see all)
    const filter: any = {};
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      filter.academyId = auth.academyId;
    }

    const totalStudents = await StudentProfile.countDocuments(filter);
    const rows = await StudentProfile.find(filter)
      .populate('userId academyId trainers')
      .skip(skip)
      .limit(limit)
      .lean();

    /**
     * Drop rows whose user no longer exists.
     *
     * A populate against a deleted target yields NULL, and a student with no
     * user is not a student — it is debris from a delete that did not clean up
     * after itself (fixed in lib/auth/deleteUserCascade, but historic orphans
     * are already in the database). Returning them crashed the admin list
     * outright, so one deleted account hid every remaining student.
     *
     * Filtered here rather than only in the client so every consumer of this
     * endpoint benefits, and logged so the debris is visible rather than
     * quietly swallowed.
     */
    const students = rows.filter((s: any) => s.userId);
    const orphaned = rows.length - students.length;
    if (orphaned > 0) {
      console.warn(
        `[API_ADMIN_STUDENTS_GET] skipped ${orphaned} student profile(s) whose user no longer exists`,
      );
    }

    const totalPages = Math.ceil(totalStudents / limit) || 1;

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages,
          totalStudents,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('[API_ADMIN_STUDENTS_GET]', error);
    return NextResponse.json({ success: false, message: 'Error fetching students' }, { status: 500 });
  }
}
