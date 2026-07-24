import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { Academy } from '@/lib/models/Academy';

const DOMAIN_REGEX = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { customDomain } = body as { customDomain: string | null };

    // Allow clearing the custom domain
    if (customDomain !== null) {
      if (typeof customDomain !== 'string' || !DOMAIN_REGEX.test(customDomain)) {
        return NextResponse.json(
          { success: false, message: 'Invalid domain format. Example: championsfc.com' },
          { status: 400 }
        );
      }

      // Check uniqueness
      const existing = await Academy.findOne({ customDomain, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'This domain is already assigned to another academy.' },
          { status: 409 }
        );
      }
    }

    const updated = await Academy.findByIdAndUpdate(
      id,
      { customDomain: customDomain ?? null },
      { new: true }
    ).select('name slug customDomain');

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Academy not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Custom domain update error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
