import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import { GlobalSettings } from '@/lib/models/Settings';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    // Tenant isolation: each academy has its own settings
    const settingsFilter = auth.academyId ? { academyId: auth.academyId } : { academyId: null };
    let settings = await GlobalSettings.findOne(settingsFilter);
    if (!settings) {
        settings = await GlobalSettings.create({
        ...settingsFilter,
        performanceMetrics: ['dribble', 'running', 'defending', 'strike', 'stamina'],
        defaultFeeAmount: 1000,
        });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('[api/admin/settings]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const body = await req.json();
    const { performanceMetrics, defaultFeeAmount, currency, heroMode, heroImages, logoUrl, logoAlignment, logoIsCircular, logoScale, themeColor } = body;
    
    // Tenant isolation
    const settingsFilter = auth.academyId ? { academyId: auth.academyId } : { academyId: null };
    let settings = await GlobalSettings.findOne(settingsFilter);
    if (!settings) {
        settings = await GlobalSettings.create(settingsFilter);
    }

    if (performanceMetrics) settings.performanceMetrics = performanceMetrics;
    if (defaultFeeAmount !== undefined) settings.defaultFeeAmount = defaultFeeAmount;
    if (currency) settings.currency = currency;
    if (heroMode) settings.heroMode = heroMode;
    if (heroImages) settings.heroImages = heroImages;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (logoAlignment) settings.logoAlignment = logoAlignment;
    if (logoIsCircular !== undefined) settings.logoIsCircular = logoIsCircular;
    if (logoScale !== undefined) settings.logoScale = logoScale;
    if (themeColor !== undefined) settings.themeColor = themeColor;

    await settings.save();

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('[api/admin/settings]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
