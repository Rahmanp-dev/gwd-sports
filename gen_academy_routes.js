const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. /api/academy/[id]/members/route.ts
const membersRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid academy ID' }, { status: 400 });
    }

    const academy = await Academy.findById(id)
      .populate('trainers', 'name email phone sports')
      .populate('students', 'name email phone level');

    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        trainers: academy.trainers,
        students: academy.students
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/academy/[id]/members');
fs.writeFileSync('src/app/api/academy/[id]/members/route.ts', membersRoute);

// 2. /api/academy/add-student/route.ts
const addStudentRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
import User from '@/lib/models/User';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { academyId, studentId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid academy or student ID' }, { status: 400 });
    }

    const academy = await Academy.findById(academyId);
    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    if (academy.students.length >= academy.capacity) {
      return NextResponse.json({ success: false, message: 'Academy is at full capacity' }, { status: 400 });
    }

    const user = await User.findById(studentId);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    if (academy.students.includes(studentId)) {
      return NextResponse.json({ success: false, message: 'Student is already in this academy' }, { status: 400 });
    }

    let studentProfile = await StudentProfile.findOne({ userId: studentId });
    if (!studentProfile) {
      studentProfile = new StudentProfile({
        userId: studentId,
        academyId: academyId,
        enrollmentDate: new Date()
      });
    } else {
      studentProfile.academyId = academyId;
      if (!studentProfile.enrollmentDate) {
        studentProfile.enrollmentDate = new Date();
      }
    }
    await studentProfile.save();

    academy.students.push(studentId);
    await academy.save();

    return NextResponse.json({
      success: true,
      message: 'Student added to academy successfully',
      data: { student: user, academy: { _id: academy._id, name: academy.name } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/academy/add-student');
fs.writeFileSync('src/app/api/academy/add-student/route.ts', addStudentRoute);


// 3. /api/academy/remove-student/route.ts
const removeStudentRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { academyId, studentId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid academy or student ID' }, { status: 400 });
    }

    const academy = await Academy.findById(academyId);
    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    academy.students = academy.students.filter((sid: any) => sid.toString() !== studentId);
    await academy.save();

    await StudentProfile.findOneAndUpdate({ userId: studentId }, { $unset: { academyId: 1 } });

    return NextResponse.json({ success: true, message: 'Student removed from academy successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/academy/remove-student');
fs.writeFileSync('src/app/api/academy/remove-student/route.ts', removeStudentRoute);


// 4. /api/academy/add-trainer/route.ts
const addTrainerRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
import User from '@/lib/models/User';
import TrainerProfile from '@/lib/models/Trainer';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { academyId, trainerId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
      return NextResponse.json({ success: false, message: 'Invalid academy or trainer ID' }, { status: 400 });
    }

    const academy = await Academy.findById(academyId);
    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    const user = await User.findById(trainerId);
    if (!user || user.role !== 'trainer') {
      return NextResponse.json({ success: false, message: 'Trainer not found' }, { status: 404 });
    }

    if (academy.trainers.includes(trainerId)) {
      return NextResponse.json({ success: false, message: 'Trainer is already in this academy' }, { status: 400 });
    }

    let trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
    if (!trainerProfile) {
      trainerProfile = new TrainerProfile({
        userId: trainerId,
        academyId: academyId,
        joinedDate: new Date(),
        sports: user.sports || []
      });
    } else {
      trainerProfile.academyId = academyId;
      if (!trainerProfile.joinedDate) {
        trainerProfile.joinedDate = new Date();
      }
    }
    await trainerProfile.save();

    academy.trainers.push(trainerId);
    await academy.save();

    return NextResponse.json({
      success: true,
      message: 'Trainer added to academy successfully',
      data: { trainer: user, academy: { _id: academy._id, name: academy.name } }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/academy/add-trainer');
fs.writeFileSync('src/app/api/academy/add-trainer/route.ts', addTrainerRoute);


// 5. /api/academy/remove-trainer/route.ts
const removeTrainerRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Academy from '@/lib/models/Academy';
import TrainerProfile from '@/lib/models/Trainer';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { academyId, trainerId } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
      return NextResponse.json({ success: false, message: 'Invalid academy or trainer ID' }, { status: 400 });
    }

    const academy = await Academy.findById(academyId);
    if (!academy || !academy.isActive) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    academy.trainers = academy.trainers.filter((tid: any) => tid.toString() !== trainerId);
    await academy.save();

    await TrainerProfile.findOneAndUpdate({ userId: trainerId }, { $unset: { academyId: 1 } });

    return NextResponse.json({ success: true, message: 'Trainer removed from academy successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/academy/remove-trainer');
fs.writeFileSync('src/app/api/academy/remove-trainer/route.ts', removeTrainerRoute);
