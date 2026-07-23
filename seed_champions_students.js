const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seedStudents() {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('sports');

    // 1. Find ChampionsFC Academy
    const academy = await db.collection('academies').findOne({ slug: 'championsfc' });
    if (!academy) {
      console.error('ChampionsFC academy not found! Please run seed_champions.js first.');
      return;
    }
    const academyId = academy._id;
    console.log('Found ChampionsFC Academy ID:', academyId.toString());

    const passwordHash = await bcrypt.hash('password123', 12);

    const studentsData = [
      {
        name: 'Aarav Sharma',
        email: 'aarav.champions@gwd.com',
        phone: '+919876543210',
        level: 'U14',
        sports: ['football'],
        outstandingFees: 5000,
        totalFeesPaid: 0,
        feePayments: []
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan.champions@gwd.com',
        phone: '+919876543211',
        level: 'U16',
        sports: ['football'],
        outstandingFees: 3500,
        totalFeesPaid: 0,
        feePayments: []
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.champions@gwd.com',
        phone: '+919876543212',
        level: 'advanced',
        sports: ['football'],
        outstandingFees: 5000,
        totalFeesPaid: 5000,
        feePayments: [
          {
            amount: 5000,
            paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            period: 'monthly',
            status: 'paid',
            transactionId: 'PAY_INITIAL_PREV_MONTH'
          }
        ]
      },
      {
        name: 'Ananya Patel',
        email: 'ananya.champions@gwd.com',
        phone: '+919876543213',
        level: 'beginner',
        sports: ['football'],
        outstandingFees: 2500,
        totalFeesPaid: 0,
        feePayments: []
      }
    ];

    const studentUserIds = [];

    for (const data of studentsData) {
      let user = await db.collection('users').findOne({ email: data.email });
      let userId;

      if (!user) {
        const userRes = await db.collection('users').insertOne({
          name: data.name,
          email: data.email,
          password: passwordHash,
          phone: data.phone,
          role: 'student',
          sports: data.sports,
          academyId: academyId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        userId = userRes.insertedId;
        console.log(`Created user: ${data.name} (${data.email})`);
      } else {
        userId = user._id;
        await db.collection('users').updateOne(
          { _id: userId },
          { $set: { academyId: academyId, role: 'student', password: passwordHash, isActive: true } }
        );
        console.log(`Updated user: ${data.name} (${data.email})`);
      }

      studentUserIds.push(userId);

      // Student Profile
      let profile = await db.collection('studentprofiles').findOne({ userId: userId });
      if (!profile) {
        await db.collection('studentprofiles').insertOne({
          userId: userId,
          academyId: academyId,
          trainers: [],
          enrollmentDate: new Date(),
          totalFeesPaid: data.totalFeesPaid,
          outstandingFees: data.outstandingFees,
          sports: data.sports,
          level: data.level,
          medicalInfo: { allergies: [], medications: [] },
          isActive: true,
          feePayments: data.feePayments,
          attendance: [],
          kits: [],
          performance: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created profile for: ${data.name}`);
      } else {
        await db.collection('studentprofiles').updateOne(
          { _id: profile._id },
          {
            $set: {
              academyId: academyId,
              outstandingFees: data.outstandingFees,
              totalFeesPaid: data.totalFeesPaid,
              level: data.level,
              sports: data.sports,
              feePayments: data.feePayments,
              isActive: true,
              updatedAt: new Date()
            }
          }
        );
        console.log(`Updated profile for: ${data.name}`);
      }
    }

    // Update Academy's students list
    await db.collection('academies').updateOne(
      { _id: academyId },
      { $addToSet: { students: { $each: studentUserIds } } }
    );
    console.log(`Added ${studentUserIds.length} students to ChampionsFC academy record.`);

    console.log('\n--- SEED COMPLETE ---');
    console.log('Students created with password "password123":');
    studentsData.forEach(s => console.log(`- ${s.name}: ${s.email} (Due: ₹${s.outstandingFees})`));

  } finally {
    await client.close();
  }
}

seedStudents().catch(console.error);
