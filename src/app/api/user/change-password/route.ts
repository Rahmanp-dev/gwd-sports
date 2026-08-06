import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { authMiddleware } from '@/lib/middleware/auth';

export async function PUT(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { currentPassword, newPassword } = await req.json();
    const user = await User.findById(auth.user._id).select('+password');
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) return NextResponse.json({ success: false, message: 'Current password is incorrect' }, { status: 400 });

    user.password = newPassword;
    await user.save();
    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('[api/user/change-password]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
