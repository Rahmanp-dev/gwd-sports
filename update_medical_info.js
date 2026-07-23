const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('sports');
    await db.collection('studentprofiles').updateMany(
      { 'medicalInfo.emergencyContact': { $exists: false } },
      { $set: { 'medicalInfo.emergencyContact': { name: 'Parent/Guardian', phone: '+91 9876543210', relation: 'Parent' } } }
    );
    console.log('Updated all student profiles with default emergencyContact.');
  } finally {
    await client.close();
  }
}
run().catch(console.error);
