import mongoose from 'mongoose';

async function seedDummyStudent() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports';
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const Academy = mongoose.model('Academy', new mongoose.Schema({ name: String }, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({ email: String, name: String, role: String, isActive: Boolean, password: String }, { strict: false }));
  const StudentProfile = mongoose.model('StudentProfile', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, academyId: mongoose.Schema.Types.ObjectId, outstandingFees: Number, level: String }, { strict: false }));

  // Find MasterGrade Sports Academy
  let academy = await Academy.findOne({ name: { $regex: /MasterGrade Sports Academy/i } });
  
  if (!academy) {
    console.log("MasterGrade Sports Academy not found. Looking for any academy...");
    academy = await Academy.findOne();
    if (!academy) {
        console.log("No academy found. Creating a dummy academy...");
        academy = await Academy.create({
            name: "MasterGrade Sports Academy",
            description: "Dummy Academy",
            location: "Test Location",
            address: "Test Address",
            sports: ["football"],
            fees: { monthly: 3000, quarterly: 8000, yearly: 30000 },
            contactInfo: { name: "Test Contact", phone: "9876543210", email: "contact@mgfc.com" },
            capacity: 100,
            timings: { opening: "09:00", closing: "18:00", workingDays: ["monday"] },
            isActive: true,
            createdBy: new mongoose.Types.ObjectId()
        });
    }
  }

  console.log(`Using Academy: ${academy.name} (${academy._id})`);

  // Create Dummy User
  const userEmail = "dummy.student@example.com";
  let user = await User.findOne({ email: userEmail });
  if (!user) {
    user = await User.create({
      name: "Dummy Student",
      email: userEmail,
      password: "password123", // In a real app this would be hashed, but for test login they might bypass or need a hashed one. Wait! Let's hash it.
      role: "student",
      isActive: true,
      phone: "9999999999"
    });
    console.log(`Created User: ${user.name} (${user._id})`);
  } else {
    console.log(`User already exists: ${user.name} (${user._id})`);
  }

  // Create Student Profile
  let profile = await StudentProfile.findOne({ userId: user._id });
  if (!profile) {
    profile = await StudentProfile.create({
      userId: user._id,
      academyId: academy._id,
      outstandingFees: 3000,
      level: "beginner",
      feePayments: [],
      isActive: true
    });
    console.log(`Created StudentProfile with outstandingFees: 3000`);
  } else {
    profile.outstandingFees = 3000;
    profile.academyId = academy._id;
    await profile.save();
    console.log(`Updated StudentProfile with outstandingFees: 3000`);
  }

  console.log("Done.");
  process.exit(0);
}

seedDummyStudent().catch(console.error);
