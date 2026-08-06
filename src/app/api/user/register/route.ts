import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import { generateTokens } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { name, email, password, phone, role, sports, academyId } = await req.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 409 });
    }

    const user = new User({ name, email, password, phone, role: role || 'user', sports: sports || [], academyId: academyId || undefined });
    await user.save();

    const tokens = generateTokens({ 
      userId: user._id.toString(), 
      email: user.email, 
      role: user.role,
      academy_id: user.academyId?.toString() 
    });
    await user.addRefreshToken(tokens.refreshToken);

    return NextResponse.json({ success: true, message: 'User registered successfully', data: { user, ...tokens } }, { status: 201 });
  } catch (error: any) {
    console.error('[api/user/register]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
