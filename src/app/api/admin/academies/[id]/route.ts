import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { Academy } from '@/lib/models/Academy';
import { User } from '@/lib/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    await connectToDatabase();

    // Ensure User model is loaded for population
    if (!User) {
      console.warn("User model not loaded");
    }

    const academy = await Academy.findById(id)
      .populate('trainers', 'name email phone role isActive')
      .populate('students', 'name email phone role isActive');

    if (!academy) {
      return NextResponse.json(
        { success: false, message: 'Academy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: academy });
  } catch (error: any) {
    console.error('Error fetching academy:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin', 'admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Tenant authorization check
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId !== id) {
      return NextResponse.json({ success: false, message: 'Unauthorized to edit this academy' }, { status: 403 });
    }

    const body = await req.json();

    await connectToDatabase();

    const academy = await Academy.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!academy) {
      return NextResponse.json(
        { success: false, message: 'Academy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: academy });
  } catch (error: any) {
    console.error('Error updating academy:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    await connectToDatabase();

    const academy = await Academy.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!academy) {
      return NextResponse.json(
        { success: false, message: 'Academy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: academy });
  } catch (error: any) {
    console.error('Error deleting academy:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
