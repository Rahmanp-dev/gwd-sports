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
 * ENGAGEMENT FOR EVERY ACADEMY, IN A FIXED NUMBER OF QUERIES
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The first version of this screen called `getAcademyInsights()` in a loop.
 * That function issues ~17 queries for ONE academy, which is fine — it backs a
 * per-academy panel. Run across a 100-academy list it became roughly 1,700
 * round trips for a single page load, every one of them serialised behind
 * `Promise.all` over the outer array. On a hosted Mongo with ~5ms latency that
 * is measured in seconds, and it grows linearly with signups: the screen would
 * have degraded quietly until it timed out.
 *
 * This does the same work with a FIXED nine aggregations, each grouped by
 * `academyId`, then assembles the rows in memory. Cost is now independent of
 * the number of academies.
 *
 * `getAcademyInsights` is deliberately untouched and still backs the drill-down
 * panel, where per-academy detail (and its extra fields) is what is wanted.
 * Two callers with genuinely different shapes; sharing one implementation is
 * what caused the problem.
 * ════════════════════════════════════════════════════════════════════════════
 */

const DAY = 24 * 60 * 60 * 1000;

export type EngagementBand = 'dormant' | 'at_risk' | 'healthy' | 'thriving';

export interface EngagementRow {
  academy: { id: string; name: string; slug: string; isActive: boolean };
  owner: { name: string | null; email: string | null; daysSinceLogin: number | null };
  students: number;
  activeStudents: number;
  trainers: number;
  profilesUpdated30d: number;
  attendanceMarks30d: number;
  onlineCount30d: number;
  onlinePaise30d: number;
  offlinePaise30d: number;
  onlineSharePct: number | null;
  sent30d: number;
  openAlerts: number;
  score: number;
  band: EngagementBand;
  /** The five signals, so the list can show WHY a score is low. */
  failing: string[];
}

function daysSince(date: unknown): number | null {
  if (!date) return null;
  const ms = new Date(date as any).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.floor((Date.now() - ms) / DAY);
}

/** Turns an aggregation result into a Map keyed by academy id string. */
function byAcademy<T extends { _id: any }>(rows: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (row._id) map.set(String(row._id), row);
  }
  return map;
}

