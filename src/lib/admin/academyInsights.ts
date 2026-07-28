import mongoose from 'mongoose';
import { Academy } from '@/lib/models/Academy';
import User from '@/lib/models/User';
import StudentProfile from '@/lib/models/Student';
import TrainerProfile from '@/lib/models/Trainer';
import { FeePayment } from '@/lib/models/FeePayment';
import OutboundMessage from '@/lib/models/OutboundMessage';
import OwnerAlert from '@/lib/models/OwnerAlert';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * IS THIS ACADEMY ACTUALLY USING THE PLATFORM?
 * ════════════════════════════════════════════════════════════════════════════
 *
 * GWD needs to answer that per academy, and "they have 40 students on file"
 * does not answer it — a roster imported once and never touched again looks
 * identical to a thriving academy on a headcount.
 *
 * So every figure here is about ACTIVITY IN A WINDOW, not totals:
 *   - is the owner recording attendance, or did that stop three weeks ago?
 *   - are coaches still writing performance entries?
 *   - is money arriving through GWD's payment links, or is the academy
 *     collecting cash and (at best) marking it here afterwards?
 *   - are the parent messages we promise actually going out?
 *
 * WHY OFFLINE VS ONLINE IS SPLIT OUT AND NOT SUMMED. An academy whose
 * collection is 95% offline-marked is using GWD as a ledger, not as a payment
 * rail — that is a completely different (and much weaker) commercial
 * position than the same rupee figure collected online, and a combined total
 * hides exactly that. This is the number that says whether the product is
 * embedded or merely installed.
 *
 * Everything is computed from documents that already exist. Nothing here
 * writes, and nothing depends on new tracking being added first — which
 * means it works retroactively on the academies already on the platform.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface AcademyInsights {
  academy: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date | null;
    verificationStatus: string;
  };
  owner: {
    name: string | null;
    email: string | null;
    phone: string | null;
    lastLogin: Date | null;
    /** Days since the owner last signed in; null when they never have. */
    daysSinceLogin: number | null;
  };
  roster: {
    students: number;
    activeStudents: number;
    trainers: number;
    /** Student records touched in the window — the "is this kept current" signal. */
    profilesUpdated7d: number;
    profilesUpdated30d: number;
    newStudents30d: number;
  };
  coaching: {
    attendanceMarks30d: number;
    lastAttendanceAt: Date | null;
    performanceEntries30d: number;
    lastPerformanceAt: Date | null;
  };
  money: {
    onlineCount30d: number;
    onlinePaise30d: number;
    offlineCount30d: number;
    offlinePaise30d: number;
    lifetimeOnlinePaise: number;
    lifetimeOfflinePaise: number;
    lastPaymentAt: Date | null;
    /** 0–100. What share of collected value came through GWD's rails. */
    onlineSharePct: number | null;
  };
  messaging: {
    sent30d: number;
    failed30d: number;
    queued: number;
    lastSentAt: Date | null;
  };
  alerts: {
    open: number;
    requiringDecision: number;
  };
  engagement: {
    /** 0–100, see scoreEngagement(). */
    score: number;
    band: 'dormant' | 'at_risk' | 'healthy' | 'thriving';
    /** Plain-language reasons behind the score, for the dashboard to list. */
    signals: { label: string; ok: boolean; detail: string }[];
  };
}

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY);
}

function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / DAY);
}

/**
 * A deliberately blunt 0–100 score over five independent signals worth 20
 * each. Blunt because the alternative — a weighted model tuned on a handful
 * of academies — would look precise while being mostly noise, and this
 * number's only job is to sort a list so a human looks at the right academy
 * first.
 */
