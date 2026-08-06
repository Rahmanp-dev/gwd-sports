import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { GlobalSettings } from '@/lib/models/Settings';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const settings = await GlobalSettings.findOne().select('heroMode heroImages currency logoUrl logoAlignment logoIsCircular logoScale');
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          heroMode: 'video',
          heroImages: [],
          currency: 'INR'
        }
      });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('[api/homepage/settings]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
