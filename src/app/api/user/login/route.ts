import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateTokens } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user) return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });

    /**
     * Imported accounts CAN log in — the import issues each one a real, random
     * password that the parent receives in their welcome message.
     *
     * This deliberately no longer blocks here. `isImportedPlaceholder` now means
     * only "the email address is synthetic and cannot receive mail", which is
     * why forgot-password still refuses these accounts: there is no mailbox to
     * send a reset to. Login is protected by the password itself, exactly like
     * any other account.
     */
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
    console.error('[api/user/login]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