function scoreEngagement(input: {
  daysSinceLogin: number | null;
  profilesUpdated30d: number;
  attendanceMarks30d: number;
  onlineCount30d: number;
  sent30d: number;
}): AcademyInsights['engagement'] {
  const signals: AcademyInsights['engagement']['signals'] = [
    {
      label: 'Owner signed in',
      ok: input.daysSinceLogin !== null && input.daysSinceLogin <= 14,
      detail:
        input.daysSinceLogin === null
          ? 'Never signed in'
          : `${input.daysSinceLogin} day(s) ago`,
    },
    {
      label: 'Student records kept current',
      ok: input.profilesUpdated30d > 0,
      detail: `${input.profilesUpdated30d} updated in 30 days`,
    },
    {
      label: 'Attendance being recorded',
      ok: input.attendanceMarks30d > 0,
      detail: `${input.attendanceMarks30d} marks in 30 days`,
    },
    {
      label: 'Collecting through GWD',
      ok: input.onlineCount30d > 0,
      detail: `${input.onlineCount30d} online payment(s) in 30 days`,
    },
    {
      label: 'Parent messages going out',
      ok: input.sent30d > 0,
      detail: `${input.sent30d} sent in 30 days`,
    },
  ];

  const score = signals.filter((s) => s.ok).length * 20;
  const band: AcademyInsights['engagement']['band'] =
    score >= 80 ? 'thriving' : score >= 60 ? 'healthy' : score >= 20 ? 'at_risk' : 'dormant';

  return { score, band, signals };
}

