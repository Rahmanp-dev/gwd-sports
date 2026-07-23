import mongoose from 'mongoose';
import User from './src/lib/models/User';
import StudentProfile from './src/lib/models/Student';

async function addFee() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sports');
    console.log("Connected to DB");

    const user = await User.findOne({ email: 'dummy.student@example.com' });
    if (!user) {
      console.log("Dummy student not found");
      process.exit(1);
    }

    const profile = await StudentProfile.findOne({ userId: user._id });
    if (!profile) {
      console.log("Student profile not found");
      process.exit(1);
    }

    // Set outstanding fees to 5000 to test the new logic
    profile.outstandingFees = 5000;
    await profile.save();

    console.log(`Successfully set outstanding fees to ₹5,000 for ${user.name}`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

addFee();
