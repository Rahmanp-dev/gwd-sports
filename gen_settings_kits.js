const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. /api/admin/settings/route.ts
const settingsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import { GlobalSettings } from '@/lib/models/Settings';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    let settings = await GlobalSettings.findOne();
    if (!settings) {
        settings = await GlobalSettings.create({
        performanceMetrics: ['dribble', 'running', 'defending', 'strike', 'stamina'],
        defaultFeeAmount: 1000,
        });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const body = await req.json();
    const { performanceMetrics, defaultFeeAmount, currency, heroMode, heroImages, logoUrl, logoAlignment, logoIsCircular, logoScale } = body;
    
    let settings = await GlobalSettings.findOne();
    if (!settings) {
        settings = await GlobalSettings.create({});
    }

    if (performanceMetrics) settings.performanceMetrics = performanceMetrics;
    if (defaultFeeAmount !== undefined) settings.defaultFeeAmount = defaultFeeAmount;
    if (currency) settings.currency = currency;
    if (heroMode) settings.heroMode = heroMode;
    if (heroImages) settings.heroImages = heroImages;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (logoAlignment) settings.logoAlignment = logoAlignment;
    if (logoIsCircular !== undefined) settings.logoIsCircular = logoIsCircular;
    if (logoScale !== undefined) settings.logoScale = logoScale;

    await settings.save();

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/admin/settings');
fs.writeFileSync('src/app/api/admin/settings/route.ts', settingsRoute);

// 2. /api/admin/settings/upload-hero/route.ts
const uploadHeroRoute = `import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const formData = await req.formData();
    const files = formData.getAll('files') as File[]; // typically field name 'files' or 'hero'

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hero');
    await mkdir(uploadDir, { recursive: true });

    const fileUrls: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.name);
      const filename = 'hero-' + uniqueSuffix + ext;
      const filepath = path.join(uploadDir, filename);

      await writeFile(filepath, buffer);
      fileUrls.push('/uploads/hero/' + filename);
    }

    if (fileUrls.length === 0) {
       return NextResponse.json({ success: false, message: 'No valid files uploaded' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      data: { urls: fileUrls }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server error during file upload' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/admin/settings/upload-hero');
fs.writeFileSync('src/app/api/admin/settings/upload-hero/route.ts', uploadHeroRoute);

// 3. /api/admin/settings/upload-logo/route.ts
const uploadLogoRoute = `import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const formData = await req.formData();
    const file = formData.get('file') as File; // typically field name 'file' or 'logo'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logo');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.name);
    const filename = 'logo-' + uniqueSuffix + ext;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);
    const fileUrl = '/uploads/logo/' + filename;

    return NextResponse.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { url: fileUrl }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server error during file upload' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/admin/settings/upload-logo');
fs.writeFileSync('src/app/api/admin/settings/upload-logo/route.ts', uploadLogoRoute);

// 4. /api/admin/get-kits/route.ts
const getKitsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const kits = await StudentProfile.aggregate([
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
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/admin/get-kits');
fs.writeFileSync('src/app/api/admin/get-kits/route.ts', getKitsRoute);

// 5. /api/admin/students/[studentId]/kits/[kitId]/route.ts
const updateKitRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';

export async function PUT(req: NextRequest, { params }: { params: { studentId: string; kitId: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { studentId, kitId } = params;
    const { status, cost } = await req.json();

    const student = await StudentProfile.findOne({ userId: studentId });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const kit = student.kits.id(kitId);
    if (!kit) {
      return NextResponse.json({ success: false, message: 'Kit not found' }, { status: 404 });
    }

    if (kit.status === 'rejected') {
      return NextResponse.json({ success: false, message: 'Cannot update a rejected kit' }, { status: 400 });
    }

    kit.status = status;
    if (cost !== undefined) kit.cost = cost;
    if (status === 'delivered') {
      kit.deliveredAt = new Date();
    }

    await student.save();

    return NextResponse.json({ success: true, message: 'Kit status updated successfully', data: { kit } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/admin/students/[studentId]/kits/[kitId]');
fs.writeFileSync('src/app/api/admin/students/[studentId]/kits/[kitId]/route.ts', updateKitRoute);
