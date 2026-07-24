import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models/User';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ success: false, message: 'Token and password required' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) return NextResponse.json({ success: false, message: 'Invalid or expired reset token' }, { status: 400 });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    return NextResponse.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error: unknown) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
