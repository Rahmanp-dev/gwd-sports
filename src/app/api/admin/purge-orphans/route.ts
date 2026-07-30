import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { purgeOrphanedProfiles } from '@/lib/auth/deleteUserCascade';

/**
 * Clears StudentProfile/TrainerProfile rows whose user no longer exists.
 *
 * `deleteUserCascade` stops NEW orphans being created, but every user deleted
 * before it existed left debris behind — rows that crash admin lists, inflate
 * headcounts and make a deleted student reappear on re-import. The repair
 * function was written and then never called from anywhere, so the debris it
 * exists to clear was still sitting in the database.
 *
 * GET reports what would be removed; POST removes it. Splitting them matters
 * for something destructive: nobody should have to run a deletion to find out
 * its scope.
 *
 * Super admin only. It deletes across every tenant.
 */
export async function GET(req: NextRequest) {
  return handle(req, { dryRun: true });
}

export async function POST(req: NextRequest) {
  return handle(req, { dryRun: false });
}

async function handle(req: NextRequest, { dryRun }: { dryRun: boolean }) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const result = await purgeOrphanedProfiles(undefined, { dryRun });

    return NextResponse.json({
      success: true,
      data: {
        dryRun,
        ...result,
        message: dryRun
          ? `${result.students} student and ${result.trainers} trainer profile(s) have no user. POST to remove them.`
          : `Removed ${result.students} student and ${result.trainers} orphaned trainer profile(s).`,
      },
    });
  } catch (error: any) {
    console.error('[admin/purge-orphans]', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Could not purge orphaned profiles' },
      { status: 500 },
    );
  }
}
