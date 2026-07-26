import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Since we are running outside Next.js, we need to redefine the models or import them.
// Next.js specific imports might fail if they use edge-specific code, but our models are standard Mongoose.
import Academy from '../src/lib/models/Academy';
import User from '../src/lib/models/User';
import GlobalSettings from '../src/lib/models/Settings';
import config from '../src/lib/env';

const DB_URI = process.env.DB_URI;

if (!DB_URI) {
  console.error("Please define the DB_URI environment variable inside .env.local");
  process.exit(1);
}

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(DB_URI!);
    console.log('Connected to database.');

    const salt = await bcrypt.genSalt(10);
    const superAdminPassword = await bcrypt.hash(config.SUPER_ADMIN_PASSWORD, salt);
    const academyAdminPassword = await bcrypt.hash('Admin123!', salt);
    const userPassword = await bcrypt.hash('User123!', salt);

    console.log('Seeding GWD Super Admin...');

    let superAdmin = await User.findOne({ email: config.SUPER_ADMIN_EMAIL });
    if (!superAdmin) {
      superAdmin = new User({
        name: 'GWD Super Admin',
        email: config.SUPER_ADMIN_EMAIL,
        password: superAdminPassword,
        phone: '+919999999999',
        role: 'gwd_super_admin',
        isActive: true,
      });
      await superAdmin.save();
      console.log(`✅ Created ${config.SUPER_ADMIN_EMAIL}`);
    } else {
      superAdmin.password = superAdminPassword;
      superAdmin.isActive = true;
      await superAdmin.save();
      console.log(`⚡ ${config.SUPER_ADMIN_EMAIL} already exists — password reset to match SUPER_ADMIN_PASSWORD.`);
    }

    console.log('\nSeeding Academies...');

    // Academy 1: Master Grid
    let masterGrid = await Academy.findOne({ slug: 'master-grid' });
    if (!masterGrid) {
      masterGrid = new Academy({
        name: 'Master Grid',
        slug: 'master-grid',
        description: 'Elite Football Academy for aspiring professionals.',
        location: 'Mumbai, Maharashtra',
        address: '123 Stadium Road, Andheri West, Mumbai',
        sports: ['Football', 'Athletics'],
        fees: { monthly: 3000, quarterly: 8500, yearly: 32000 },
        facilities: ['Floodlights', 'Turf', 'Locker Rooms', 'Parking'],
        timings: { opening: '06:00', closing: '22:00', workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
        contactInfo: { name: 'Master Grid Admin', phone: '+919876543210', email: 'admin@mastergrid.in' },
        capacity: 500,
        createdBy: superAdmin._id,
        ownerId: superAdmin._id, // Temporary, will be updated to admin later
        theme: {
          primaryColor: '#0055ff',
          accentColor: '#ffbb00',
          tagline: 'Grid Your Future in Football'
        },
        platformFeePercent: 1,
        isActive: true
      });
      await masterGrid.save();
      console.log('✅ Created Academy: Master Grid (/master-grid)');
      
      // Global Settings for Master Grid
      const mgSettings = new GlobalSettings({ academyId: masterGrid._id });
      await mgSettings.save();
    } else {
      console.log('⚡ Academy master-grid already exists.');
    }

    // Academy 1 Admin
    let mgAdmin = await User.findOne({ email: 'admin@mastergrid.in' });
    if (!mgAdmin) {
      mgAdmin = new User({
        name: 'Master Grid Admin',
        email: 'admin@mastergrid.in',
        password: academyAdminPassword,
        phone: '+919876543210',
        role: 'admin',
        academyId: masterGrid._id,
        isActive: true,
      });
      await mgAdmin.save();
      
      masterGrid.ownerId = mgAdmin._id;
      await masterGrid.save();
      console.log('✅ Created Admin: admin@mastergrid.in for Master Grid');
    }

    // Academy 2: Champions FC
    let championsFc = await Academy.findOne({ slug: 'champions-fc' });
    if (!championsFc) {
      championsFc = new Academy({
        name: 'Champions FC',
        slug: 'champions-fc',
        description: 'Where champions are made. Cricket and Basketball specialized coaching.',
        location: 'Delhi, India',
        address: '45 Sports Complex, New Delhi',
        sports: ['Cricket', 'Basketball'],
        fees: { monthly: 2500, quarterly: 7000, yearly: 25000 },
        facilities: ['Indoor Nets', 'Bowling Machine', 'Gym'],
        timings: { opening: '05:00', closing: '21:00', workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
        contactInfo: { name: 'Champions FC Admin', phone: '+919123456789', email: 'admin@championsfc.in' },
        capacity: 300,
        createdBy: superAdmin._id,
        ownerId: superAdmin._id, // Temporary, will be updated to admin later
        theme: {
          primaryColor: '#e63946',
          accentColor: '#1d3557',
          tagline: 'Play Like A Champion'
        },
        platformFeePercent: 1,
        isActive: true
      });
      await championsFc.save();
      console.log('✅ Created Academy: Champions FC (/champions-fc)');
      
      // Global Settings for Champions FC
      const cfcSettings = new GlobalSettings({ academyId: championsFc._id });
      await cfcSettings.save();
    } else {
      console.log('⚡ Academy champions-fc already exists.');
    }

    // Academy 2 Admin
    let cfcAdmin = await User.findOne({ email: 'admin@championsfc.in' });
    if (!cfcAdmin) {
      cfcAdmin = new User({
        name: 'Champions FC Admin',
        email: 'admin@championsfc.in',
        password: academyAdminPassword,
        phone: '+919123456789',
        role: 'admin',
        academyId: championsFc._id,
        isActive: true,
      });
      await cfcAdmin.save();
      
      championsFc.ownerId = cfcAdmin._id;
      await championsFc.save();
      console.log('✅ Created Admin: admin@championsfc.in for Champions FC');
    }

    // Create a generic student for Master Grid
    let mgStudent = await User.findOne({ email: 'student@mastergrid.in' });
    if (!mgStudent) {
      mgStudent = new User({
        name: 'Rahul Kumar (MG)',
        email: 'student@mastergrid.in',
        password: userPassword,
        phone: '+919988776655',
        role: 'student',
        academyId: masterGrid._id,
        sports: ['Football'],
        isActive: true,
      });
      await mgStudent.save();
      console.log('✅ Created Student: student@mastergrid.in (Master Grid)');
    }

    // Create a generic student for Champions FC
    let cfcStudent = await User.findOne({ email: 'student@championsfc.in' });
    if (!cfcStudent) {
      cfcStudent = new User({
        name: 'Virat Singh (CFC)',
        email: 'student@championsfc.in',
        password: userPassword,
        phone: '+919988776644',
        role: 'student',
        academyId: championsFc._id,
        sports: ['Cricket'],
        isActive: true,
      });
      await cfcStudent.save();
      console.log('✅ Created Student: student@championsfc.in (Champions FC)');
    }

    console.log('\n🎉 Seeding Complete!\n');
    console.log('--- CREDENTIALS ---');
    console.log('Role               | Email                     | Password');
    console.log('-------------------|---------------------------|--------------');
    console.log(`GWD Super Admin    | ${config.SUPER_ADMIN_EMAIL} | (from SUPER_ADMIN_PASSWORD)`);
    console.log('Master Grid Admin  | admin@mastergrid.in       | Admin123!');
    console.log('Champions FC Admin | admin@championsfc.in      | Admin123!');
    console.log('Master Grid Student| student@mastergrid.in     | User123!');
    console.log('Champions FC Student| student@championsfc.in    | User123!');
    console.log('--------------------------------------------------------------');
    console.log('\nTest Academy Public Pages:');
    console.log('- http://localhost:3000/master-grid');
    console.log('- http://localhost:3000/champions-fc');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database.');
    process.exit(0);
  }
}

seed();
