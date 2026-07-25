import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import mongoose from 'mongoose';
import {
  validatePerformanceEntry,
  averageByCategory,
  overallScore,
  CATEGORY_DEFINITIONS,
} from '@/lib/performance/taxonomy';
import { evaluateAndAward } from '@/lib/performance/award';

/**
 * Record one performance evaluation.
 *
 * Phase 5 changed two things here.
 *
 * FIRST, the category is validated against the taxonomy instead of being
 * accepted as free text. It used to take whatever string arrived, which is what
 * made scores incomparable: a 7/10 for a fitness drill and a 7/10 for match-day
 * decision-making were averaged together as if they measured the same thing.
 *
 * SECOND, an evaluation can now cross an achievement threshold, so the rules are
 * re-run afterwards. That is what produces `achievement.created` — the event
 * `gwd_achievement_v1` has been waiting for since Phase 2.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const trainerId = auth.user._id;
    const body = await req.json().catch(() => ({}));
    const { studentId, sport, score, maxScore, remarks, categoryKey, metric } = body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
    }

    const validated = validatePerformanceEntry({ categoryKey, metric, score, maxScore });
    if (!validated.ok) {
      return NextResponse.json({ success: false, message: validated.reason }, { status: 400 });
    }
    const entry = validated.entry;

    /**
     * TENANT ISOLATION. Without the academy scope a coach could evaluate — and
     * therefore alter the record of — a student at another academy by supplying
     * their id. Super admins are exempt.
     */
    const filter: Record<string, unknown> = { userId: studentId };
    if (auth.user.role !== 'gwd_super_admin') {
      if (!auth.academyId) {
        return NextResponse.json(
          { success: false, message: 'No academy assigned to your account' },
          { status: 403 }
        );
      }
      filter.academyId = auth.academyId;
    }

    const student = await StudentProfile.findOne(filter);
    if (!student) {
      // Indistinguishable from "does not exist", so this cannot be used to probe
      // which students belong to other academies.
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    student.performance.push({
      sport,
      score: entry.score,
      maxScore: entry.maxScore,
      remarks,
      categoryKey: entry.categoryKey,
      metric: entry.metric,
      // The legacy free-text field is still required by the schema and still
      // read by older dashboards. Written from the taxonomy so the two agree.
      category: CATEGORY_DEFINITIONS[entry.categoryKey].label,
      evaluatedBy: trainerId,
      evaluatedAt: new Date(),
    } as any);

    await student.save();

    // Re-run the achievement rules — this evaluation may have crossed a
    // threshold. Failure here must not fail the evaluation itself: the score is
    // recorded, and a missed badge is recoverable on the next assessment.
    let awarded: string[] = [];
    try {
      if (student.passportId) {
        const result = await evaluateAndAward({ passportId: student.passportId });
        awarded = result.awarded.map((a) => a.name);
      }
    } catch (err: any) {
      console.error('[add-performance] achievement evaluation failed:', err?.message || err);
    }

    const averages = averageByCategory((student.performance ?? []) as any);

    return NextResponse.json({
      success: true,
      message: 'Performance record added successfully',
      data: {
        categoryAverages: averages,
        overall: overallScore(averages),
        achievementsAwarded: awarded,
      },
    });
  } catch (error: any) {
    console.error('[trainer/add-performance]', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
