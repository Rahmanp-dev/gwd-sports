import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { getEngagementOverview } from '@/lib/admin/engagementOverview';

/**
 * Engagement summary for EVERY academy, worst first.
 *
 * The ordering is the product: the academies worth a phone call this week are
 * precisely the ones at the bottom of the score, and a name-sorted list buries
 * them.
 *
 * Previously this called `getAcademyInsights()` once per academy — ~17 queries
 * each, so ~1,700 round trips for a 100-academy page, growing linearly with
 * signups. `getEngagementOverview` does the same work in a fixed nine
 * aggregations grouped by academyId, so the cost no longer depends on how many
 * academies exist. The per-academy panel still uses the detailed function.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500);

    const data = await getEngagementOverview(limit);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[admin/academy-engagement]', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Could not load engagement data' },
      { status: 500 },
    );
  }
}
