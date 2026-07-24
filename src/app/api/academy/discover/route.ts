import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Academy from '@/lib/models/Academy';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const academies = await Academy.find({ isActive: true })
      .select('name slug location sports coordinates ecosystemScore theme.primaryColor theme.logoUrl verificationStatus gwdFoundingAcademy establishedYear coachName achievements students capacity')
      .sort({ ecosystemScore: -1 })
      .lean();

    // Compute stats
    const allSports = new Set<string>();
    const allCities = new Set<string>();
    academies.forEach((a: any) => {
      a.sports?.forEach((s: string) => allSports.add(s));
      if (a.location) allCities.add(a.location.split(',')[0].trim());
    });

    // Add studentCount to each academy
    const enriched = academies.map((a: any) => ({
      ...a,
      studentCount: a.students?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        academies: enriched,
        stats: {
          totalAcademies: academies.length,
          totalSports: allSports.size,
          sports: Array.from(allSports),
          cities: Array.from(allCities),
          primaryCity: Array.from(allCities)[0] || 'India'
        }
      }
    });
  } catch (error) {
    console.error('[API_ACADEMY_DISCOVER]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
