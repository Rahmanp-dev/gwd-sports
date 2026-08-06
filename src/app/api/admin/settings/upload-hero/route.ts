import { NextRequest, NextResponse } from 'next/server';
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
    console.error('[api/admin/settings/upload-hero]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Server error during file upload' }, { status: 500 });
  }
}
