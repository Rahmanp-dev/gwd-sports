import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Academy from '@/lib/models/Academy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    const { slug } = await params;
    
    const academy = await Academy.findOne({ slug, isActive: true })
      .select('-rzp_account -platformFeePercent -createdBy -trainers -students -__v')
      .lean();

    if (!academy) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    // Get student count separately
    const fullAcademy = await Academy.findOne({ slug }).select('students').lean();
    const studentCount = (fullAcademy as any)?.students?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        academy: {
          ...(academy as any),
          studentCount
        }
      }
    });
  } catch (error) {
    console.error('[API_ACADEMY_PUBLIC_DETAIL]', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
