import { NextRequest, NextResponse } from 'next/server';
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
    console.error('[api/admin/settings/upload-logo]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Server error during file upload' }, { status: 500 });
  }
}
