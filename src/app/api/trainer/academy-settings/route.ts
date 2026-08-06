import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { GlobalSettings } from '@/lib/models/Settings';

const DEFAULT_METRICS = ['dribble', 'running', 'defending', 'strike', 'stamina'];

export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['trainer', 'admin', 'gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();

    const settingsFilter = auth.academyId ? { academyId: auth.academyId } : { academyId: null };
    let settings = await GlobalSettings.findOne(settingsFilter).select(
      'performanceMetrics defaultFeeAmount currency',
    );

    if (!settings) {
      settings = await GlobalSettings.create({
        ...settingsFilter,
        performanceMetrics: DEFAULT_METRICS,
        defaultFeeAmount: 1000,
        currency: 'INR',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        performanceMetrics: settings.performanceMetrics || DEFAULT_METRICS,
        defaultFeeAmount: settings.defaultFeeAmount,
        currency: settings.currency,
      },
    });
  } catch (error: any) {
    console.error('[api/trainer/academy-settings]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
