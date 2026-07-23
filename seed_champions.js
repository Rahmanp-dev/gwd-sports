const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function run() {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('sports');
    
    const passwordHash = await bcrypt.hash('password123', 12);
    const academyId = new ObjectId();
    
    let user = await db.collection('users').findOne({ email: 'admin@championsfc.com' });
    let userId;
    
    if (!user) {
      const userRes = await db.collection('users').insertOne({
        name: 'ChampionsFC Admin',
        email: 'admin@championsfc.com',
        password: passwordHash,
        phone: '+919999999999',
        role: 'admin',
        isActive: true,
        academyId: academyId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      userId = userRes.insertedId;
      console.log('Admin user created');
    } else {
      userId = user._id;
      await db.collection('users').updateOne(
        { _id: userId },
        { $set: { password: passwordHash, academyId: academyId } }
      );
      console.log('Admin user updated');
    }

    let academy = await db.collection('academies').findOne({ slug: 'championsfc' });
    if (!academy) {
      await db.collection('academies').insertOne({
        _id: academyId,
        name: 'ChampionsFC',
        slug: 'championsfc',
        description: 'Premium Football Academy for Champions',
        location: 'Bangalore',
        address: '123 Sports Arena, Bangalore',
        sports: ['football'],
        trainers: [],
        students: [],
        fees: { monthly: 5000, quarterly: 12000, yearly: 40000 },
        contactInfo: { name: 'Admin', phone: '+919999999999', email: 'admin@championsfc.com' },
        facilities: ['Turf', 'Floodlights'],
        timings: { opening: '06:00', closing: '22:00', workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
        capacity: 500,
        isActive: true,
        createdBy: userId,
        ownerId: userId,
        platformFeePercent: 5,
        theme: {
          primaryColor: '#2563eb',
          accentColor: '#1d4ed8',
          logoUrl: '',
          heroImages: [],
          tagline: 'We build champions'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Academy created');
    } else {
      await db.collection('academies').updateOne(
        { _id: academy._id },
        { $set: { ownerId: userId, createdBy: userId } }
      );
      await db.collection('users').updateOne(
        { _id: userId },
        { $set: { academyId: academy._id } }
      );
      console.log('Academy updated');
    }
    
    console.log('Seeding complete! Login with: admin@championsfc.com / password123');
  } finally {
    await client.close();
  }
}

run().catch(console.error);
