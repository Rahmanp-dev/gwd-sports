import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import { getImportJobForAcademy, commitImportJob } from '@/lib/import/commit';
import { summarise } from '../../extract/route';

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

/**
 * Step 3 of the import wizard: the owner's explicit confirmation.
 *
 * THIS IS THE ONLY ENDPOINT IN THE IMPORT FLOW THAT CREATES STUDENT RECORDS.
 * Everything before it operates on the staged ImportJob, so an owner can extract,
 * review, edit and abandon without a single student, user or passport being
 * written.
 *
 * Emits one student.created event per created student, which is the interface
 * Phase 2's welcome message consumes.
 */
export async function POST(req: NextRequest, context: RouteContext) {
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
      // Idempotent from the caller's point of view: a double-click on Confirm
      // must not import everyone twice.
      return NextResponse.json({
        success: true,
        message: 'This import was already committed.',
        data: { alreadyCommitted: true, summary: job.summary, counts: summarise(job.rows) },
      });
    }

    if (job.status === 'committing') {
      return NextResponse.json(
        { success: false, message: 'This import is currently being committed.' },
        { status: 409 }
      );
    }

    const committable = job.rows.filter(
      (row) => row.status === 'ready' && row.name && row.normalizedPhone && row.sportOrBatch
    );

    if (committable.length === 0) {
      const needsReview = job.rows.filter((row) => row.status === 'needs_review').length;
      return NextResponse.json(
        {
          success: false,
          message:
            needsReview > 0
              ? `No rows are ready to import. ${needsReview} still need a name, parent mobile ` +
                `number or sport, or need a duplicate resolved.`
              : 'No rows are ready to import.',
          data: { counts: summarise(job.rows) },
        },
        { status: 422 }
      );
    }

    const result = await commitImportJob(job, auth.user._id);

    return NextResponse.json({
      success: true,
      message: `Imported ${result.created} student${result.created === 1 ? '' : 's'}.`,
      data: {
        ...result,
        counts: summarise(job.rows),
        rows: job.rows,
      },
    });
  } catch (error: any) {
    console.error('[import/commit]', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Import failed' },
      { status: 500 }
    );
  }
}
