import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { Academy } from '@/lib/models/Academy';
import { User } from '@/lib/models/User';
import { FeePayment } from '@/lib/models/FeePayment';

export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();

    const [totalAcademies, totalStudents, revenueData] = await Promise.all([
      Academy.countDocuments(),
      User.countDocuments({ role: 'student', isActive: true }), // Only active students or all? Typically all, let's just use role: 'student'
      FeePayment.aggregate([
        { $match: { status: 'success' } },
        { 
          $group: { 
            _id: null, 
            totalRevenue: { $sum: "$amount" }, 
            totalPlatformFees: { $sum: "$platformFee" } 
          } 
        }
      ])
    ]);

    // If there are no payments, aggregate returns an empty array
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const totalPlatformFees = revenueData.length > 0 ? revenueData[0].totalPlatformFees : 0;

    // Just count all students regardless of active status unless requested otherwise
    const actualTotalStudents = await User.countDocuments({ role: 'student' });

    return NextResponse.json({
      success: true,
      data: {
        totalAcademies,
        totalStudents: actualTotalStudents,
        totalRevenue,
        totalPlatformFees,
      },
    });
  } catch (error: any) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
