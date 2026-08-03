import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import User from '@/lib/models/User';

/**
 * Activate or deactivate a user.
 *
 * This had the same three holes the PUT handler next door had, and they matter
 * more here because deactivation is a single click with no form in front of it:
 *
 *  · NO TENANT SCOPING — any academy admin could deactivate ANY user on the
 *    platform by id, including another academy's owner or a super admin. That
 *    is a one-request lockout of a competitor's account.
 *  · NO SELF-PROTECTION — an admin could deactivate themselves and be locked
 *    out of the dashboard they were standing in, with no way back.
 *  · NO LOGGING — every failure returned a bare 'Error', so a genuine fault
 *    and a bad id were indistinguishable in production.
 *
 * Scoping here is deliberately identical to PUT and DELETE in the parent route
 * rather than merely similar: three handlers with three subtly different rules
 * about who may touch whom is how the next hole gets introduced.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid user id' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    const isSuperAdmin = auth.user.role === 'gwd_super_admin';

    if (!isSuperAdmin) {
      if (!auth.academyId || String(user.academyId ?? '') !== String(auth.academyId)) {
        return NextResponse.json(
          { success: false, message: 'That user belongs to another academy' },
          { status: 403 },
        );
      }
      if (user.role === 'gwd_super_admin') {
        return NextResponse.json(
          { success: false, message: 'Cannot deactivate a platform administrator' },
          { status: 403 },
        );
      }
    }

    // Deactivating yourself ends your own session with no route back in.
    if (String(user._id) === String(auth.user._id)) {
      return NextResponse.json(
        { success: false, message: 'You cannot deactivate your own account' },
        { status: 400 },
      );
    }

    user.isActive = !user.isActive;
    await user.save();

    return NextResponse.json({
      success: true,
      message: user.isActive ? 'Account reactivated.' : 'Account deactivated.',
      data: { user },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_USERS_TOGGLE_STATUS]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
