import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Passport from '@/lib/models/Passport';
import StudentProfile from '@/lib/models/Student';
import Academy from '@/lib/models/Academy';
import Achievement from '@/lib/models/Achievement';
import { recordParentEngagement } from '@/lib/passport';
import { toPublicPassport } from '@/lib/passport-public';

/**
 * The public Sports Passport.
 *
 * DELIBERATELY UNAUTHENTICATED. This URL is sent over WhatsApp to a parent who
 * has no account and, on the day their academy onboards, no reason to make one.
 * A login wall here would defeat the entire activation funnel that Phase 1's
 * dashboard measures — and would make the welcome message's central promise
 * ("view your child's Passport") a dead end.
 *
 * What that costs is handled in lib/passport-public.ts: the response is an
 * explicit whitelist, so a forwarded link discloses a child's training record
 * and nothing about their family, their fees or their health.
 *
 * This route is also the ONLY caller of recordParentEngagement(). That function
 * has existed since Phase 1 and, until this page, had none — which is why the
 * activation dashboard could never report anything but 0% engaged.
 */

/** Matches the generator's alphabet: no 0/1/I/L/O/U, so no ambiguous glyphs. */
const PASSPORT_ID_PATTERN = /^GWD-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ passportId: string }> }
) {
  try {
    const { passportId: raw } = await params;
    const passportId = String(raw ?? '').toUpperCase().trim();

    // Shape-checked before hitting the database, so a scanner spraying random
    // paths costs a regex rather than a query.
    if (!PASSPORT_ID_PATTERN.test(passportId)) {
      return NextResponse.json(
        { success: false, message: 'That does not look like a Passport ID.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // NOT tenant-filtered, by design — see the header of models/Passport.ts. A
    // passport outlives any single academy, and filtering by tenant here would
    // break exactly the cross-academy continuity the model exists to provide.
    const passport = await Passport.findOne({ passportId }).lean();
    if (!passport) {
      return NextResponse.json(
        { success: false, message: 'No Passport found with that ID.' },
        { status: 404 }
      );
    }

    const [profile, academy, achievements] = await Promise.all([
      (passport as any).currentStudentProfileId
        ? StudentProfile.findById((passport as any).currentStudentProfileId)
            .select('attendance sports performance')
            .lean()
        : null,
      (passport as any).currentAcademyId
        ? Academy.findById((passport as any).currentAcademyId).select('name').lean()
        : null,
      // Keyed on passportId, not the profile — a badge earned at a previous
      // academy is still theirs. See the header of models/Achievement.ts.
      Achievement.find({ passportId }).sort({ earnedAt: -1 }).limit(50).lean(),
    ]);

    /**
     * Fire-and-forget. Engagement is a metric; a slow or failing write must
     * never delay or break the page a parent is trying to read. The function
     * swallows its own errors for the same reason.
     */
    void recordParentEngagement(passportId);

    return NextResponse.json({
      success: true,
      data: toPublicPassport({
        passport,
        profile,
        academyName: (academy as any)?.name ?? null,
        achievements: achievements as any[],
      }),
    });
  } catch (error: any) {
    console.error('[passport GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
