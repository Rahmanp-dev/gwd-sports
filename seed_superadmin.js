require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/sports';
const EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@gwd.in';
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'GwdAdmin123!';

async function setSuperAdminPassword() {
  const client = new MongoClient(DB_URI);
  try {
    await client.connect();
    const db = client.db();
    const passwordHash = await bcrypt.hash(PASSWORD, 12);

    let sa = await db.collection('users').findOne({ email: EMAIL });
    if (!sa) {
      await db.collection('users').insertOne({
        name: 'GWD Super Admin',
        email: EMAIL,
        password: passwordHash,
        phone: '+919999900000',
        role: 'gwd_super_admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Super Admin user created: ${EMAIL}`);
    } else {
      await db.collection('users').updateOne(
        { email: EMAIL },
        { $set: { password: passwordHash, isActive: true, role: 'gwd_super_admin' } }
      );
      console.log(`Super Admin user updated: ${EMAIL}`);
    }
  } finally {
    await client.close();
  }
}

setSuperAdminPassword().catch(console.error);
