require("dotenv").config();
const mongoose = require("mongoose");

const DB_URI = process.env.DB_URI || "mongodb+srv://admin:admin123@cluster0.thkfph1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sports: [String],
  level: String,
  performance: [{
    sport: String,
    score: Number,
    maxScore: Number,
    remarks: String,
    evaluatedBy: mongoose.Schema.Types.ObjectId,
    evaluatedAt: Date,
    category: String
  }],
}, { strict: false });

const settingsSchema = new mongoose.Schema({
  performanceMetrics: [String]
}, { strict: false });

const userSchema = new mongoose.Schema({
  role: String
}, { strict: false });

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema, "studentprofiles");
const GlobalSettings = mongoose.model("GlobalSettings", settingsSchema, "globalsettings");
const User = mongoose.model("User", userSchema, "users");

const cricketMetrics = ["Batting Average", "Bowling Strike Rate", "Fielding", "Fitness", "Running Between Wickets", "Match Strategy"];
const remarksList = [
  "Excellent form and consistency.",
  "Needs improvement on footwork.",
  "Good progress over the last month.",
  "Showing great potential.",
  "Needs to work on stamina.",
  "Outstanding performance in practice matches."
];

async function main() {
  try {
    console.log("Connecting to MongoDB at", DB_URI);
    await mongoose.connect(DB_URI, { dbName: "sports" });
    console.log("Connected successfully!");

    // 1. Update Global Settings
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = new GlobalSettings({ performanceMetrics: cricketMetrics });
    } else {
      // Merge unique metrics
      const merged = new Set([...(settings.performanceMetrics || []), ...cricketMetrics]);
      settings.performanceMetrics = Array.from(merged);
    }
    await settings.save();
    console.log("Updated GlobalSettings with Cricket performance metrics.");

    // 2. Fetch all trainers to use as evaluatedBy
    const trainers = await User.find({ role: "trainer" });
    const trainerIds = trainers.map(t => t._id);
    const fallbackTrainerId = trainerIds.length > 0 ? trainerIds[0] : new mongoose.Types.ObjectId();

    // 3. Update Cricket Students
    const students = await StudentProfile.find({ sports: { $in: [/cricket/i] } });
    console.log(`Found ${students.length} students enrolled in Cricket.`);

    for (const student of students) {
      // Create 3 to 6 random performance records
      const numRecords = Math.floor(Math.random() * 4) + 3;
      const newPerformances = [];

      for (let i = 0; i < numRecords; i++) {
        const randomMetric = cricketMetrics[Math.floor(Math.random() * cricketMetrics.length)];
        const randomScore = Math.floor(Math.random() * 50) + 50; // Score between 50 and 100
        const randomRemark = remarksList[Math.floor(Math.random() * remarksList.length)];
        // Random date within last 90 days
        const randomDate = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000));
        const randomTrainerId = trainerIds.length > 0 ? trainerIds[Math.floor(Math.random() * trainerIds.length)] : fallbackTrainerId;

        newPerformances.push({
          sport: "cricket",
          category: randomMetric,
          score: randomScore,
          maxScore: 100,
          remarks: randomRemark,
          evaluatedBy: randomTrainerId,
          evaluatedAt: randomDate
        });
      }

      // Append or replace? Let's just append
      student.performance = [...(student.performance || []), ...newPerformances];
      await student.save();
    }

    console.log(`Successfully added random performance metrics to ${students.length} students!`);

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

main();
