import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { roleMiddleware } from '@/lib/middleware/auth';
import { Academy } from '@/lib/models/Academy';
import { User } from '@/lib/models/User';
import mongoose from 'mongoose';
import type { CreateAcademyDTO } from '@/services/academyService';

export async function GET(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const academies = await Academy.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(); // Lean handles virtuals if configured, but here we manually map lengths

    const total = await Academy.countDocuments(query);

    const formattedAcademies = academies.map((academy: any) => ({
      ...academy,
      studentCount: academy.students?.length || 0,
      trainerCount: academy.trainers?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        academies: formattedAcademies,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching academies:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await roleMiddleware(req, ['gwd_super_admin']);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }

    await connectToDatabase();
    
    const body = await req.json();

    // Onboard flow: CreateAcademyDTO from super-admin deploy modal
    if (body.adminEmail) {
      const {
        name,
        slug,
        location = 'TBD',
        capacity = 500,
        platformFeePercent = 1,
        adminEmail,
        adminPassword,
        adminName,
        adminPhone,
        sports = ['football'],
      } = body as CreateAcademyDTO & Record<string, unknown>;

      if (!name || !slug || !adminEmail || !adminPassword || !adminName || !adminPhone) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields: name, slug, adminEmail, adminPassword, adminName, adminPhone' },
          { status: 400 }
        );
      }

      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { success: false, message: 'Slug can only contain lowercase letters, numbers, and hyphens' },
          { status: 400 }
        );
      }

      const existingAcademy = await Academy.findOne({ slug });
      if (existingAcademy) {
        return NextResponse.json(
          { success: false, message: 'Academy with this slug already exists' },
          { status: 400 }
        );
      }

      const existingUser = await User.findOne({ email: adminEmail });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'User with this email already exists' },
          { status: 400 }
        );
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const adminUser = new User({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          phone: adminPhone,
          role: 'admin',
          isActive: true,
        });

        const academy = new Academy({
          name,
          slug,
          description: `${name} — powered by GWD Sports`,
          location,
          address: location,
          sports,
          fees: { monthly: 0, quarterly: 0, halfYearly: 0, yearly: 0 },
          contactInfo: { name: adminName, phone: adminPhone, email: adminEmail },
          facilities: [],
          timings: { opening: '06:00', closing: '20:00', workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
          capacity,
          images: [],
          platformFeePercent,
          createdBy: auth.user._id,
          ownerId: adminUser._id,
        });

        await academy.save({ session });
        adminUser.academyId = academy._id as mongoose.Types.ObjectId;
        await adminUser.save({ session });

        await session.commitTransaction();

        return NextResponse.json(
          { success: true, data: { academy, owner: adminUser } },
          { status: 201 }
        );
      } catch (txError: any) {
        await session.abortTransaction();
        throw txError;
      } finally {
        session.endSession();
      }
    }
    
    // Full academy form creation
    if (!body.name || !body.slug || !body.description || !body.location || !body.address || !body.sports || !body.fees || !body.contactInfo || !body.facilities || !body.timings || !body.capacity) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields for academy creation' },
        { status: 400 }
      );
    }

    // Slug validation
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(body.slug)) {
      return NextResponse.json(
        { success: false, message: 'Slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const existingAcademy = await Academy.findOne({ slug: body.slug });
    if (existingAcademy) {
      return NextResponse.json(
        { success: false, message: 'Academy with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Note: createdBy and ownerId typically require valid user IDs. 
    // If not provided in body, we might set the current super admin as createdBy, but let's assume body.ownerId is passed
    // If ownerId is missing, fail? Or let mongoose validate.
    
    const academyData = {
      ...body,
      createdBy: auth.user._id,
      // If ownerId isn't provided, temporarily assign it to the creator so schema validation doesn't fail.
      ownerId: body.ownerId || auth.user._id
    };

    const newAcademy = await Academy.create(academyData);

    return NextResponse.json({ success: true, data: newAcademy }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating academy:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
