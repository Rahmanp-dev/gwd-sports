import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware/auth';
import { cloudinary } from '@/lib/cloudinary';

/**
 * Returns a signed Cloudinary upload signature. The browser then POSTs the
 * video file DIRECTLY to Cloudinary's own endpoint — it never passes through
 * our server.
 *
 * This is why hero video upload was broken: the old client code sent the raw
 * video file to our own /api/upload/image route. Even after routing it to a
 * dedicated video endpoint, proxying the binary through a Next.js API route
 * deployed on Vercel hits Vercel's hard ~4.5MB request-body limit on
 * serverless functions — a real hero clip is routinely 10-50MB. Image
 * uploads worked because they're small enough to usually stay under that
 * ceiling; video never was. Signed direct upload is Cloudinary's own
 * recommended pattern for exactly this reason.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ success: false, message: 'Cloud storage not configured' }, { status: 503 });
    }

    const folder = `gwd/${auth.academyId || 'platform'}/hero-video`;
    const timestamp = Math.round(Date.now() / 1000);

    // Only params actually sent alongside the file need to be in the
    // signature — cloud_name, api_key, resource_type and the file itself are
    // deliberately excluded, per Cloudinary's signing rules.
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      success: true,
      data: {
        signature,
        timestamp,
        folder,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      },
    });
  } catch (error: any) {
    console.error('Video upload signature error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Could not sign upload' }, { status: 500 });
  }
}
