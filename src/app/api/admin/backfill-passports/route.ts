import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import User from '@/lib/models/User';
import { ensureStudentPassport } from '@/lib/auth/ensurePassport';
import { normalizePhone } from '@/lib/phone';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * REPAIR STUDENTS WHO HAVE NO SPORTS PASSPORT
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `ensureStudentPassport` already self-heals on profile read, so an affected
 * student repairs themselves the next time they open the portal. That is the
 * right mechanism and it stays — but it has two gaps this endpoint closes.
 *
 * FIRST, it only fires when the student logs in. An account created before the
 * self-heal existed sits broken until its owner happens to sign in, and until
 * then the "My Passport" button is simply absent from their dashboard with
 * nothing to explain the absence. An owner who has just been told the feature
 * exists cannot see it for half their roster and has no way to act.
 *
 * SECOND, and worse, some students CANNOT self-heal. Passport creation needs a
 * phone that normalises to a valid Indian mobile; `requirePhone` throws on
 * anything else and `ensureStudentPassport` swallows it — deliberately, because
 * a bad number on one account must not break the profile read that triggered
 * it. The effect is a student who is permanently passport-less and a log line
 * nobody reads. This endpoint surfaces exactly those, by name, with the number
 * that is wrong, so the owner can correct it (which now cascades properly — see
 * lib/users/identityChange.ts).
 *
 * GET  reports. POST repairs. Nothing is written on GET, because an owner
 * should be able to see the scope of a repair before running it.
 * ════════════════════════════════════════════════════════════════════════════
 */

interface Blocked {
  studentProfileId: string;
  name: string;
  email: string | null;
  reason: string;
  phoneOnFile: string | null;
}

async function survey(academyId: string | null) {
  const filter: Record<string, unknown> = {
    $or: [{ passportId: null }, { passportId: { $exists: false } }, { passportId: '' }],
  };
  if (academyId) filter.academyId = academyId;

  const profiles = await StudentProfile.find(filter)
    .select('_id userId academyId parentPhone')
    .lean<any[]>();

  const users = await User.find({ _id: { $in: profiles.map((p) => p.userId) } })
    .select('name email phone')
    .lean<any[]>();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  const repairable: string[] = [];
  const blocked: Blocked[] = [];

  for (const profile of profiles) {
    const user = byId.get(String(profile.userId));
    const raw = profile.parentPhone || user?.phone || null;
    const parsed = raw ? normalizePhone(raw) : null;

    if (!user) {
      blocked.push({
        studentProfileId: String(profile._id),
        name: '(orphaned profile — no user)',
        email: null,
        reason: 'The account this profile belongs to no longer exists.',
        phoneOnFile: raw,
      });
    } else if (!raw) {
      blocked.push({
        studentProfileId: String(profile._id),
        name: user.name,
        email: user.email ?? null,
        reason: 'No phone number on the account or the profile. A Passport needs one.',
        phoneOnFile: null,
      });
    } else if (!parsed) {
      blocked.push({
        studentProfileId: String(profile._id),
        name: user.name,
        email: user.email ?? null,
        reason: 'The number on file is not a valid Indian mobile, so a Passport cannot be issued.',
        phoneOnFile: raw,
      });
    } else {
      repairable.push(String(profile._id));
    }
  }

  return { total: profiles.length, repairable, blocked };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const isSuperAdmin = auth.user.role === 'gwd_super_admin';
    const scope = isSuperAdmin ? null : String(auth.academyId ?? '');
    if (!isSuperAdmin && !scope) {
      return NextResponse.json(
        { success: false, message: 'No academy assigned to your account' },
        { status: 403 },
      );
    }

    const { total, repairable, blocked } = await survey(scope);

    return NextResponse.json({
      success: true,
      data: {
        withoutPassport: total,
        canRepair: repairable.length,
        needsAttention: blocked,
        scope: isSuperAdmin ? 'platform' : 'academy',
      },
    });
  } catch (error: any) {
    console.error('[admin/backfill-passports GET]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const isSuperAdmin = auth.user.role === 'gwd_super_admin';
    const scope = isSuperAdmin ? null : String(auth.academyId ?? '');
    if (!isSuperAdmin && !scope) {
      return NextResponse.json(
        { success: false, message: 'No academy assigned to your account' },
        { status: 403 },
      );
    }

    const { repairable, blocked } = await survey(scope);

    /**
     * Sequential on purpose. `findOrCreatePassport` enforces one identity per
     * (parent phone, student name) through a unique index; running these in
     * parallel would have siblings racing for the same key and losing to a
     * duplicate-key error rather than correctly reusing the existing passport.
     */
    const repaired: { name: string; passportId: string }[] = [];
    const failed: { studentProfileId: string; reason: string }[] = [];

    for (const id of repairable) {
      await ensureStudentPassport(id);
      const after = await StudentProfile.findById(id).select('passportId userId').lean<any>();
      if (after?.passportId) {
        const user = await User.findById(after.userId).select('name').lean<any>();
        repaired.push({ name: user?.name ?? 'Student', passportId: after.passportId });
      } else {
        // ensureStudentPassport logs and swallows its own errors, so a profile
        // that still has no passport after the call failed for a reason only
        // the server log holds. Reported rather than counted as success.
        failed.push({
          studentProfileId: id,
          reason: 'Passport could not be issued. Check the server log for this profile.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        repaired.length > 0
          ? `Issued ${repaired.length} Sports Passport(s).`
          : 'No passports could be issued.',
      data: { repaired, failed, needsAttention: blocked },
    });
  } catch (error: any) {
    console.error('[admin/backfill-passports POST]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
