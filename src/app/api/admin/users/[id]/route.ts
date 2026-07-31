import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import User from '@/lib/models/User';
import { deleteUserCascade } from '@/lib/auth/deleteUserCascade';
import {
  pickWritable,
  normaliseIdentity,
  diffIdentity,
} from '@/lib/users/identityChange';
import { applyIdentityChange } from '@/lib/users/applyIdentityChange';

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

/**
 * Edit a user.
 *
 * This handler previously took the request body wholesale, dropped `password`
 * and `refreshTokens`, and `$set` the remainder. That allowed three things:
 *
 *  · Privilege escalation — `role` was writable, so any academy admin could
 *    make themselves `gwd_super_admin` with one request.
 *  · Cross-tenant editing — unlike DELETE below, there was no academy check at
 *    all, so any admin could edit any user on the platform by id.
 *  · Silent desynchronisation — changing a phone touched only the User, while
 *    attendance, reminders, digests and the Passport identity key all read
 *    copies elsewhere. See lib/users/identityChange.ts.
 *
 * All three are handled here now: an allowlist keyed on the caller's role,
 * the same tenant scoping DELETE uses, and a cascade that moves every copy of
 * the phone together or fails without writing anything.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid user id' }, { status: 400 });
    }

    const target = await User.findById(id).select('_id role academyId name email phone');
    if (!target) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    const isSuperAdmin = auth.user.role === 'gwd_super_admin';

    // Same scoping as DELETE. An academy admin may only touch their own people.
    if (!isSuperAdmin) {
      if (!auth.academyId || String(target.academyId ?? '') !== String(auth.academyId)) {
        return NextResponse.json(
          { success: false, message: 'That user belongs to another academy' },
          { status: 403 },
        );
      }
      if (target.role === 'gwd_super_admin') {
        return NextResponse.json(
          { success: false, message: 'Cannot edit a platform administrator' },
          { status: 403 },
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const { updates, rejected } = pickWritable(body, auth.user.role);

    /**
     * The edit form posts every field it renders, including ones this actor
     * cannot write — an academy admin's form still echoes `role` back
     * unchanged. Warning about those would fire on every single save and train
     * people to ignore the warning.
     *
     * So only report a refused field when its value actually DIFFERS from what
     * is stored. That is the case where the admin genuinely tried to change
     * something and it did not happen, which is the only case worth telling
     * them about.
     */
    const attempted = rejected.filter((key) => {
      const incoming = (body as Record<string, unknown>)[key];
      const stored = (target as unknown as Record<string, unknown>)[key];
      if (incoming === undefined) return false;
      return String(incoming ?? '') !== String(stored ?? '');
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: rejected.length
            ? `None of those fields can be edited here: ${rejected.join(', ')}.`
            : 'Nothing to update.',
        },
        { status: 400 },
      );
    }

    const normalised = normaliseIdentity(updates);
    if (!normalised.ok) {
      return NextResponse.json(
        {
          success: false,
          message: normalised.errors[0].reason,
          field: normalised.errors[0].field,
          errors: normalised.errors,
        },
        { status: 400 },
      );
    }

    // Demoting yourself out of admin, or deactivating yourself, locks you out
    // of the dashboard you are standing in.
    if (String(target._id) === String(auth.user._id)) {
      if (normalised.value.role !== undefined && normalised.value.role !== target.role) {
        return NextResponse.json(
          { success: false, message: 'You cannot change your own role' },
          { status: 400 },
        );
      }
      if (normalised.value.isActive === false) {
        return NextResponse.json(
          { success: false, message: 'You cannot deactivate your own account' },
          { status: 400 },
        );
      }
    }

    const diff = diffIdentity(target, normalised.value);
    const result = await applyIdentityChange(id, normalised.value, diff);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message, field: result.field },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      // Named so the UI can say what else moved — an admin changing a phone
      // should be told the passports followed, not left guessing.
      message:
        result.propagated.length > 1
          ? `Updated, and synced across ${result.propagated.slice(1).join(' and ')}.`
          : 'Updated.',
      data: { user: result.user, propagated: result.propagated, ignoredFields: attempted },
    });
  } catch (error: any) {
    console.error('[API_ADMIN_USERS_PUT]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
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
