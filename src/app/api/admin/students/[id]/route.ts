import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';

/**
 * Read one student profile.
 *
 * The PUT below has careful tenant isolation. This GET had none — any academy
 * admin could read ANY student on the platform by id, and the populate makes
 * that a substantial disclosure rather than a trivial one: the response carries
 * the family's `parentPhone`, the student's full `attendance` and
 * `feePayments` history, and the populated `userId` with their email and phone.
 * A competitor's roster and their families' contact details, one request at a
 * time.
 *
 * Scoped identically to the PUT. A student at another academy now reads as
 * "not found", indistinguishable from one that does not exist, so the endpoint
 * cannot be used to probe which ids are real.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid student id' }, { status: 400 });
    }

    const filter: Record<string, unknown> = { _id: id };
    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'No academy assigned to your account' },
          { status: 403 },
        );
      }
      filter.academyId = auth.academyId;
    }

    const student = await StudentProfile.findOne(filter).populate('userId academyId trainers');
    if (!student) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { student } });
  } catch (error: any) {
    console.error('[admin/students GET]', error?.message || error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const body = await req.json().catch(() => ({}));

    /**
     * ════════════════════════════════════════════════════════════════════════
     * EXPLICIT FIELD MAPPING, NOT `findByIdAndUpdate(id, body)`
     * ════════════════════════════════════════════════════════════════════════
     *
     * This used to pass the request body straight through, which was wrong in
     * two ways at once:
     *
     *  1. **It 500'd.** The edit form sends the shape in `StudentUpdateData`,
     *     which does not match the schema — `sport` (singular) vs `sports` (an
     *     array), and a nested `fees` object vs flat `feeAmount`/`feePeriod`.
     *     Casting a string into a string[] path threw a CastError, and the
     *     catch block reported it as the word "Error" with no logging, so the
     *     real cause never reached anyone.
     *
     *  2. **Even when it did not throw, it silently dropped edits.** Mongoose
     *     ignores unknown paths in strict mode, so `sport` and `fees` were
     *     accepted, discarded, and reported as a successful save. An owner
     *     changing a student's fee saw "updated successfully" and nothing
     *     changed.
     *
     * Mapping explicitly also closes the mass-assignment hole: the body could
     * previously set `passportId`, `attendance`, `feePayments` or `academyId`
     * on any student.
     * ════════════════════════════════════════════════════════════════════════
     */
    const updates: Record<string, unknown> = {};

    if (typeof body.level === 'string') updates.level = body.level;

    // The form field is singular; the schema stores an array.
    if (typeof body.sport === 'string' && body.sport.trim()) {
      updates.sports = [body.sport.trim().toLowerCase()];
    } else if (Array.isArray(body.sports)) {
      updates.sports = body.sports
        .filter((s: unknown) => typeof s === 'string' && s.trim())
        .map((s: string) => s.trim().toLowerCase());
    }

    // Flattened out of the form's nested `fees` object.
    const feeAmount = body.fees?.amount ?? body.feeAmount;
    if (feeAmount !== undefined && feeAmount !== null && feeAmount !== '') {
      const amount = Number(feeAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json(
          { success: false, message: 'Fee amount must be zero or more.' },
          { status: 400 }
        );
      }
      updates.feeAmount = amount;
    }

    const feePeriod = body.fees?.period ?? body.feePeriod;
    if (typeof feePeriod === 'string') {
      const allowed = ['monthly', 'quarterly', 'halfYearly', 'yearly'];
      // The form offers "yearly" where the schema also knows "halfYearly".
      if (!allowed.includes(feePeriod)) {
        return NextResponse.json(
          { success: false, message: `Fee period must be one of: ${allowed.join(', ')}.` },
          { status: 400 }
        );
      }
      updates.feePeriod = feePeriod;
    }

    if (typeof body.parentName === 'string') updates.parentName = body.parentName.trim();
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;

    /**
     * Moving a student between academies is a transfer with passport
     * consequences, not a field edit — and a non-super admin must never be able
     * to move a student INTO or OUT of their tenant by editing a form.
     */
    if (body.academyId && auth.user.role === 'gwd_super_admin') {
      updates.academyId = body.academyId;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nothing to update.' },
        { status: 400 }
      );
    }

    // Tenant isolation: an academy admin may only edit their own students.
    const filter: Record<string, unknown> = { _id: id };
    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'No academy assigned to your account' },
          { status: 403 }
        );
      }
      filter.academyId = auth.academyId;
    }

    const student = await StudentProfile.findOneAndUpdate(
      filter,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { student } });
  } catch (error: any) {
    console.error('[admin/students PUT]', {
      name: error?.name,
      message: error?.message,
    });
    return NextResponse.json(
      { success: false, message: error?.message || 'Could not update this student' },
      { status: 500 }
    );
  }
}
