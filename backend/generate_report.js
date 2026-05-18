import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const DB_URI = 'mongodb+srv://ashishgoutham:euBnIYT3CN0fjMjK@cluster0.thkfph1.mongodb.net/?appName=Cluster0';
const DB_NAME = 'sports';

async function generateReport() {
  const client = new MongoClient(DB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    const students = await db.collection('users').find({ role: 'student' }).toArray();
    const studentProfiles = await db.collection('studentprofiles').find({}).toArray();

    let csvContent = "Name,Email,Category,Level,Enrollment Date,Total Fees Paid (INR),Outstanding Dues (INR),Avg Attendance (Last 60 Days),Overall Performance Score,Kits Requested\n";

    for (const student of students) {
      const profile = studentProfiles.find(p => p.userId.toString() === student._id.toString());
      if (!profile) continue;

      // Category derivation
      const emailDomain = student.email.split('@')[0];
      const categoryMatch = emailDomain.match(/\.(u12|u14|u16|u19|u23)$/i);
      const category = categoryMatch ? categoryMatch[1].toUpperCase() : 'UNKNOWN';

      // Attendance calc
      const totalDays = profile.attendance.length;
      const presentDays = profile.attendance.filter(a => a.present).length;
      const attPercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) + '%' : 'N/A';

      // Performance calc
      const totalScore = profile.performance.reduce((sum, p) => sum + p.score, 0);
      const avgScore = profile.performance.length > 0 ? Math.round(totalScore / profile.performance.length) : 'N/A';

      const kits = profile.kits ? profile.kits.length : 0;

      csvContent += `${student.name},${student.email},${category},${profile.level},${profile.enrollmentDate.toISOString().split('T')[0]},${profile.totalFeesPaid},${profile.outstandingFees},${attPercent},${avgScore},${kits}\n`;
    }

    const outputPath = path.join(process.cwd(), '..', 'MasterGrade_Combined_Student_Report.csv');
    fs.writeFileSync(outputPath, csvContent);
    console.log(`Report generated successfully at: ${outputPath}`);
    
    // Calculate global stats
    const totalStudents = students.length;
    const totalRevenue = studentProfiles.reduce((sum, p) => sum + p.totalFeesPaid, 0);
    const totalDues = studentProfiles.reduce((sum, p) => sum + p.outstandingFees, 0);
    
    console.log(`\n--- GLOBAL STATS ---`);
    console.log(`Total Students: ${totalStudents}`);
    console.log(`Total Revenue: ₹${totalRevenue}`);
    console.log(`Total Outstanding: ₹${totalDues}`);

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

generateReport();
