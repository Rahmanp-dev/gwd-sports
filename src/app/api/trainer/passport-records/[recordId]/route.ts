import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { validateRecord, toPublicRecords } from '@/lib/passport/records';
import { resolvePassportForActor, canMutate } from '@/lib/passport/recordAccess';

/**
 * Edit or remove one passport record.
 *
 * Beyond the academy scoping every trainer route has, these two verbs carry an
 * extra check: canMutate(). A Passport travels with the child across academies,
 * so without it a coach at the academy a student moved TO could quietly rewrite
 * or delete the history recorded by the academy they came FROM. Records are
 * append-and-own.
 */

async function load(req: NextRequest, recordId: string, studentId: string) {
  const auth = await roleMiddleware(req, ['trainer', 'admin']);
  if (auth?.error) {
    return { error: NextResponse.json({ success: false, message: auth.error }, { status: auth.status }) };
  }
  await connectToDatabase();

  const actor = { userId: auth.user._id, role: auth.user.role, academyId: auth.academyId };
  const resolved = await resolvePassportForActor(studentId, actor);
  if (!resolved.ok) {
    return {
      error: NextResponse.json(
        { success: false, message: resolved.message },
        { status: resolved.status }
      ),
    };
  }

  const record = resolved.passport.records.id(recordId);
  if (!record) {
    return {
      error: NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 }),
    };
  }

  if (!canMutate(record, actor, resolved.academyId)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message:
            'This entry was recorded by another academy. You can see it, but only they can change it.',
        },
        { status: 403 }
      ),
    };
  }

  return { actor, resolved, record };
}

function projected(passport: any) {
  const rows = passport.records.map((r: any) =>
    typeof r.toObject === 'function' ? r.toObject() : r
  );
  return toPublicRecords(rows);
}

/** PATCH /api/trainer/passport-records/<recordId>  { studentId, ...record } */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params;
    const body = await req.json().catch(() => ({}));

    const loaded = await load(req, recordId, String(body.studentId ?? ''));
    if ('error' in loaded) return loaded.error;
    const { resolved, record } = loaded;

    // Full replacement of the editable surface — the form submits every field,
    // so a partial merge here would let a cleared optional value survive as the
    // old one and quietly contradict what the coach just saw themselves save.
    const validated = validateRecord(body);
    if (!validated.ok) {
      return NextResponse.json(
        { success: false, message: validated.reason, field: validated.field },
        { status: 400 }
      );
    }

    Object.assign(record, validated.record, { updatedAt: new Date() });
    await resolved.passport.save();

    return NextResponse.json({
      success: true,
      message: 'Passport record updated.',
      data: { records: projected(resolved.passport).map((r) => ({ ...r, canEdit: true })) },
    });
  } catch (error: any) {
    console.error('[trainer/passport-records PATCH]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/** DELETE /api/trainer/passport-records/<recordId>?studentId=<userId> */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params;
    const studentId = new URL(req.url).searchParams.get('studentId') ?? '';

    const loaded = await load(req, recordId, studentId);
    if ('error' in loaded) return loaded.error;
    const { resolved, record } = loaded;

    record.deleteOne();
    await resolved.passport.save();

    return NextResponse.json({
      success: true,
      message: 'Removed from the Sports Passport.',
      data: { records: projected(resolved.passport) },
    });
  } catch (error: any) {
    console.error('[trainer/passport-records DELETE]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
