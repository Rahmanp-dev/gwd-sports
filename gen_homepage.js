const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. /api/homepage/settings/route.ts
const settingsRoute = `import { NextRequest, NextResponse } from 'next/server';
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
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/homepage/settings');
fs.writeFileSync('src/app/api/homepage/settings/route.ts', settingsRoute);

// 2. /api/homepage/admin/events/route.ts (GET, POST)
const adminEventsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import LandingPageEventCard from '@/lib/models/HomepageEventCard';
import Event from '@/lib/models/Event';

export async function GET(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const eventCards = await LandingPageEventCard.find()
      .sort({ order: 1 })
      .populate({
        path: 'eventId',
        select: 'name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status'
      });

    return NextResponse.json({ success: true, data: eventCards });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch landing page events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { eventId, colorScheme } = await req.json();

    const event = await Event.findById(eventId);
    if (!event) return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });

    const existingCard = await LandingPageEventCard.findOne({ eventId });
    if (existingCard) return NextResponse.json({ success: false, message: 'Event is already added to landing page' }, { status: 400 });

    const highestOrder = await LandingPageEventCard.findOne().sort({ order: -1 }).select('order');
    const newOrder = highestOrder ? highestOrder.order + 1 : 1;

    const eventCard = await LandingPageEventCard.create({
      eventId,
      order: newOrder,
      colorScheme: colorScheme || 'from-green-600 to-emerald-500',
    });

    const populatedCard = await LandingPageEventCard.findById(eventCard._id).populate({
      path: 'eventId',
      select: 'name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status'
    });

    return NextResponse.json({ success: true, message: 'Event card added to landing page', data: populatedCard }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to add event card' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/homepage/admin/events');
fs.writeFileSync('src/app/api/homepage/admin/events/route.ts', adminEventsRoute);

// 3. /api/homepage/admin/events/[id]/route.ts (PUT, DELETE)
const adminEventsIdRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import LandingPageEventCard from '@/lib/models/HomepageEventCard';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const id = params.id;
    const { order, colorScheme, isActive } = await req.json();

    const eventCard = await LandingPageEventCard.findById(id);
    if (!eventCard) return NextResponse.json({ success: false, message: 'Event card not found' }, { status: 404 });

    if (order && order !== eventCard.order) {
      if (!Number.isInteger(order) || order < 1) {
        return NextResponse.json({ success: false, message: 'Order must be a positive integer' }, { status: 400 });
      }

      const totalCards = await LandingPageEventCard.countDocuments();
      if (order > totalCards) {
        return NextResponse.json({ success: false, message: \`Order cannot exceed \${totalCards}\` }, { status: 400 });
      }

      const oldOrder = eventCard.order;
      const newOrder = order;

      if (newOrder < oldOrder) {
        await LandingPageEventCard.updateMany(
          { order: { $gte: newOrder, $lt: oldOrder }, _id: { $ne: id } },
          { $inc: { order: 1 } }
        );
      } else {
        await LandingPageEventCard.updateMany(
          { order: { $gt: oldOrder, $lte: newOrder }, _id: { $ne: id } },
          { $inc: { order: -1 } }
        );
      }
      eventCard.order = newOrder;
    }

    if (colorScheme) eventCard.colorScheme = colorScheme;
    if (typeof isActive === 'boolean') eventCard.isActive = isActive;
    await eventCard.save();

    const updatedCard = await LandingPageEventCard.findById(id).populate({
      path: 'eventId',
      select: 'name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status'
    });

    return NextResponse.json({ success: true, message: 'Event card updated successfully', data: updatedCard });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to update event card' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const id = params.id;
    const eventCard = await LandingPageEventCard.findById(id);
    if (!eventCard) return NextResponse.json({ success: false, message: 'Event card not found' }, { status: 404 });

    const deletedOrder = eventCard.order;
    await LandingPageEventCard.findByIdAndDelete(id);
    await LandingPageEventCard.updateMany(
      { order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    return NextResponse.json({ success: true, message: 'Event card deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to delete event card' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/homepage/admin/events/[id]');
fs.writeFileSync('src/app/api/homepage/admin/events/[id]/route.ts', adminEventsIdRoute);


// 4. /api/homepage/admin/events/bulk/reorder/route.ts
const bulkReorderRoute = `import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import LandingPageEventCard from '@/lib/models/HomepageEventCard';

export async function PUT(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    await connectToDatabase();

    const { cards } = await req.json();

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ success: false, message: 'Cards array is required' }, { status: 400 });
    }

    const updatePromises = cards.map((card) =>
      LandingPageEventCard.findByIdAndUpdate(card.id, { order: card.order })
    );

    await Promise.all(updatePromises);

    const updatedCards = await LandingPageEventCard.find()
      .sort({ order: 1 })
      .populate({
        path: 'eventId',
        select: 'name description sport startDate endDate location venue status'
      });

    return NextResponse.json({ success: true, message: 'Cards reordered successfully', data: updatedCards });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to reorder cards' }, { status: 500 });
  }
}
`;

ensureDir('src/app/api/homepage/admin/events/bulk/reorder');
fs.writeFileSync('src/app/api/homepage/admin/events/bulk/reorder/route.ts', bulkReorderRoute);
