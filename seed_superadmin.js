const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function setSuperAdminPassword() {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('sports');
    const passwordHash = await bcrypt.hash('password123', 12);
    
    let sa = await db.collection('users').findOne({ email: 'superadmin@gwd.in' });
    if (!sa) {
      await db.collection('users').insertOne({
        name: 'GWD Super Admin',
        email: 'superadmin@gwd.in',
        password: passwordHash,
        phone: '+919999900000',
        role: 'gwd_super_admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Super Admin user created: superadmin@gwd.in');
    } else {
      await db.collection('users').updateOne(
        { email: 'superadmin@gwd.in' },
        { $set: { password: passwordHash, isActive: true, role: 'gwd_super_admin' } }
      );
      console.log('Super Admin user updated: superadmin@gwd.in');
    }
  } finally {
    await client.close();
  }
}

setSuperAdminPassword().catch(console.error);
