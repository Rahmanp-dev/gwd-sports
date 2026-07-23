const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. /api/trainer/students/route.ts (GET)
const studentsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import TrainerProfile from '@/lib/models/Trainer';
import StudentProfile from '@/lib/models/Student';
import User from '@/lib/models/User';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const trainerId = searchParams.get('trainerId') || (req as any).user._id;
    const page = parseInt(searchParams.get('page') || '1');
    const limitNum = parseInt(searchParams.get('limit') || '10');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const skip = (page - 1) * limitNum;

    const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile) {
      return NextResponse.json({ success: false, message: 'Trainer profile not found' }, { status: 404 });
    }

    const studentUserIds = (trainerProfile.students || []).map((id: any) => {
      try {
        return new mongoose.Types.ObjectId(id._id ? id._id.toString() : id.toString());
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    if (studentUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          students: [],
          pagination: { currentPage: page, totalPages: 0, totalStudents: 0, hasNextPage: false, hasPrevPage: false }
        }
      });
    }

    const matchStage: any = { _id: { $in: studentUserIds } };
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const aggregatePipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      {
        $unwind: { path: '$profile', preserveNullAndEmptyArrays: true }
      }
    ];

    if (level) {
      aggregatePipeline.push({ $match: { 'profile.level': level } });
    }

    aggregatePipeline.push({
      $project: {
        _id: { $ifNull: ['$profile._id', '$_id'] },
        userId: '$_id',
        level: { $ifNull: ['$profile.level', 'unassigned'] },
        sports: { $ifNull: ['$profile.sports', '$sports'] },
        enrollmentDate: { $ifNull: ['$profile.enrollmentDate', '$createdAt'] },
        totalFeesPaid: { $ifNull: ['$profile.totalFeesPaid', 0] },
        outstandingFees: { $ifNull: ['$profile.outstandingFees', 0] },
        isActive: { $ifNull: ['$profile.isActive', true] },
        academyId: { $ifNull: ['$profile.academyId', null] },
        attendance: { $ifNull: ['$profile.attendance', []] },
        performance: { $ifNull: ['$profile.performance', []] },
        user: {
          _id: '$_id',
          name: '$name',
          email: '$email',
          phone: '$phone',
          sports: '$sports',
          isActive: '$isActive'
        }
      }
    });

    aggregatePipeline.push({ $sort: { enrollmentDate: -1 } }, { $skip: skip }, { $limit: limitNum });

    const countPipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
    ];

    if (level) {
      countPipeline.push({ $match: { 'profile.level': level } });
    }
    countPipeline.push({ $count: 'total' });

    const [students, countResult] = await Promise.all([
      User.aggregate(aggregatePipeline),
      User.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limitNum);

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages,
          totalStudents: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/trainer/students');
fs.writeFileSync('src/app/api/trainer/students/route.ts', studentsRoute);

// 2. /api/trainer/add-student/route.ts (POST)
const addStudentRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import TrainerProfile from '@/lib/models/Trainer';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { studentId, trainerId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }

    const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile) return NextResponse.json({ success: false, message: 'Trainer profile not found' }, { status: 404 });

    const studentProfile = await StudentProfile.findOne({ userId: studentId });
    if (!studentProfile) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    if (studentProfile.trainers?.some((t: any) => t.toString() === trainerId.toString())) {
      return NextResponse.json({ success: false, message: 'Student is already assigned' }, { status: 400 });
    }

    if (!studentProfile.trainers) studentProfile.trainers = [];
    studentProfile.trainers.push(trainerId);
    await studentProfile.save();

    if (!trainerProfile.students.includes(studentId)) {
      trainerProfile.students.push(studentId);
      await trainerProfile.save();
    }

    return NextResponse.json({ success: true, message: 'Student assigned successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/trainer/add-student');
fs.writeFileSync('src/app/api/trainer/add-student/route.ts', addStudentRoute);

// 3. /api/trainer/remove-student/route.ts (POST)
const removeStudentRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import TrainerProfile from '@/lib/models/Trainer';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { studentId, trainerId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }

    const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile) return NextResponse.json({ success: false, message: 'Trainer profile not found' }, { status: 404 });

    const studentProfile = await StudentProfile.findOne({ userId: studentId });
    if (!studentProfile) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    if (studentProfile.trainers) {
      studentProfile.trainers = studentProfile.trainers.filter((t: any) => t.toString() !== trainerId.toString());
      await studentProfile.save();
    }

    if (trainerProfile.students.includes(studentId)) {
      trainerProfile.students = trainerProfile.students.filter((s: any) => s.toString() !== studentId.toString());
      await trainerProfile.save();
    }

    return NextResponse.json({ success: true, message: 'Student removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/trainer/remove-student');
fs.writeFileSync('src/app/api/trainer/remove-student/route.ts', removeStudentRoute);

// 4. /api/trainer/mark-attendance/route.ts (POST)
const markAttendanceRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const trainerId = (req as any).user._id;
    const { studentId, date, present, remarks } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
    }

    const student = await StudentProfile.findOne({ userId: studentId });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const attendanceDate = new Date(date);
    const existingAttendance = student.attendance.find((record: any) => 
      record.date.toDateString() === attendanceDate.toDateString()
    );

    if (existingAttendance) {
      existingAttendance.present = present;
      existingAttendance.markedBy = trainerId;
      if (remarks) existingAttendance.remarks = remarks;
    } else {
      student.attendance.push({
        date: attendanceDate,
        present,
        markedBy: trainerId,
        remarks
      });
    }

    await student.save();
    return NextResponse.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/trainer/mark-attendance');
