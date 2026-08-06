import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware/auth';

export async function PUT(req: NextRequest) {
  try {
    const auth = await authMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    
    auth.user.isActive = false;
    await auth.user.save();
    return NextResponse.json({ success: true, message: 'Account deactivated successfully' });
  } catch (error: any) {
    console.error('[api/user/deactivate]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