export async function getAcademyInsights(
  academyId: string,
): Promise<AcademyInsights | null> {
  if (!mongoose.Types.ObjectId.isValid(academyId)) return null;

  const academy = await Academy.findById(academyId)
    .select('name slug isActive createdAt verificationStatus ownerId contactInfo')
    .lean<any>();
  if (!academy) return null;

  const oid = new mongoose.Types.ObjectId(academyId);
  const since30 = daysAgo(30);
  const since7 = daysAgo(7);

  const [
    owner,
    students,
    activeStudents,
    trainers,
    profilesUpdated7d,
    profilesUpdated30d,
    newStudents30d,
    coachingAgg,
    moneyAgg,
    lifetimeAgg,
    lastPayment,
    sent30d,
    failed30d,
    queued,
    lastSentDoc,
    openAlerts,
    decisionAlerts,
  ] = await Promise.all([
    academy.ownerId
      ? User.findById(academy.ownerId).select('name email phone lastLogin').lean<any>()
      : null,
    StudentProfile.countDocuments({ academyId: oid }),
    StudentProfile.countDocuments({ academyId: oid, isActive: true }),
    TrainerProfile.countDocuments({ academyId: oid }),
    StudentProfile.countDocuments({ academyId: oid, updatedAt: { $gte: since7 } }),
    StudentProfile.countDocuments({ academyId: oid, updatedAt: { $gte: since30 } }),
    StudentProfile.countDocuments({ academyId: oid, createdAt: { $gte: since30 } }),

    /**
     * Attendance and performance are arrays embedded on StudentProfile, so
     * counting "marks in the last 30 days" means unwinding them. Done in one
     * pipeline rather than reading every profile into Node — a 300-student
     * academy would otherwise pull 300 documents with their full history
     * just to count two numbers.
     */
    StudentProfile.aggregate([
      { $match: { academyId: oid } },
      {
        $project: {
          attendance: { $ifNull: ['$attendance', []] },
          performance: { $ifNull: ['$performance', []] },
        },
      },
      {
        $project: {
          recentAttendance: {
            $size: {
              $filter: {
                input: '$attendance',
                as: 'a',
                cond: { $gte: ['$$a.date', since30] },
              },
            },
          },
          lastAttendance: { $max: '$attendance.date' },
          // Performance rows are timestamped `evaluatedAt`, not `date` —
          // attendance uses `date`. Matching the wrong field here would
          // silently report zero coaching activity for a busy academy.
          recentPerformance: {
            $size: {
              $filter: {
                input: '$performance',
                as: 'p',
                cond: { $gte: ['$$p.evaluatedAt', since30] },
              },
            },
          },
          lastPerformance: { $max: '$performance.evaluatedAt' },
        },
      },
      {
        $group: {
          _id: null,
          attendanceMarks30d: { $sum: '$recentAttendance' },
          lastAttendanceAt: { $max: '$lastAttendance' },
          performanceEntries30d: { $sum: '$recentPerformance' },
          lastPerformanceAt: { $max: '$lastPerformance' },
        },
      },
    ]),

    // Online vs offline in the window. `settlementStrategy` is the honest
    // discriminator: offline entries are written by recordOfflinePayment().
    FeePayment.aggregate([
      { $match: { academyId: oid, status: 'success', settledAt: { $gte: since30 } } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$settlementStrategy', 'offline_direct_to_academy'] },
              'offline',
              'online',
            ],
          },
          count: { $sum: 1 },
          paise: { $sum: { $ifNull: ['$parentTotalPaise', 0] } },
        },
      },
    ]),

    FeePayment.aggregate([
      { $match: { academyId: oid, status: 'success' } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$settlementStrategy', 'offline_direct_to_academy'] },
              'offline',
              'online',
            ],
          },
          paise: { $sum: { $ifNull: ['$parentTotalPaise', 0] } },
        },
      },
    ]),

    FeePayment.findOne({ academyId: oid, status: 'success' })
      .sort({ settledAt: -1 })
      .select('settledAt')
      .lean<any>(),

    OutboundMessage.countDocuments({
      academyId: oid,
      status: { $in: ['sent', 'delivered', 'read'] },
      createdAt: { $gte: since30 },
    }),
    OutboundMessage.countDocuments({
      academyId: oid,
      status: 'failed',
      createdAt: { $gte: since30 },
    }),
    OutboundMessage.countDocuments({ academyId: oid, status: 'queued' }),
    OutboundMessage.findOne({
      academyId: oid,
      status: { $in: ['sent', 'delivered', 'read'] },
    })
      .sort({ sentAt: -1 })
      .select('sentAt')
      .lean<any>(),

    OwnerAlert.countDocuments({ academyId: oid, resolvedAt: null }),
    OwnerAlert.countDocuments({
      academyId: oid,
      resolvedAt: null,
      requiresOwnerDecision: true,
    }),
  ]);

  const coaching = coachingAgg[0] ?? {};
  const pick = (rows: any[], key: string, field: string) =>
    rows.find((r) => r._id === key)?.[field] ?? 0;

  const onlinePaise30d = pick(moneyAgg, 'online', 'paise');
  const offlinePaise30d = pick(moneyAgg, 'offline', 'paise');
  const lifetimeOnlinePaise = pick(lifetimeAgg, 'online', 'paise');
  const lifetimeOfflinePaise = pick(lifetimeAgg, 'offline', 'paise');
  const lifetimeTotal = lifetimeOnlinePaise + lifetimeOfflinePaise;

  const daysSinceLogin = daysSince(owner?.lastLogin);
  const onlineCount30d = pick(moneyAgg, 'online', 'count');

  return {
    academy: {
      id: String(academy._id),
      name: academy.name,
      slug: academy.slug,
      isActive: Boolean(academy.isActive),
      createdAt: academy.createdAt ?? null,
      verificationStatus: academy.verificationStatus ?? 'pending',
    },
    owner: {
      name: owner?.name ?? academy.contactInfo?.name ?? null,
      email: owner?.email ?? academy.contactInfo?.email ?? null,
      phone: owner?.phone ?? academy.contactInfo?.phone ?? null,
      lastLogin: owner?.lastLogin ?? null,
      daysSinceLogin,
    },
    roster: {
      students,
      activeStudents,
      trainers,
      profilesUpdated7d,
      profilesUpdated30d,
      newStudents30d,
    },
    coaching: {
      attendanceMarks30d: coaching.attendanceMarks30d ?? 0,
      lastAttendanceAt: coaching.lastAttendanceAt ?? null,
      performanceEntries30d: coaching.performanceEntries30d ?? 0,
      lastPerformanceAt: coaching.lastPerformanceAt ?? null,
    },
    money: {
      onlineCount30d,
      onlinePaise30d,
      offlineCount30d: pick(moneyAgg, 'offline', 'count'),
      offlinePaise30d,
      lifetimeOnlinePaise,
      lifetimeOfflinePaise,
      lastPaymentAt: lastPayment?.settledAt ?? null,
      onlineSharePct:
        lifetimeTotal > 0
          ? Math.round((lifetimeOnlinePaise / lifetimeTotal) * 100)
          : null,
    },
    messaging: {
      sent30d,
      failed30d,
      queued,
      lastSentAt: lastSentDoc?.sentAt ?? null,
    },
    alerts: { open: openAlerts, requiringDecision: decisionAlerts },
    engagement: scoreEngagement({
      daysSinceLogin,
      profilesUpdated30d,
      attendanceMarks30d: coaching.attendanceMarks30d ?? 0,
      onlineCount30d,
      sent30d,
    }),
  };
}
