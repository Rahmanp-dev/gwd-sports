import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import User from '@/lib/models/User';
import StudentProfile from '@/lib/models/Student';
import TrainerProfile from '@/lib/models/Trainer';
import Academy from '@/lib/models/Academy';
import FeePayment from '@/lib/models/FeePayment';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    
    await connectToDatabase();

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Tenant isolation filter
    const isSuperAdmin = auth.user.role === 'gwd_super_admin';
    const academyObjectId = auth.academyId ? new mongoose.Types.ObjectId(auth.academyId.toString()) : null;
    const tenantFilter: any = (!isSuperAdmin && academyObjectId) ? { academyId: academyObjectId } : {};

    // 1. STUDENTS
    const studentStats = await StudentProfile.aggregate([
      { $match: tenantFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
          totalOutstanding: { $sum: "$outstandingFees" },
          overdueCount: { $sum: { $cond: [{ $gt: ["$outstandingFees", 0] }, 1, 0] } }
        }
      }
    ]);
    
    const studentsByLevel = await StudentProfile.aggregate([
      { $match: { isActive: true, ...tenantFilter } },
      { $group: { _id: "$level", count: { $sum: 1 } } }
    ]);
    
    const sStats = studentStats[0] || { total: 0, active: 0, totalOutstanding: 0, overdueCount: 0 };
    const enrolled = sStats.active;
    const unenrolled = sStats.total - sStats.active;
    const studentGrowth = 5; // Static growth mock to prevent zero division for now

    // 2. FINANCE
    const financeStats = await FeePayment.aggregate([
      {
        $facet: {
          thisMonth: [
            { $match: { status: 'success', createdAt: { $gte: startOfThisMonth }, ...tenantFilter } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          lastMonth: [
            { $match: { status: 'success', createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }, ...tenantFilter } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          allTime: [
            { $match: { status: 'success', ...tenantFilter } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ],
          pending: [
            { $match: { status: 'pending', ...tenantFilter } },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const fStats = financeStats[0];
    const monthlyRevenue = fStats.thisMonth[0]?.total || 0;
    const lastMonthRevenue = fStats.lastMonth[0]?.total || 0;
    const totalRevenue = fStats.allTime[0]?.total || 0;
    const pendingAmount = fStats.pending[0]?.total || 0;
    const pendingCount = fStats.pending[0]?.count || 0;
    const revenueGrowth = lastMonthRevenue > 0 
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
      : (monthlyRevenue > 0 ? 100 : 0);

    // 3. TRAINERS
    const trainerTotal = await TrainerProfile.countDocuments(tenantFilter);
    const trainerActive = await TrainerProfile.countDocuments({ isActive: true, ...tenantFilter });
    
    const sportDistribution = await TrainerProfile.aggregate([
      { $match: { isActive: true, ...tenantFilter } },
      { $unwind: "$sports" },
      { $group: { _id: "$sports", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top Trainers mock (could aggregate student array length)
    const topTrainers = await TrainerProfile.find({ isActive: true, ...tenantFilter })
      .populate('userId', 'name')
      .limit(3)
      .lean();
    
    const formattedTopTrainers = topTrainers.map((t: any) => ({
      _id: t._id.toString(),
      name: t.userId?.name || 'Unknown Trainer',
      studentCount: t.students?.length || 0
    })).sort((a: any, b: any) => b.studentCount - a.studentCount);

    /**
     * 4. ACADEMIES
     *
     * These two were the only unfiltered counts on this route, so an academy
     * owner's own dashboard reported the number of academies on the ENTIRE
     * platform — "2 academies" on a screen that is otherwise all their data.
     * That is other tenants' business information, and it is meaningless to
     * the person reading it.
     *
     * A super admin gets the platform count, because for them it IS their
     * dashboard. An academy admin gets their own academy: always 1, and 1 or 0
     * active depending on whether they are suspended.
     */
    const academyScope = (!isSuperAdmin && academyObjectId) ? { _id: academyObjectId } : {};
    const academiesTotal = await Academy.countDocuments(academyScope);
    const academiesActive = await Academy.countDocuments({ isActive: true, ...academyScope });

    // 5. ATTENDANCE & DROP-OFF
    const allStudents = await StudentProfile.find({ isActive: true, ...tenantFilter }).select('attendance userId').populate('userId', 'name').lean();
    
    let totalRecords = 0;
    let presentCount = 0;
    const dropOffStudents: any[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    allStudents.forEach((student: any) => {
      if (!student.attendance || student.attendance.length === 0) return;
      
      const sortedAtt = [...student.attendance].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let consecutiveAbsences = 0;
      for (const record of sortedAtt) {
        totalRecords++;
        if (record.present) presentCount++;
        
        // Count consecutive absences from the most recent record
        if (new Date(record.date) >= sevenDaysAgo) {
          if (!record.present) consecutiveAbsences++;
          else consecutiveAbsences = 0;
        }
      }
      
      if (consecutiveAbsences >= 7) {
        dropOffStudents.push({
          studentName: student.userId?.name || 'Unknown',
          absentDays: consecutiveAbsences
        });
      }
    });

    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 85;
    
    // Mock Trend for empty dbs to prevent frontend empty states
    const trend = [
      { month: '2026-03', rate: 82, totalRecords: 120, presentCount: 98 },
      { month: '2026-04', rate: 85, totalRecords: 150, presentCount: 127 },
      { month: '2026-05', rate: 88, totalRecords: 180, presentCount: 158 },
      { month: '2026-06', rate: 86, totalRecords: 200, presentCount: 172 },
      { month: '2026-07', rate: attendanceRate > 0 ? attendanceRate : 89, totalRecords, presentCount }
    ];

    // 6. RECENT ACTIVITY
    const userFilter: any = { role: 'student' };
    if (!isSuperAdmin && auth.academyId) userFilter.academyId = auth.academyId;
    const newStudents = await User.find(userFilter).sort({ createdAt: -1 }).limit(5).select('name email createdAt').lean();
    const recentPayments = await FeePayment.find({ status: 'success', ...tenantFilter }).sort({ createdAt: -1 }).limit(5).lean();

    const formattedPayments = recentPayments.map((p: any) => ({
      id: p._id.toString(),
      receipt: p.receipt || p.orderId,
      amount: p.amount
    }));

    // COMPILE FINAL PAYLOAD
    return NextResponse.json({
      success: true,
      data: {
        students: {
          total: sStats.total,
          active: sStats.active,
          enrolled,
          unenrolled,
          growth: studentGrowth,
          byLevel: studentsByLevel.length > 0 ? studentsByLevel : [{ _id: 'beginner', count: 1 }]
        },
        attendance: {
          rate: attendanceRate,
          trend
        },
        finance: {
          monthlyRevenue,
          lastMonthRevenue,
          revenueGrowth,
          totalRevenue,
          pendingAmount,
          pendingCount,
          feeOverdueCount: sStats.overdueCount,
          totalOutstanding: sStats.totalOutstanding
        },
        trainers: {
          total: trainerTotal,
          active: trainerActive,
          topTrainers: formattedTopTrainers,
          sportDistribution: sportDistribution.length > 0 ? sportDistribution : [{ _id: 'general', count: 1 }]
        },
        academies: {
          total: academiesTotal,
          active: academiesActive
        },
        dropOff: {
          count: dropOffStudents.length,
          students: dropOffStudents
        },
        recentActivity: {
          newStudents,
          recentPayments: formattedPayments
        }
      }
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
