import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = auth.user._id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    let attendanceFilter: any = {};
    if (fromDate || toDate) {
      attendanceFilter.date = {};
      if (fromDate) attendanceFilter.date.$gte = new Date(fromDate);
      if (toDate) attendanceFilter.date.$lte = new Date(toDate);
    }

    let filteredAttendance = studentProfile.attendance;
    if (Object.keys(attendanceFilter).length > 0) {
      filteredAttendance = studentProfile.attendance.filter((record: any) => {
        if (attendanceFilter.date) {
          const recordDate = new Date(record.date);
          if (attendanceFilter.date.$gte && recordDate < attendanceFilter.date.$gte) return false;
          if (attendanceFilter.date.$lte && recordDate > attendanceFilter.date.$lte) return false;
        }
        return true;
      });
    }

    const total = filteredAttendance.length;
    const skip = (page - 1) * limitNum;
    const paginatedAttendance = filteredAttendance
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(skip, skip + limitNum);

    const totalPresent = filteredAttendance.filter((record: any) => record.present).length;
    const attendancePercentage = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        attendance: paginatedAttendance,
        stats: {
          totalRecords: total,
          totalPresent,
          totalAbsent: total - totalPresent,
          attendancePercentage
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: skip + limitNum < total,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error: any) {
    console.error('[api/student/attendance]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
