import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/lib/models/User';
import { sendPasswordResetEmail } from '@/lib/email';
import { isPlaceholderAccount } from '@/lib/auth/placeholder';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: 'Email required' }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    /**
     * THE PATH THIS GUARD EXISTS FOR. An imported student's address is derived
     * from their PUBLIC passport id, so anyone holding that id can construct it
     * and ask for a reset. Without this, a token would be minted and stored for
     * an account nobody owns. Returns the same success message as every other
     * branch, so it stays non-enumerable.
     */
    if (isPlaceholderAccount(user)) {
      return NextResponse.json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken, baseUrl });

    return NextResponse.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