fs.writeFileSync('src/app/api/trainer/mark-attendance/route.ts', markAttendanceRoute);

// 5. /api/trainer/student/[studentId]/attendance/route.ts (GET)
const studentAttendanceRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const trainerId = (req as any).user._id;
    const studentId = params.studentId;
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
    }

    const student = await StudentProfile.findOne({ userId: studentId }).populate('userId', 'name email');
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    let attendance = student.attendance;
    if (fromDate || toDate) {
      attendance = attendance.filter((record: any) => {
        const recordDate = new Date(record.date);
        if (fromDate && recordDate < new Date(fromDate)) return false;
        if (toDate && recordDate > new Date(toDate)) return false;
        return true;
      });
    }

    attendance = attendance.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalRecords = attendance.length;
    const totalPresent = attendance.filter((record: any) => record.present).length;
    const attendancePercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        student: student.userId,
        attendance,
        stats: { totalRecords, totalPresent, totalAbsent: totalRecords - totalPresent, attendancePercentage }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/trainer/student/[studentId]/attendance');
fs.writeFileSync('src/app/api/trainer/student/[studentId]/attendance/route.ts', studentAttendanceRoute);

// 6. /api/trainer/add-performance/route.ts (POST)
const addPerformanceRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const trainerId = (req as any).user._id;
    const { studentId, sport, score, maxScore, remarks, category } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
    }

    const student = await StudentProfile.findOne({ userId: studentId });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    student.performance.push({
      sport,
      score,
      maxScore,
      remarks,
      category,
      evaluatedBy: trainerId,
      evaluatedAt: new Date()
    });

    await student.save();
    return NextResponse.json({ success: true, message: 'Performance record added successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/trainer/add-performance');
fs.writeFileSync('src/app/api/trainer/add-performance/route.ts', addPerformanceRoute);

// 7. /api/trainer/performance/[studentId]/[performanceId]/route.ts (PUT, DELETE)
const performanceActionRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function PUT(req: NextRequest, { params }: { params: { studentId: string, performanceId: string } }) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { studentId, performanceId } = params;
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

export async function DELETE(req: NextRequest, { params }: { params: { studentId: string, performanceId: string } }) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { studentId, performanceId } = params;
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
`;

ensureDir('src/app/api/trainer/performance/[studentId]/[performanceId]');
fs.writeFileSync('src/app/api/trainer/performance/[studentId]/[performanceId]/route.ts', performanceActionRoute);
