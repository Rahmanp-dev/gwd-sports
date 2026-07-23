const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. /api/student/join-academy/route.ts
const joinAcademyRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import Academy from '@/lib/models/Academy';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { academyId } = await req.json();
    const userId = (req as any).user._id;

    if (!mongoose.Types.ObjectId.isValid(academyId)) {
      return NextResponse.json({ success: false, message: 'Invalid academy ID' }, { status: 400 });
    }

    const academy = await Academy.findById(academyId);
    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    if (academy.students.length >= academy.capacity) {
      return NextResponse.json({ success: false, message: 'Academy is at full capacity' }, { status: 400 });
    }

    let studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      studentProfile = new StudentProfile({ userId });
    }

    if (studentProfile.academyId?.toString() === academyId) {
      return NextResponse.json({ success: false, message: 'Already enrolled in this academy' }, { status: 400 });
    }

    studentProfile.academyId = academyId;
    studentProfile.enrollmentDate = new Date();
    await studentProfile.save();

    if (!academy.students.includes(userId)) {
      academy.students.push(userId);
      await academy.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined academy',
      data: { academy: { _id: academy._id, name: academy.name } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/student/join-academy');
fs.writeFileSync('src/app/api/student/join-academy/route.ts', joinAcademyRoute);


// 2. /api/student/attendance/route.ts
const attendanceRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;
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
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/student/attendance');
fs.writeFileSync('src/app/api/student/attendance/route.ts', attendanceRoute);

// 3. /api/student/performance/route.ts
const performanceRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport');
    const category = searchParams.get('category');

    const studentProfile = await StudentProfile.findOne({ userId })
      .populate({ path: 'performance.evaluatedBy', model: User, select: 'name' });

    if (!studentProfile) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    let performance = studentProfile.performance;

    if (sport) {
      performance = performance.filter((record: any) => 
        record.sport.toLowerCase() === sport.toLowerCase()
      );
    }

    if (category) {
      performance = performance.filter((record: any) => 
        record.category.toLowerCase() === category.toLowerCase()
      );
    }

    performance = performance.sort((a: any, b: any) => 
      new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
    );

    return NextResponse.json({ success: true, data: { performance } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/student/performance');
fs.writeFileSync('src/app/api/student/performance/route.ts', performanceRoute);

// 4. /api/student/request-kit/route.ts
const requestKitRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;
    const { kitName } = await req.json();

    const studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    const existingKit = studentProfile.kits.find((kit: any) => 
      kit.kitName.toLowerCase() === kitName.toLowerCase() && 
      kit.status !== 'delivered'
    );

    if (existingKit) {
      return NextResponse.json({ success: false, message: 'Kit already requested or being processed' }, { status: 400 });
    }

    studentProfile.kits.push({
      kitName,
      status: 'requested',
      requestedAt: new Date()
    });

    await studentProfile.save();

    return NextResponse.json({ success: true, message: 'Kit requested successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/student/request-kit');
fs.writeFileSync('src/app/api/student/request-kit/route.ts', requestKitRoute);


// 5. /api/student/kits/route.ts
const kitsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;

    const studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { kits: studentProfile.kits } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/student/kits');
fs.writeFileSync('src/app/api/student/kits/route.ts', kitsRoute);

// 6. /api/student/pay-fees/route.ts
const payFeesRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const userId = (req as any).user._id;
    const { amount, period, transactionId } = await req.json();

    const studentProfile = await StudentProfile.findOne({ userId });
    if (!studentProfile) {
      return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
    }

    studentProfile.feePayments.push({
      amount,
      paymentDate: new Date(),
      period,
      status: 'paid',
      transactionId
    });

    studentProfile.totalFeesPaid += amount;
    if (studentProfile.outstandingFees >= amount) {
      studentProfile.outstandingFees -= amount;
    } else {
      studentProfile.outstandingFees = 0;
    }

    await studentProfile.save();

    return NextResponse.json({
      success: true,
      message: 'Fee payment recorded successfully',
      data: {
        totalPaid: studentProfile.totalFeesPaid,
        outstanding: studentProfile.outstandingFees
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/student/pay-fees');
fs.writeFileSync('src/app/api/student/pay-fees/route.ts', payFeesRoute);
