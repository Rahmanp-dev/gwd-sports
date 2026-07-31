import { ACTIVE } from "@/lib/models/activeFilter";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { adminMiddleware } from "@/lib/middleware/auth";
import mongoose from "mongoose";
import FeePayment from "@/lib/models/FeePayment";
import StudentProfile from "@/lib/models/Student";

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error)
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status },
      );
    await connectToDatabase();

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfThisQuarter = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1,
    );
    const startOfLastQuarter = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3 - 3,
      1,
    );

    // Tenant isolation
    const isSuperAdmin = auth.user.role === "gwd_super_admin";
    const academyObjectId = auth.academyId
      ? new mongoose.Types.ObjectId(auth.academyId.toString())
      : null;
    const tenantFilter: any =
      !isSuperAdmin && academyObjectId ? { academyId: academyObjectId } : {};

    // 1. All Payments Aggregation
    const payments = await FeePayment.find(tenantFilter).lean();

    let lifetimeRevenue = 0;
    let lifetimePlatformFee = 0;
    let lifetimeCount = 0;
    let monthlyRevenue = 0;
    let lastMonthRevenue = 0;
    let quarterRevenue = 0;
    let lastQuarterRevenue = 0;
    let pendingRevenue = 0;
    let pendingCount = 0;
    let failedRevenue = 0;
    let failedCount = 0;
    let successCount = 0;

    const dailyMap: Record<string, number> = {};

    /**
     * ════════════════════════════════════════════════════════════════════════
     * AN ACADEMY'S LEDGER SHOWS WHAT REACHES THE ACADEMY
     * ════════════════════════════════════════════════════════════════════════
     *
     * `amount` is what the PARENT paid: coaching fee + the convenience fee GWD
     * charges for processing the payment. Reporting that as an academy's
     * revenue overstates it by money they never receive and cannot bank, and
     * it will not reconcile against their settlement statement.
     *
     * So an academy admin sees `academyAmountPaise` — their portion. A super
     * admin keeps seeing the gross, because platform GMV genuinely is the total
     * that moved, and the platform's own cut is reported separately below.
     *
     * Falls back to `amount` when the paise columns are absent: rows written
     * before the split existed have no separate academy figure, and for offline
     * payments the two are equal by definition (no gateway, no margin).
     * ════════════════════════════════════════════════════════════════════════
     */
    const amountFor = (p: any): number => {
      if (isSuperAdmin) return p.amount || 0;
      if (typeof p.academyAmountPaise === "number")
        return p.academyAmountPaise / 100;
      return p.baseAmount ?? p.amount ?? 0;
    };

    payments.forEach((p: any) => {
      const pDate = new Date(p.createdAt || p.paymentDate);
      const dKey = pDate.toISOString().split("T")[0];
      const value = amountFor(p);

      if (p.status === "success") {
        lifetimeRevenue += value;
        lifetimePlatformFee += p.platformFee || 0;
        lifetimeCount++;
        successCount++;

        if (pDate >= startOfThisMonth) monthlyRevenue += value;
        else if (pDate >= startOfLastMonth && pDate < startOfThisMonth)
          lastMonthRevenue += value;

        if (pDate >= startOfThisQuarter) quarterRevenue += value;
        else if (pDate >= startOfLastQuarter && pDate < startOfThisQuarter)
          lastQuarterRevenue += value;

        dailyMap[dKey] = (dailyMap[dKey] || 0) + value;
      } else if (p.status === "pending") {
        pendingRevenue += value;
        pendingCount++;
      } else if (p.status === "failed") {
        failedRevenue += value;
        failedCount++;
      }
    });

    const monthGrowth =
      lastMonthRevenue > 0
        ? Math.round(
            ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100,
          )
        : monthlyRevenue > 0
          ? 100
          : 0;

    const quarterGrowth =
      lastQuarterRevenue > 0
        ? Math.round(
            ((quarterRevenue - lastQuarterRevenue) / lastQuarterRevenue) * 100,
          )
        : quarterRevenue > 0
          ? 100
          : 0;

    const totalCount = payments.length;
    const collectionRate =
      totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

    // 2. Defaulters (Students with outstanding fees)
    const defaulterStudents = await StudentProfile.find({
      outstandingFees: { $gt: 0 },
      isActive: ACTIVE,
      ...tenantFilter,
    })
      .populate("userId", "name email phone")
      .lean();

    let overdueRevenue = 0;
    const defaulters = defaulterStudents.map((s: any) => {
      overdueRevenue += s.outstandingFees || 0;
      return {
        studentId: s._id.toString(),
        /**
         * The USER id, not the profile id above. Recording an offline payment
         * (/api/payments/pay) resolves the student by `userId`, so a caller
         * handed only `studentId` would look up a profile that does not exist
         * and fail with "Student profile not found".
         */
        userId: s.userId?._id?.toString() ?? null,
        name: s.userId?.name || "Unknown Student",
        email: s.userId?.email || "N/A",
        phone: s.userId?.phone || "N/A",
        outstandingFees: s.outstandingFees || 0,
        level: s.level || "beginner",
      };
    });

    // 3. Status Breakdown
    const statusBreakdown = {
      success: {
        status: "success",
        label: "Success",
        count: successCount,
        total: lifetimeRevenue,
        percentage: collectionRate,
      },
      pending: {
        status: "pending",
        label: "Pending",
        count: pendingCount,
        total: pendingRevenue,
        percentage:
          totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0,
      },
      failed: {
        status: "failed",
        label: "Failed",
        count: failedCount,
        total: failedRevenue,
        percentage:
          totalCount > 0 ? Math.round((failedCount / totalCount) * 100) : 0,
      },
    };

    // 4. Daily Trend
    const dailyTrend = Object.keys(dailyMap)
      .sort()
      .slice(-14)
      .map((d) => ({
        date: d,
        amount: dailyMap[d],
      }));

    /**
     * ════════════════════════════════════════════════════════════════════════
     * REMOVED: academyRevenue, topPayers, monthlyTrend
     * ════════════════════════════════════════════════════════════════════════
     *
     * The owner asked for the three cards these fed to come off the dashboard.
     * Deleting them here too, rather than leaving the server computing figures
     * nobody renders.
     *
     * `academyRevenue` had to go regardless of the UI. It did not measure
     * per-academy revenue at all — it divided platform lifetime revenue evenly
     * across every active academy and labelled the quotient with each academy's
     * name ("Even distribution mock if not linked directly"). On a one-academy
     * platform that happens to look right, which is exactly how it survived;
     * the moment a second customer signed up it would have reported both
     * academies earning half of a total neither of them earned. Payments do
     * carry a real `academyId`, so this is recoverable as a genuine $group if
     * the card is ever wanted back — but it must not return as an estimate.
     *
     * `topPayers` also cost an aggregation plus five sequential
     * findById().populate() round-trips on every dashboard load.
     * ════════════════════════════════════════════════════════════════════════
     */

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          lifetimeRevenue,
          lifetimePlatformFee,
          lifetimeCount,
          monthlyRevenue,
          monthGrowth,
          quarterRevenue,
          quarterGrowth,
          collectionRate,
          pendingRevenue,
          pendingCount,
          overdueRevenue,
          overdueCount: defaulters.length,
        },
        statusBreakdown,
        dailyTrend,
        defaulters,
      },
    });
  } catch (error: any) {
    console.error("[API_ADMIN_FINANCE_ANALYTICS_GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
