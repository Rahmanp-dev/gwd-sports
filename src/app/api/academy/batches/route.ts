import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import Batch from '@/lib/models/Batch';
import StudentProfile from '@/lib/models/Student';
import TrainerProfile from '@/lib/models/Trainer';
import { validateSchedule, scheduleGaps } from '@/lib/attendance/schedule';

/**
 * Batch management, and specifically the SCHEDULE.
 *
 * The bulk import creates a batch per sport with a name and nothing else — no
 * days, no times, no coaches. That was fine until Phase 3, because nothing read
 * those fields. Now they compute the QR check-in window, so an unscheduled
 * batch has a printed code that is accepted almost any hour of any day. Until
 * this screen existed there was no way to fix that outside the database.
 */

/** Batch names are printed on posters; a long one is a layout problem. */
const MAX_NAME_LENGTH = 80;

function tenantFilter(auth: any, extra: Record<string, unknown> = {}) {
  const filter: Record<string, unknown> = { ...extra };
  if (auth.user.role !== 'gwd_super_admin') {
    filter.academyId = auth.academyId;
  }
  return filter;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const isSuperAdmin = auth.user.role === 'gwd_super_admin';
    if (!isSuperAdmin && !auth.academyId) {
      return NextResponse.json(
        { success: false, message: 'Your account is not linked to an academy.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const filter = tenantFilter(auth, includeInactive ? {} : { isActive: true });
    const batches = await Batch.find(filter)
      .sort({ name: 1 })
      .populate({ path: 'coaches', select: 'name' })
      .lean();

    // One grouped count rather than a query per batch.
    const counts = await StudentProfile.aggregate([
      { $match: { batchId: { $in: (batches as any[]).map((b) => b._id) }, isActive: true } },
      { $group: { _id: '$batchId', count: { $sum: 1 } } },
    ]);
    const sizeByBatch = new Map(
      (counts as { _id: any; count: number }[]).map((row) => [String(row._id), row.count])
    );

    /**
     * The coaches available to assign. Returned alongside the batches so the
     * editor is one request — an admin opening a batch to set its schedule
     * should not wait on a second round trip to populate a dropdown.
     */
    const trainers = await TrainerProfile.find(
      tenantFilter(auth, { isActive: true })
    )
      .select('userId')
      .populate({ path: 'userId', select: 'name' })
      .lean();

    const coachOptions = (trainers as any[])
      .filter((trainer) => trainer.userId)
      .map((trainer) => ({
        _id: String(trainer.userId._id ?? trainer.userId),
        name: trainer.userId.name ?? 'Unnamed coach',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const rows = (batches as any[]).map((batch) => ({
      _id: String(batch._id),
      name: batch.name,
      sport: batch.sport,
      daysOfWeek: batch.daysOfWeek ?? [],
      startTime: batch.startTime ?? null,
      endTime: batch.endTime ?? null,
      coaches: (batch.coaches ?? []).map((coach: any) => ({
        _id: String(coach._id ?? coach),
        name: coach.name ?? 'Unnamed coach',
      })),
      studentCount: sizeByBatch.get(String(batch._id)) ?? 0,
      hasQrCode: Boolean(batch.qrToken),
      isActive: batch.isActive !== false,
      // Computed server-side so the warning cannot disagree with the window the
      // check-in endpoint actually enforces.
      scheduleGaps: scheduleGaps(batch),
    }));

    return NextResponse.json({
      success: true,
      data: {
        batches: rows,
        coachOptions,
        unscheduledCount: rows.filter((b) => b.isActive && b.scheduleGaps.length > 0).length,
      },
    });
  } catch (error: any) {
    console.error('[academy/batches GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/** Validates the coach ids actually belong to this academy. */
async function resolveCoaches(auth: any, coachIds: unknown): Promise<string[] | { error: string }> {
  if (coachIds === undefined || coachIds === null) return [];
  if (!Array.isArray(coachIds)) return { error: 'coaches must be a list of trainer ids.' };

  const ids = coachIds.map(String).filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (ids.length === 0) return [];

  // Scoped to the tenant, so a coach at another academy cannot be assigned by
  // supplying their id — which would let them mark that batch's register.
  const trainers = await TrainerProfile.find(
    tenantFilter(auth, { userId: { $in: ids }, isActive: true })
  )
    .select('userId')
    .lean();

  const valid = new Set((trainers as any[]).map((t) => String(t.userId)));
  const rejected = ids.filter((id) => !valid.has(id));
  if (rejected.length > 0) {
    return { error: 'One or more selected coaches are not trainers at this academy.' };
  }
  return ids;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const academyId = auth.academyId;
    if (!academyId) {
      return NextResponse.json(
        { success: false, message: 'A batch belongs to one academy. Your account is not linked to one.' },
        { status: 403 }
      );
    }

    const payload = await req.json().catch(() => ({}));

    const name = String(payload?.name ?? '').trim();
    const sport = String(payload?.sport ?? '').trim().toLowerCase();
    if (!name || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, message: `A batch name is required, up to ${MAX_NAME_LENGTH} characters.` },
        { status: 400 }
      );
    }
    if (!sport) {
      return NextResponse.json({ success: false, message: 'A sport is required.' }, { status: 400 });
    }

    const validated = validateSchedule(payload);
    if (!validated.ok) {
      return NextResponse.json({ success: false, message: validated.reason }, { status: 400 });
    }

    const coaches = await resolveCoaches(auth, payload?.coaches);
    if ('error' in coaches) {
      return NextResponse.json({ success: false, message: coaches.error }, { status: 400 });
    }

    try {
      const batch = await Batch.create({
        academyId,
        name,
        sport,
        coaches,
        ...validated.schedule,
        isActive: true,
      });
      return NextResponse.json({ success: true, data: { batchId: String(batch._id) } });
    } catch (err: any) {
      console.error('[api/academy/batches]', err instanceof Error ? err.message : err);
      // The unique index on (academyId, name, sport). Reported as a conflict
      // rather than a server error, because the admin can act on it.
      if (err?.code === 11000) {
        return NextResponse.json(
          { success: false, message: `A ${sport} batch called "${name}" already exists.` },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error: any) {
    console.error('[academy/batches POST]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * Edit a batch.
 *
 * Only the supplied fields change — a request setting `daysOfWeek` alone must
 * not clear the times, or an admin fixing one half of a schedule would silently
 * destroy the other.
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const payload = await req.json().catch(() => ({}));
    const batchId = payload?.batchId;
    if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
      return NextResponse.json(
        { success: false, message: 'A valid batchId is required' },
        { status: 400 }
      );
    }

    const batch = await Batch.findOne(tenantFilter(auth, { _id: batchId }));
    if (!batch) {
      return NextResponse.json({ success: false, message: 'Batch not found' }, { status: 404 });
    }

    if (payload.name !== undefined) {
      const name = String(payload.name).trim();
      if (!name || name.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { success: false, message: `A batch name is required, up to ${MAX_NAME_LENGTH} characters.` },
          { status: 400 }
        );
      }
      batch.name = name;
    }

    if (payload.sport !== undefined) {
      const sport = String(payload.sport).trim().toLowerCase();
      if (!sport) {
        return NextResponse.json({ success: false, message: 'A sport is required.' }, { status: 400 });
      }
      batch.sport = sport;
    }

    // The schedule is validated as a unit, because its rules are relational —
    // an end time is only wrong relative to a start time.
    const touchesSchedule =
      payload.daysOfWeek !== undefined ||
      payload.startTime !== undefined ||
      payload.endTime !== undefined;

    if (touchesSchedule) {
      const validated = validateSchedule({
        daysOfWeek: payload.daysOfWeek !== undefined ? payload.daysOfWeek : batch.daysOfWeek,
        startTime: payload.startTime !== undefined ? payload.startTime : batch.startTime,
        endTime: payload.endTime !== undefined ? payload.endTime : batch.endTime,
      });
      if (!validated.ok) {
        return NextResponse.json({ success: false, message: validated.reason }, { status: 400 });
      }
      batch.daysOfWeek = validated.schedule.daysOfWeek as any;
      batch.startTime = validated.schedule.startTime ?? undefined;
      batch.endTime = validated.schedule.endTime ?? undefined;
    }

    if (payload.coaches !== undefined) {
      const coaches = await resolveCoaches(auth, payload.coaches);
      if ('error' in coaches) {
        return NextResponse.json({ success: false, message: coaches.error }, { status: 400 });
      }
      batch.coaches = coaches as any;
    }

    /**
     * Deactivation is a soft delete and stops here deliberately. Students keep
     * their batchId and their attendance history keeps its sessionIds — a
     * hard delete would orphan every past register. It does mean the QR code
     * stops resolving, which is the intended effect.
     */
    if (payload.isActive !== undefined) {
      batch.isActive = Boolean(payload.isActive);
    }

    try {
      await batch.save();
    } catch (err: any) {
      console.error('[api/academy/batches]', err instanceof Error ? err.message : err);
      if (err?.code === 11000) {
        return NextResponse.json(
          { success: false, message: `A ${batch.sport} batch called "${batch.name}" already exists.` },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      data: {
        batchId: String(batch._id),
        scheduleGaps: scheduleGaps(batch.toObject()),
      },
    });
  } catch (error: any) {
    console.error('[academy/batches PATCH]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
