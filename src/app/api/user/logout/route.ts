import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    
    /**
     * `.catch` matters: the client logs out with no request body, and
     * `req.json()` on an empty body throws `Unexpected end of JSON input`. That
     * turned every logout into a 500 — harmless in effect, because the client
     * clears localStorage regardless, but it meant the refresh token was never
     * revoked server-side. A logout that leaves a valid refresh token behind is
     * not a logout.
     */
    const { refreshToken } = await req.json().catch(() => ({}));
    if (refreshToken) {
      await auth.user.removeRefreshToken(refreshToken);
    }
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('[user/logout]', { name: error?.name, message: error?.message });
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
