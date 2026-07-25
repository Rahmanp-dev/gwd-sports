import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import { getImportJobForAcademy } from '@/lib/import/commit';
import { revalidateRow } from '@/lib/import/flags';
import { summarise } from '@/lib/import/summarise';

/**
 * Step 2 of the import wizard: read and edit the staged rows.
 *
 * Still writes nothing to the student collections — edits land on the ImportJob
 * only. Persisting the owner's edits here rather than holding them in browser
 * state means a reload part-way through reviewing 60 handwritten rows does not
 * lose their work, and the OCR call is never repeated.
 */

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { jobId } = await context.params;
    const job = await getImportJobForAcademy(
      jobId,
      auth.academyId,
      auth.user.role === 'gwd_super_admin'
    );
    if (!job) {
      return NextResponse.json({ success: false, message: 'Import job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: String(job._id),
        method: job.method,
        status: job.status,
        rows: job.rows,
        counts: summarise(job.rows),
        summary: job.summary,
        committedAt: job.committedAt,
      },
    });
  } catch (error: any) {
    console.error('[import/get]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * Applies the owner's edits to staged rows.
 *
 * Body: { rows: [{ index, name?, mobileNumber?, parentName?, sportOrBatch?,
 *                  feeAmount?, status? }], defaultSport? }
 *
 * Only the listed rows are touched, addressed by their stable `index`. Editing a
 * row re-runs validation on it, so a corrected phone number clears its flag
 * immediately and the owner can see the ready count climb as they work.
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { jobId } = await context.params;
    const job = await getImportJobForAcademy(
      jobId,
      auth.academyId,
      auth.user.role === 'gwd_super_admin'
    );
    if (!job) {
      return NextResponse.json({ success: false, message: 'Import job not found' }, { status: 404 });
    }

    if (job.status === 'committed') {
      return NextResponse.json(
        { success: false, message: 'This import has already been committed and cannot be edited.' },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const edits: any[] = Array.isArray(body.rows) ? body.rows : [];
    if (edits.length === 0) {
      return NextResponse.json({ success: false, message: 'No row edits supplied' }, { status: 400 });
    }

    const byIndex = new Map(job.rows.map((row) => [row.index, row]));
    let applied = 0;

    for (const edit of edits) {
      const row = byIndex.get(Number(edit.index));
      if (!row) continue;
      // A row already written to the database is not editable here.
      if (row.status === 'created') continue;

      if ('name' in edit) row.name = emptyToNull(edit.name);
      if ('mobileNumber' in edit) row.mobileNumber = emptyToNull(edit.mobileNumber);
      if ('parentName' in edit) row.parentName = emptyToNull(edit.parentName);
      if ('sportOrBatch' in edit) row.sportOrBatch = emptyToNull(edit.sportOrBatch);
      if ('feeAmount' in edit) {
        const parsed = edit.feeAmount === null || edit.feeAmount === '' ? null : Number(edit.feeAmount);
        row.feeAmount = parsed !== null && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
      }

      // The owner explicitly including or excluding a row overrides validation
      // status, except that an incomplete row can never be forced to 'ready'.
      if (edit.status === 'skipped') {
        row.status = 'skipped';
        row.editedByOwner = true;
        applied++;
        continue;
      }

      revalidateRow(row, body.defaultSport ?? null);
      applied++;
    }

    job.markModified('rows');
    await job.save();

    return NextResponse.json({
      success: true,
      data: { applied, rows: job.rows, counts: summarise(job.rows) },
    });
  } catch (error: any) {
    console.error('[import/patch]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/** Discards a staged import the owner abandoned. */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { jobId } = await context.params;
    const job = await getImportJobForAcademy(
      jobId,
      auth.academyId,
      auth.user.role === 'gwd_super_admin'
    );
    if (!job) {
      return NextResponse.json({ success: false, message: 'Import job not found' }, { status: 404 });
    }
    if (job.status === 'committed') {
      return NextResponse.json(
        {
          success: false,
          message:
            'This import has been committed. Deleting the job would not remove the imported ' +
            'students — remove them from the students list instead.',
        },
        { status: 409 }
      );
    }

    await job.deleteOne();
    return NextResponse.json({ success: true, message: 'Import discarded' });
  } catch (error: any) {
    console.error('[import/delete]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

function emptyToNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
