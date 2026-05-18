const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const levels = ["U12", "U14", "U16", "U19", "U23"];

// Connect to MongoDB
async function updateLevels() {
  try {
    const mongoUri = process.env.DB_URI;
    if (!mongoUri) throw new Error("DB_URI is not defined in .env");
    
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, { dbName: "sports" });
    console.log("Connected to MongoDB.");

    // Define minimal schema to access the collection
    const StudentProfileSchema = new mongoose.Schema({}, { strict: false });
    const StudentProfile = mongoose.model('StudentProfile', StudentProfileSchema, 'studentprofiles');

    const students = await StudentProfile.find({});
    console.log(`Found ${students.length} students. Updating levels...`);

    let updatedCount = 0;
    for (const student of students) {
      // Pick a random level from the array
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      
      await StudentProfile.updateOne(
        { _id: student._id },
        { $set: { level: randomLevel, sports: ["cricket"] } } // Ensure sport is cricket too just in case
      );
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} student profiles with random cricket levels.`);
  } catch (err) {
    console.error("Error updating levels:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

updateLevels();
