import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/models/User';
import Student from '@/lib/models/Student';
import Trainer from '@/lib/models/Trainer';
import { isPlaceholderAccount, PLACEHOLDER_SIGNUP_MESSAGE } from '@/lib/auth/placeholder';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THIS ENDPOINT IS UNAUTHENTICATED — RETURN THE MINIMUM
 * ════════════════════════════════════════════════════════════════════════════
 *
 * It answers "does this address already have an account, and how far through
 * signup are they" so registration can route the person correctly. It has to be
 * callable before login, which means anyone can call it with any address.
 *
 * It previously returned the whole user document: name, email, phone, role,
 * academyId, active status, timestamps. Guessing or harvesting an address then
 * yielded a child's name and a contact phone number to an anonymous caller.
 * (The password hash was never exposed — it is `select: false` and stripped in
 * toJSON — but everything else was.)
 *
 * Now projected to `_id` and `name`, which is the least the registration flow
 * can work with: the id links the new profile to the existing user, and the
 * name is shown back as "Welcome <name>".
 *
 * RESIDUAL RISK, stated rather than hidden: an attacker can still confirm an
 * address exists and learn the associated first name. Closing that entirely
 * means not answering the question at all, which breaks registration. The right
 * next step is rate limiting per IP on this route — RATE_LIMIT_* env vars
 * already exist for it — not further trimming the payload.
 * ════════════════════════════════════════════════════════════════════════════
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });

    /**
     * `email` and `isImportedPlaceholder` are selected because
     * isPlaceholderAccount() below needs BOTH — it fails open without them,
     * which would re-expose the passport-id enumeration hole that guard exists
     * to close. Neither is echoed back to the caller; only `_id` and `name` are.
     */
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('_id name role email isImportedPlaceholder');
    if (!user) return NextResponse.json({ success: true, message: 'User not found' });

    /**
     * An imported student's address is derived from their public passport id.
     * Without this, anyone holding a passport id could confirm it maps to a
     * real student AND receive that student's user record below. Answered as a
     * registration prompt: the person is most likely a parent holding their own
     * child's details, and should be told what to do rather than stonewalled.
     */
    if (isPlaceholderAccount(user)) {
      return NextResponse.json({ success: true, message: PLACEHOLDER_SIGNUP_MESSAGE });
    }

    if (user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: user._id });
      if (!studentProfile) return NextResponse.json({ success: true, message: 'Student profile not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'User has a student profile', data: { user: { _id: user._id, name: user.name } } });
    }

    const studentProfile = await Student.findOne({ userId: user._id });
    if (studentProfile) {
      return NextResponse.json({ success: true, message: 'User has a student profile', data: { user: { _id: user._id, name: user.name } } });
    }

    if (user.role === 'trainer') {
      const trainerProfile = await Trainer.findOne({ userId: user._id });
      if (!trainerProfile) return NextResponse.json({ success: true, message: 'Trainer profile not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'User has a trainer profile', data: { user: { _id: user._id, name: user.name } } });
    } else if (user.role === 'admin') {
      return NextResponse.json({ success: false, message: 'Invalid user role for this operation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User has no other profile', data: { user: { _id: user._id, name: user.name } } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
