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
/**
 * The dynamic segment MUST be named `[id]`, matching its siblings under
 * api/admin/academies (`[id]/route.ts`, `[id]/onboard`, `[id]/custom-domain`).
 * Next.js allows only one slug name per path position across the whole route
 * tree — a second name ('academyId') does not just break this route, it fails
 * the entire router build and every API route on the deployment returns 500.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();
    const { id } = await params;

    const insights = await getAcademyInsights(id);
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
