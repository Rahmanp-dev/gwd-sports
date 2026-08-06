import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { Academy } from '@/lib/models/Academy';
import { User } from '@/lib/models/User';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session = null;
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    // We can await params if needed by the router
    await params;

    await connectToDatabase();
    
    const body = await req.json();
    const { academy: academyData, owner: ownerData } = body;

    if (!academyData || !ownerData) {
      return NextResponse.json(
        { success: false, message: 'Both academy and owner data are required' },
        { status: 400 }
      );
    }

    // Basic validation
    if (!ownerData.email || !ownerData.password || !ownerData.name || !ownerData.phone) {
      return NextResponse.json(
        { success: false, message: 'Missing required owner fields' },
        { status: 400 }
      );
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email: ownerData.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    if (academyData.slug) {
      const existingAcademy = await Academy.findOne({ slug: academyData.slug });
      if (existingAcademy) {
        return NextResponse.json(
          { success: false, message: 'Academy with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Start a transaction for creating both user and academy
    session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create the user (Academy Admin)
      const adminUser = new User({
        name: ownerData.name,
        email: ownerData.email,
        password: ownerData.password,
        phone: ownerData.phone,
        role: 'admin',
        isActive: true,
      });

      // 2. Create the academy
      const academy = new Academy({
        ...academyData,
        createdBy: auth.user._id,
        ownerId: adminUser._id, // Set the new user as owner
      });

      await academy.save({ session });

      // 3. Update the admin user with the academyId
      adminUser.academyId = academy._id as mongoose.Types.ObjectId;
      await adminUser.save({ session });

      await session.commitTransaction();
      
      return NextResponse.json(
        { 
          success: true, 
          data: { 
            academy, 
            owner: adminUser 
          } 
        }, 
        { status: 201 }
      );
    } catch (txError: any) {
      console.error('[api/admin/academies/[id]/onboard]', txError instanceof Error ? txError.message : txError);
      await session.abortTransaction();
      throw txError;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error('Error during academy onboarding:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
