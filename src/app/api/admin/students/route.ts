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

    const totalStudents = await StudentProfile.countDocuments();
    const students = await StudentProfile.find()
      .populate('userId academyId trainers')
      .skip(skip)
      .limit(limit)
      .lean();
    
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
