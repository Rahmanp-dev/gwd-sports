import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { Academy } from '@/lib/models/Academy';
import { getAcademyInsights, type AcademyInsights } from '@/lib/admin/academyInsights';

/**
 * Engagement summary for EVERY academy, worst first.
 *
 * The ordering is the product: a list sorted by name tells GWD nothing, and
 * the academies worth a phone call this week are precisely the ones at the
 * bottom of the engagement score. Sorting ascending puts them on screen
 * without anyone having to hunt.
 *
 * Capped at 100 academies. The per-academy insight runs ~17 queries, so this
 * is genuinely expensive; when the platform outgrows one page of academies
 * this needs a materialised nightly rollup rather than a bigger limit.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();

    const ids = await Academy.find().select('_id').limit(100).lean<{ _id: any }[]>();

    const settled = await Promise.all(
      ids.map(async (row) => {
        try {
          return await getAcademyInsights(String(row._id));
        } catch (err: any) {
          // One malformed academy must not blank the whole dashboard.
          console.error(`[admin/engagement] ${row._id} failed:`, err?.message || err);
          return null;
        }
      }),
    );

    const academies = settled.filter((x): x is AcademyInsights => x !== null);
    academies.sort((a, b) => a.engagement.score - b.engagement.score);

    const bands = academies.reduce<Record<string, number>>((acc, a) => {
      acc[a.engagement.band] = (acc[a.engagement.band] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        academies,
        summary: {
          total: academies.length,
          dormant: bands.dormant ?? 0,
          atRisk: bands.at_risk ?? 0,
          healthy: bands.healthy ?? 0,
          thriving: bands.thriving ?? 0,
        },
      },
    });
  } catch (error: any) {
    console.error('[admin/engagement] failed:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Could not load engagement data' },
      { status: 500 },
    );
  }
}
