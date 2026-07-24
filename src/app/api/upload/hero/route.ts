import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware/auth';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ success: false, message: 'Cloud storage not configured' }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const maxBytes = 10 * 1024 * 1024; // 10MB for hero images
    if (file.size > maxBytes) {
      return NextResponse.json({ success: false, message: 'File too large. Max 10MB.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Only JPEG, PNG, WebP, GIF allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadImage(buffer, {
      folder: `${auth.academyId || 'platform'}/heroes`,
      transformation: [
        {
          width: 1920,
          height: 1080,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Hero upload error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Hero upload failed' }, { status: 500 });
  }
}
