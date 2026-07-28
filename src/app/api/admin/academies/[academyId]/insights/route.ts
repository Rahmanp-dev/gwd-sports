import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { getAcademyInsights } from '@/lib/admin/academyInsights';

/**
 * Deep usage picture for ONE academy.
 *
 * Super admin only — this exposes an academy's collection figures and its
 * owner's sign-in recency, which is GWD's commercial view of a customer and
 * emphatically not something the academy's own admin should be able to read
 * about anyone (including themselves, via a guessed id).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ academyId: string }> },
) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();
    const { academyId } = await params;

    const insights = await getAcademyInsights(academyId);
    if (!insights) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: insights });
  } catch (error: any) {
    console.error('[admin/insights] failed:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Could not load academy insights' },
      { status: 500 },
    );
  }
}
