import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import StudentProfile from '@/lib/models/Student';
import Achievement from '@/lib/models/Achievement';
import Batch from '@/lib/models/Batch';
import {
  averageByCategory,
  overallScore,
  categoryFromLegacy,
  CATEGORY_DEFINITIONS,
} from '@/lib/performance/taxonomy';
import { COACH_AWARDABLE, findCoachAwardable } from '@/lib/performance/achievements';
import { awardAchievement } from '@/lib/performance/award';
import Academy from '@/lib/models/Academy';

/**
 * Everything a coach needs about one student, in one request.
 *
 * Four separate P0 items asked for this — view performance, fees, kits and
 * attendance in the trainer page. They are one endpoint rather than four
 * because a coach opens a student to look at all of it, and four round trips on
 * academy wifi is four chances to see a spinner.
 *
 * WHAT A TRAINER MAY NOT SEE: nothing is withheld from a coach that the academy
 * does not already hold — they need the parent's number to call about a missed
 * session, and the fee state to know not to ask. What IS enforced is tenant
 * isolation: a coach can only open a student at their own academy.
 */

async function loadStudent(auth: any, studentUserId: string) {
  if (!studentUserId || !mongoose.Types.ObjectId.isValid(studentUserId)) {
    return { error: 'A valid studentUserId is required', status: 400 as const };
  }

  const filter: Record<string, unknown> = { userId: studentUserId };
  if (auth.user.role !== 'gwd_super_admin') {
    if (!auth.academyId) {
      return { error: 'No academy assigned to your account', status: 403 as const };
    }
    filter.academyId = auth.academyId;
  }

  const student = await StudentProfile.findOne(filter).populate('userId', 'name email phone');
  if (!student) {
    // Indistinguishable from "does not exist", so this cannot be used to probe
    // which students belong to other academies.
    return { error: 'Student not found', status: 404 as const };
  }
  return { student };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const loaded = await loadStudent(auth, searchParams.get('studentUserId') ?? '');
    if ('error' in loaded) {
      return NextResponse.json({ success: false, message: loaded.error }, { status: loaded.status });
    }
    const student = loaded.student as any;

    const [achievements, batch] = await Promise.all([
      student.passportId
        ? Achievement.find({ passportId: student.passportId }).sort({ earnedAt: -1 }).lean()
        : [],
      student.batchId ? Batch.findById(student.batchId).select('name sport').lean() : null,
    ]);

    const performance = (student.performance ?? []) as any[];
    const averages = averageByCategory(performance);

    const attendance = ((student.attendance ?? []) as any[])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const present = attendance.filter((row) => row.present).length;

    return NextResponse.json({
      success: true,
      data: {
        student: {
          userId: String(student.userId?._id ?? student.userId),
          name: student.userId?.name ?? 'Unnamed student',
          email: student.userId?.email ?? null,
          passportId: student.passportId ?? null,
          level: student.level ?? null,
          sports: student.sports ?? [],
          parentName: student.parentName ?? null,
          parentPhone: student.parentPhoneE164 ?? null,
          batch: batch ? { name: (batch as any).name, sport: (batch as any).sport } : null,
        },

        performance: {
          categoryAverages: averages,
          overall: overallScore(averages),
          // Legacy rows are mapped on read, so a coach never sees a record
          // vanish because it predates the taxonomy.
          records: performance
            .slice()
            .sort(
              (a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
            )
            .map((record) => {
              const key = record.categoryKey ?? categoryFromLegacy(record.category);
              return {
                categoryKey: key,
                categoryLabel: CATEGORY_DEFINITIONS[key as keyof typeof CATEGORY_DEFINITIONS]
                  ?.label ?? key,
                metric: record.metric ?? record.category ?? null,
                score: record.score,
                maxScore: record.maxScore,
                percentage:
                  record.maxScore > 0
                    ? Math.round((record.score / record.maxScore) * 100)
                    : null,
                remarks: record.remarks ?? null,
                evaluatedAt: record.evaluatedAt,
                // True when this record predates the taxonomy, so the UI can
                // mark an inferred category rather than presenting a guess as
                // fact.
                inferredCategory: !record.categoryKey,
              };
            }),
        },

        attendance: {
          total: attendance.length,
          present,
          rate: attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null,
          records: attendance.slice(0, 30).map((row) => ({
            date: row.date,
            present: row.present,
            source: row.source ?? 'coach',
            remarks: row.remarks ?? null,
          })),
        },

        fees: {
          feeAmount: student.feeAmount ?? null,
          feePeriod: student.feePeriod ?? null,
          outstanding: student.outstandingFees ?? 0,
          totalPaid: student.totalFeesPaid ?? 0,
          dueDayOfMonth: student.feeDueDayOfMonth ?? null,
          recentPayments: ((student.feePayments ?? []) as any[])
            .slice(-5)
            .reverse()
            .map((payment) => ({
              amount: payment.amount,
              status: payment.status,
              paidAt: payment.paidAt ?? payment.createdAt ?? null,
            })),
        },

        kits: ((student.kits ?? []) as any[]).map((kit) => ({
          kitName: kit.kitName,
          status: kit.status,
          requestedAt: kit.requestedAt ?? null,
        })),

        achievements: (achievements as any[]).map((award) => ({
          key: award.key,
          name: award.name,
          description: award.description,
          icon: award.icon ?? '🏅',
          source: award.source,
          earnedAt: award.earnedAt,
        })),

        // Drives the award picker. Sent with the student so the UI does not
        // need a second call to populate a dropdown.
        awardable: COACH_AWARDABLE,
      },
    });
  } catch (error: any) {
    console.error('[trainer/student-detail GET]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * A coach awards a badge by hand.
 *
 * Only keys from the published list — see COACH_AWARDABLE for why this is not
 * free text. Goes through the same `awardAchievement` path as the automatic
 * rules, so a manual award notifies the parent exactly like an earned one.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const payload = await req.json().catch(() => ({}));
    const loaded = await loadStudent(auth, payload?.studentUserId ?? '');
    if ('error' in loaded) {
      return NextResponse.json({ success: false, message: loaded.error }, { status: loaded.status });
    }
    const student = loaded.student as any;

    const definition = findCoachAwardable(payload?.achievementKey);
    if (!definition) {
      return NextResponse.json(
        {
          success: false,
          message: `Unknown award. Choose one of: ${COACH_AWARDABLE.map((a) => a.key).join(', ')}.`,
        },
        { status: 400 }
      );
    }

    if (!student.passportId) {
      return NextResponse.json(
        { success: false, message: 'This student has no Passport yet, so awards cannot be recorded.' },
        { status: 409 }
      );
    }

    const academy = student.academyId
      ? await Academy.findById(student.academyId).select('name').lean()
      : null;

    const outcome = await awardAchievement({
      context: {
        passportId: student.passportId,
        studentUserId: student.userId?._id ?? student.userId,
        studentName: student.userId?.name ?? 'your child',
        academyId: student.academyId ?? null,
        academyName: (academy as any)?.name ?? 'your academy',
        parentPhone: student.parentPhoneE164 ?? null,
        parentName: student.parentName ?? null,
      },
      definition,
      source: 'coach_awarded',
      awardedBy: auth.user._id,
      evidence: { note: payload?.note ?? null },
    });

    if (outcome.status === 'duplicate') {
      return NextResponse.json(
        { success: false, message: `${student.userId?.name ?? 'This student'} already has that award.` },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { achievementId: outcome.achievementId, parentNotified: outcome.eventEmitted },
    });
  } catch (error: any) {
    console.error('[trainer/student-detail POST]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
