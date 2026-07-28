import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import User from '@/lib/models/User';
import { deleteUserCascade } from '@/lib/auth/deleteUserCascade';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();
    
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const updates = await req.json();
    delete updates.password;
    delete updates.refreshTokens;

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const target = await User.findById(id).select('_id role academyId');
    if (!target) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    const isSuperAdmin = auth.user.role === 'gwd_super_admin';

    /**
     * This handler had NO authorisation beyond "you are an admin" — any
     * academy admin could delete ANY user on the platform by id, including
     * another academy's owner or a super admin.
     */
    if (!isSuperAdmin) {
      if (!auth.academyId || String(target.academyId ?? '') !== String(auth.academyId)) {
        return NextResponse.json(
          { success: false, message: 'That user belongs to another academy' },
          { status: 403 },
        );
      }
      if (target.role === 'gwd_super_admin') {
        return NextResponse.json(
          { success: false, message: 'Cannot delete a platform administrator' },
          { status: 403 },
        );
      }
    }

    // Deleting yourself leaves an academy with no way back in.
    if (String(target._id) === String(auth.user._id)) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account' },
        { status: 400 },
      );
    }

    // Removes the profiles, roster entries and passport links that used to be
    // left dangling — see lib/auth/deleteUserCascade for what survives and why.
    const cascade = await deleteUserCascade(id);

    return NextResponse.json({ success: true, message: 'Deleted', data: cascade });
  } catch (error) {
    console.error('[API_ADMIN_USERS_DELETE]', error);
    return NextResponse.json({ success: false, message: 'Error' }, { status: 500 });
  }
}
