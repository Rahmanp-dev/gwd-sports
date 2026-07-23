import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Academy from '@/lib/models/Academy';
import { adminMiddleware } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const totalAcademies = await Academy.countDocuments({ isActive: true });
    const academies = await Academy.find({ isActive: true }).skip(skip).limit(limit).lean();
    const totalPages = Math.ceil(totalAcademies / limit) || 1;

    return NextResponse.json({
      success: true,
      data: {
        academies,
        pagination: {
          currentPage: page,
          totalPages,
          totalAcademies,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('[API_ACADEMY_GET]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false }, { status: auth.status });
    await connectToDatabase();
    const data = await req.json();
    const academy = new Academy(data);
    await academy.save();
    return NextResponse.json({ success: true, data: { academy } }, { status: 201 });
  } catch (error) {
    console.error('[API_ACADEMY_POST]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
