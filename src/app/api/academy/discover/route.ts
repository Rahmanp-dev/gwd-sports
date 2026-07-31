import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ACTIVE } from '@/lib/models/activeFilter';
import Academy from '@/lib/models/Academy';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE PUBLIC ACADEMY DIRECTORY — /discover
 * ════════════════════════════════════════════════════════════════════════════
 *
 * WHAT WAS BROKEN. This route accepted no query parameters at all. The page
 * has always sent `search`, `sport`, `city`, `page` and `limit` — and every one
 * of them was discarded, so the search box, the sport chips, the city field and
 * the pager were decorative. Typing a name filtered nothing; picking "Cricket"
 * filtered nothing. The whole filter UI was a facade over an unfiltered list.
 *
 * It also returned the count as `stats.totalAcademies` while the page read
 * `data.total`, so the header permanently said "0 academies found" directly
 * above a grid of academies. That contradiction is the kind of thing a parent
 * reads as "this site is broken" — on the front door of the product.
 *
 * TWO SEPARATE QUERIES, ON PURPOSE. `stats` (the sport and city lists that
 * populate the filter controls) is computed across every active academy, not
 * across the filtered page. Deriving the chips from the filtered set would make
 * them disappear as soon as you used one — filter to Cricket and Football would
 * vanish from the picker, stranding you.
 *
 * `isActive: ACTIVE` rather than `isActive: true` — an academy created outside
 * mongoose has no `isActive` field, and `{ isActive: true }` does not match a
 * missing field. See lib/models/activeFilter.ts.
 * ════════════════════════════════════════════════════════════════════════════
 */

const MAX_LIMIT = 48;

/** A parent pasting an academy name with a bracket should search for it, not compile it. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const sport = (searchParams.get('sport') || '').trim().toLowerCase();
    const city = (searchParams.get('city') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12)
    );

    const query: Record<string, unknown> = { isActive: ACTIVE };

    if (search) {
      const rx = { $regex: escapeRegex(search), $options: 'i' };
      // Name or locality — a parent searches for whichever they happen to know.
      query.$or = [{ name: rx }, { location: rx }];
    }
    if (sport && sport !== 'all') {
      query.sports = { $regex: `^${escapeRegex(sport)}$`, $options: 'i' };
    }
    if (city) {
      query.location = { $regex: escapeRegex(city), $options: 'i' };
    }

    const projection =
      'name slug location sports coordinates ecosystemScore theme.primaryColor theme.logoUrl ' +
      'verificationStatus gwdFoundingAcademy establishedYear coachName achievements ' +
      'starPlayers registeredTeams students capacity';

    const [rows, total, everyActive] = await Promise.all([
      Academy.find(query)
        .select(projection)
        .sort({ ecosystemScore: -1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Academy.countDocuments(query),
      // Only the two fields the filter controls need, across the whole directory.
      Academy.find({ isActive: ACTIVE }).select('sports location').lean(),
    ]);

    const allSports = new Set<string>();
    const allCities = new Set<string>();
    (everyActive as any[]).forEach((a) => {
      a.sports?.forEach((s: string) => s && allSports.add(s));
      if (a.location) allCities.add(String(a.location).split(',')[0].trim());
    });

    const academies = (rows as any[]).map((a) => ({
      ...a,
      studentCount: a.students?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        academies,
        // Read by the page header. Previously absent, which is why it said 0.
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        stats: {
          // Kept for any existing caller; `total` above is the filtered count,
          // this one is the size of the whole directory.
          totalAcademies: (everyActive as any[]).length,
          totalSports: allSports.size,
          sports: Array.from(allSports).sort(),
          cities: Array.from(allCities).sort(),
          primaryCity: 'Hyderabad',
        },
      },
    });
  } catch (error) {
    console.error('[API_ACADEMY_DISCOVER]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
