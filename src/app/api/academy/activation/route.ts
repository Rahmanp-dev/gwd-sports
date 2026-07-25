import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import Passport from '@/lib/models/Passport';
import ImportJob from '@/lib/models/ImportJob';
import DomainEvent from '@/lib/models/DomainEvent';

/**
 * The activation dashboard: how many imported students have an ENGAGED parent,
 * versus how many are still dormant.
 *
 * The point of this view is that the owner chases the stragglers personally.
 * Automation gets most of the way; the owner's relationship closes the gap. So
 * this returns the dormant students BY NAME with their parent's number, not just
 * a percentage — a number without a call list is not actionable.
 *
 * ENGAGEMENT IS PARTIALLY STUBBED UNTIL PHASE 2. `engagedCount` counts passports
 * with parentFirstEngagedAt set, which is populated when a parent opens their
 * passport or payment link. That field is live and correct right now, but nothing
 * yet DRIVES parents to those links, because the welcome message that carries
 * them is Phase 2. So expect this to read 0 engaged until Phase 2 ships, and the
 * `welcomeMessages` block below to report the queue depth rather than deliveries.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const academyId = auth.academyId;
    if (!academyId) {
      return NextResponse.json(
        { success: false, message: 'Your account is not linked to an academy.' },
        { status: 403 }
      );
    }

    const [totalStudents, withParentPhone, passportStats, importStats, welcomeEvents, dormant] =
      await Promise.all([
        StudentProfile.countDocuments({ academyId, isActive: true }),

        StudentProfile.countDocuments({
          academyId,
          isActive: true,
          parentPhoneE164: { $ne: null, $exists: true },
        }),

        Passport.aggregate([
          { $match: { currentAcademyId: toObjectId(academyId), isActive: true } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              engaged: {
                $sum: { $cond: [{ $ifNull: ['$parentFirstEngagedAt', false] }, 1, 0] },
              },
            },
          },
        ]),

        ImportJob.aggregate([
          { $match: { academyId: toObjectId(academyId), status: 'committed' } },
          {
            $group: {
              _id: null,
              jobs: { $sum: 1 },
              created: { $sum: '$summary.created' },
              failed: { $sum: '$summary.failed' },
            },
          },
        ]),

        // Welcome-message pipeline health. Until Phase 2's consumer exists these
        // are all 'pending', which is the honest thing to show the owner.
        DomainEvent.aggregate([
          { $match: { academyId: toObjectId(academyId), name: 'student.created' } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        // The call list.
        Passport.find({
          currentAcademyId: toObjectId(academyId),
          isActive: true,
          parentFirstEngagedAt: null,
        })
          .select('passportId studentName parentName parentPhone createdAt')
          .sort({ createdAt: 1 })
          .limit(200)
          .lean(),
      ]);

    const passports = passportStats[0] ?? { total: 0, engaged: 0 };
    const imports = importStats[0] ?? { jobs: 0, created: 0, failed: 0 };

    const welcomeMessages = { pending: 0, processing: 0, done: 0, failed: 0, skipped: 0 };
    for (const bucket of welcomeEvents as Array<{ _id: string; count: number }>) {
      if (bucket._id in welcomeMessages) {
        welcomeMessages[bucket._id as keyof typeof welcomeMessages] = bucket.count;
      }
    }

    const engagementRate =
      passports.total > 0 ? Math.round((passports.engaged / passports.total) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          withParentPhone,
          // Students we cannot contact at all — the first thing to fix, since no
          // amount of messaging reaches them.
          missingParentPhone: Math.max(0, totalStudents - withParentPhone),
        },
        passports: {
          total: passports.total,
          engaged: passports.engaged,
          dormant: Math.max(0, passports.total - passports.engaged),
          engagementRate,
        },
        imports: {
          committedJobs: imports.jobs,
          studentsCreated: imports.created,
          rowsFailed: imports.failed,
        },
        welcomeMessages,
        dormantParents: dormant.map((passport: any) => ({
          passportId: passport.passportId,
          studentName: passport.studentName,
          parentName: passport.parentName,
          parentPhone: passport.parentPhone,
          addedAt: passport.createdAt,
        })),
        engagementMetricStatus:
          welcomeMessages.done > 0
            ? 'live'
            : 'awaiting_phase_2_delivery',
      },
    });
  } catch (error: any) {
    console.error('[academy/activation]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

function toObjectId(id: unknown): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(String(id));
}
