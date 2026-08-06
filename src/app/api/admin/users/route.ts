import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import User from '@/lib/models/User';
import { ensureRoleProfile } from '@/lib/auth/ensureRoleProfile';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    
    const filter: any = {};
    // Tenant isolation: scope by academyId for non-super-admins
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      filter.academyId = auth.academyId;
    }
    if (role) filter.role = role;
    if (isActive === 'true') filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error: any) {
    console.error('[api/admin/users]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const data = await req.json();
    // Tenant isolation: force academyId for non-super-admins
    if (auth.user.role !== 'gwd_super_admin' && auth.academyId) {
      data.academyId = auth.academyId;
    }
    const existing = await User.findOne({ email: data.email });
    if (existing) return NextResponse.json({ success: false, message: 'User exists' }, { status: 409 });

    const user = new User(data);
    await user.save();

    /**
     * A trainer or student is not usable until their profile row exists —
     * batches, attendance and fee resolution all read the profile, not the
     * user. See lib/auth/ensureRoleProfile.ts.
     */
    await ensureRoleProfile({
      userId: user._id as mongoose.Types.ObjectId,
      role: user.role,
      academyId: user.academyId ?? null,
      sports: Array.isArray(data.sports) ? data.sports : [],
    });

    return NextResponse.json({ success: true, data: { user } }, { status: 201 });
  } catch (error: any) {
    console.error('[api/admin/users]', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
