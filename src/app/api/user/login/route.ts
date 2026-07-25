import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateTokens } from '@/lib/jwt';
import { isPlaceholderAccount, PLACEHOLDER_LOGIN_MESSAGE } from '@/lib/auth/placeholder';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });

    /**
     * Imported students hold a synthetic address derived from their PUBLIC
     * passport id, so anyone with that id can construct it. These are
     * placeholders for a record, never credentials. Same message as "no such
     * account", so this cannot be used to confirm a passport id is real.
     */
    if (isPlaceholderAccount(user)) {
      return NextResponse.json(
        { success: false, message: PLACEHOLDER_LOGIN_MESSAGE },
        { status: 401 }
      );
    }

    if (!user.isActive) return NextResponse.json({ success: false, message: 'Account is deactivated' }, { status: 401 });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });

    const tokens = generateTokens({ 
      userId: user._id.toString(), 
      email: user.email, 
      role: user.role,
      academy_id: user.academyId?.toString() 
    });
    await user.addRefreshToken(tokens.refreshToken);
    user.lastLogin = new Date();
    await user.save();

    const response = NextResponse.json({ success: true, message: 'Login successful', data: { user: user.toJSON(), ...tokens } });
    response.cookies.set('gwd_token', tokens.accessToken, {
      httpOnly: false, // allow client-side reading if needed, or secure access
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