export async function getEngagementOverview(limit = 200): Promise<{
  academies: EngagementRow[];
  summary: Record<string, number>;
}> {
  const since30 = new Date(Date.now() - 30 * DAY);

  const academies = await Academy.find()
    .select('name slug isActive ownerId contactInfo')
    .limit(limit)
    .lean<any[]>();

  if (academies.length === 0) {
    return {
      academies: [],
      summary: { total: 0, dormant: 0, atRisk: 0, healthy: 0, thriving: 0 },
    };
  }

  const ids = academies.map((a) => new mongoose.Types.ObjectId(String(a._id)));
  const ownerIds = academies.map((a) => a.ownerId).filter(Boolean);

  const [
    owners,
    roster,
    trainers,
    coaching,
    money30,
    moneyLifetime,
    messages,
    alerts,
  ] = await Promise.all([
    User.find({ _id: { $in: ownerIds } }).select('name email lastLogin').lean<any[]>(),

    // One pass over the students of every academy, bucketed per academy.
    StudentProfile.aggregate([
      { $match: { academyId: { $in: ids } } },
      {
        $group: {
          _id: '$academyId',
          students: { $sum: 1 },
          activeStudents: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          profilesUpdated30d: {
            $sum: { $cond: [{ $gte: ['$updatedAt', since30] }, 1, 0] },
          },
        },
      },
    ]),

    TrainerProfile.aggregate([
      { $match: { academyId: { $in: ids } } },
      { $group: { _id: '$academyId', trainers: { $sum: 1 } } },
    ]),

    /**
     * Attendance marks in the window. `attendance` is an embedded array, so
     * this counts inside each document rather than unwinding — a 300-student
     * academy would otherwise produce 300× its rows before grouping.
     */
    StudentProfile.aggregate([
      { $match: { academyId: { $in: ids } } },
      {
        $project: {
          academyId: 1,
          recent: {
            $size: {
              $filter: {
                input: { $ifNull: ['$attendance', []] },
                as: 'a',
                cond: { $gte: ['$$a.date', since30] },
              },
            },
          },
        },
      },
      { $group: { _id: '$academyId', attendanceMarks30d: { $sum: '$recent' } } },
    ]),

    // Online vs offline is the signal that matters — see academyInsights.
    FeePayment.aggregate([
      { $match: { academyId: { $in: ids }, status: 'success', settledAt: { $gte: since30 } } },
      {
        $group: {
          _id: '$academyId',
          onlineCount: {
            $sum: {
              $cond: [{ $ne: ['$settlementStrategy', 'offline_direct_to_academy'] }, 1, 0],
            },
          },
          onlinePaise: {
            $sum: {
              $cond: [
                { $ne: ['$settlementStrategy', 'offline_direct_to_academy'] },
                { $ifNull: ['$parentTotalPaise', 0] },
                0,
              ],
            },
          },
          offlinePaise: {
            $sum: {
              $cond: [
                { $eq: ['$settlementStrategy', 'offline_direct_to_academy'] },
                { $ifNull: ['$parentTotalPaise', 0] },
                0,
              ],
            },
          },
        },
      },
    ]),

    FeePayment.aggregate([
      { $match: { academyId: { $in: ids }, status: 'success' } },
      {
        $group: {
          _id: '$academyId',
          onlinePaise: {
            $sum: {
              $cond: [
                { $ne: ['$settlementStrategy', 'offline_direct_to_academy'] },
                { $ifNull: ['$parentTotalPaise', 0] },
                0,
              ],
            },
          },
          offlinePaise: {
            $sum: {
              $cond: [
                { $eq: ['$settlementStrategy', 'offline_direct_to_academy'] },
                { $ifNull: ['$parentTotalPaise', 0] },
                0,
              ],
            },
          },
        },
      },
    ]),

    OutboundMessage.aggregate([
      {
        $match: {
          academyId: { $in: ids },
          createdAt: { $gte: since30 },
          status: { $in: ['sent', 'delivered', 'read'] },
        },
      },
      { $group: { _id: '$academyId', sent30d: { $sum: 1 } } },
    ]),

    OwnerAlert.aggregate([
      { $match: { academyId: { $in: ids }, resolvedAt: null } },
      { $group: { _id: '$academyId', open: { $sum: 1 } } },
    ]),
  ]);

  const ownerById = new Map(owners.map((o) => [String(o._id), o]));
  const rosterBy = byAcademy(roster);
  const trainerBy = byAcademy(trainers);
  const coachingBy = byAcademy(coaching);
  const money30By = byAcademy(money30);
  const lifetimeBy = byAcademy(moneyLifetime);
  const messagesBy = byAcademy(messages);
  const alertsBy = byAcademy(alerts);

  const rows: EngagementRow[] = academies.map((a) => {
    const key = String(a._id);
    const owner = a.ownerId ? ownerById.get(String(a.ownerId)) : null;
    const r = rosterBy.get(key) as any;
    const c = coachingBy.get(key) as any;
    const m30 = money30By.get(key) as any;
    const life = lifetimeBy.get(key) as any;

    const dsl = daysSince(owner?.lastLogin);
    const profilesUpdated30d = r?.profilesUpdated30d ?? 0;
    const attendanceMarks30d = c?.attendanceMarks30d ?? 0;
    const onlineCount30d = m30?.onlineCount ?? 0;
    const sent30d = (messagesBy.get(key) as any)?.sent30d ?? 0;

    // Same five equally-weighted signals as the per-academy panel, so the
    // list and the drill-down cannot disagree about a score.
    const signals: [string, boolean][] = [
      ['Owner signed in', dsl !== null && dsl <= 14],
      ['Records kept current', profilesUpdated30d > 0],
      ['Attendance recorded', attendanceMarks30d > 0],
      ['Collecting through GWD', onlineCount30d > 0],
      ['Messages going out', sent30d > 0],
    ];
    const score = signals.filter(([, ok]) => ok).length * 20;
    const band: EngagementBand =
      score >= 80 ? 'thriving' : score >= 60 ? 'healthy' : score >= 20 ? 'at_risk' : 'dormant';

    const lifeOnline = life?.onlinePaise ?? 0;
    const lifeOffline = life?.offlinePaise ?? 0;
    const lifeTotal = lifeOnline + lifeOffline;

    return {
      academy: {
        id: key,
        name: a.name,
        slug: a.slug,
        isActive: Boolean(a.isActive),
      },
      owner: {
        name: owner?.name ?? a.contactInfo?.name ?? null,
        email: owner?.email ?? a.contactInfo?.email ?? null,
        daysSinceLogin: dsl,
      },
      students: r?.students ?? 0,
      activeStudents: r?.activeStudents ?? 0,
      trainers: (trainerBy.get(key) as any)?.trainers ?? 0,
      profilesUpdated30d,
      attendanceMarks30d,
      onlineCount30d,
      onlinePaise30d: m30?.onlinePaise ?? 0,
      offlinePaise30d: m30?.offlinePaise ?? 0,
      onlineSharePct: lifeTotal > 0 ? Math.round((lifeOnline / lifeTotal) * 100) : null,
      sent30d,
      openAlerts: (alertsBy.get(key) as any)?.open ?? 0,
      score,
      band,
      failing: signals.filter(([, ok]) => !ok).map(([label]) => label),
    };
  });

  // Worst first: the academies worth a phone call this week are the ones at
  // the bottom of the score, and a name-sorted list hides them.
  rows.sort((a, b) => a.score - b.score);

  const bands = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.band] = (acc[r.band] ?? 0) + 1;
    return acc;
  }, {});

  return {
    academies: rows,
    summary: {
      total: rows.length,
      dormant: bands.dormant ?? 0,
      atRisk: bands.at_risk ?? 0,
      healthy: bands.healthy ?? 0,
      thriving: bands.thriving ?? 0,
    },
  };
}
