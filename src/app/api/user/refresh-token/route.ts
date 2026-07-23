import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { verifyRefreshToken, generateTokens } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { refreshToken } = await req.json();
    if (!refreshToken) return NextResponse.json({ success: false, message: 'Refresh token is required' }, { status: 400 });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens?.includes(refreshToken)) return NextResponse.json({ success: false, message: 'Invalid refresh token' }, { status: 401 });
    if (!user.isActive) return NextResponse.json({ success: false, message: 'Account is deactivated' }, { status: 401 });

    const tokens = generateTokens({ userId: user._id.toString(), email: user.email, role: user.role });
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(tokens.refreshToken);

    return NextResponse.json({ success: true, message: 'Token refreshed successfully', data: tokens });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Invalid refresh token' }, { status: 401 });
  }
}
