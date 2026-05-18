/**
 * MasterGrade – Cricket Academy Demo Seed Script
 * Populates: Admin (snk@aot.com), Trainer (jane@example.com),
 *            Academy, Students (U12/U14/U16/U19/U23), Attendance,
 *            Performance Reports, FeePayments (Razorpay demo), Events
 *
 * Run: node seed.js
 */

import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// ─── Config ────────────────────────────────────────────────────────────────
const DB_URI  = 'mongodb+srv://ashishgoutham:euBnIYT3CN0fjMjK@cluster0.thkfph1.mongodb.net/?appName=Cluster0';
const DB_NAME = 'sports';

// ─── Helpers ────────────────────────────────────────────────────────────────
const hash = (p) => bcrypt.hashSync(p, 12);
const daysAgo   = (n) => new Date(Date.now() - n * 86400000);
const daysLater = (n) => new Date(Date.now() + n * 86400000);
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Static Data ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { tag: 'U12', minAge: 9,  maxAge: 12 },
  { tag: 'U14', minAge: 12, maxAge: 14 },
  { tag: 'U16', minAge: 14, maxAge: 16 },
  { tag: 'U19', minAge: 16, maxAge: 19 },
  { tag: 'U23', minAge: 19, maxAge: 23 },
];

const STUDENT_NAMES = {
  U12: ['Arjun Sharma','Rahul Patel','Dev Nair','Sai Krishna','Karthik Reddy','Aarav Singh','Vivaan Gupta','Dhruv Mehta','Ansh Yadav','Rohan Joshi'],
  U14: ['Prithvi Kumar','Yash Dubey','Manish Tiwari','Aditya Verma','Nikhil Rao','Ishaan Chauhan','Rishi Malhotra','Kabir Bose','Omkar Desai','Arnav Pillai'],
  U16: ['Shreyas Iyer','Akash Pandey','Varun Sinha','Gaurav Mishra','Sourav Das','Tarun Agarwal','Kunal Jain','Pranav Nanda','Ayush Tripathi','Sidharth Ghosh'],
  U19: ['Ajinkya More','Rohit Sharma','Virat Singh','Hardik Patil','Dinesh Karthik','Shubman Gill','Ruturaj More','Devdutt Pillai','Yashasvi Mehta','Tilak Varma'],
  U23: ['Sanju Nair','KL Reddy','Suryakumar Das','Ishan Patel','Washington Sundar','Axar Desai','Shardul Kumar','Deepak Rao','Bhuvneshwar Gupta','Mohammed Joshi'],
};

const CRICKET_KITS = ['Cricket Bat','Batting Gloves','Batting Pads','Helmet','Cricket Ball','Stumps Set','Wicket-keeping Gloves','Abdominal Guard','Cricket Shoes','Kit Bag'];
const KIT_STATUSES = ['delivered','delivered','delivered','requested','processing'];

const PERF_CATEGORIES = ['batting','bowling','fielding','fitness','technique'];

const PERF_REMARKS = {
  batting:   ['Excellent cover drive, needs to work on pull shot','Good footwork, consistent at crease','Needs to improve against short-pitch deliveries','Great timing and placement through the off-side','Shows promise in building long innings'],
  bowling:   ['Good seam movement, needs better line & length','Impressive spin variations, work on yorkers','Consistent off-stump line, develop slower ball','Strong inswing delivery, work on outswing','Accurate medium-pace, develop change of pace'],
  fielding:  ['Sharp catching in slips, improve ground fielding','Excellent throwing arm, needs positional awareness','Good in the deep, improve close-in catching','Athletic fielder, develop anticipation','Solid ground fielding, work on diving catches'],
  fitness:   ['Good stamina, improve core strength','Excellent sprint speed, work on flexibility','Strong upper body, needs lower-body conditioning','Good overall fitness, improve agility','Needs dedicated fitness programme'],
  technique: ['Solid defensive technique, open up attacking play','Good against pace, needs to develop vs spin','Textbook batting grip, refine backlift','Good bowling action, reduce no-balls','Well-coordinated footwork, maintain consistency'],
};

const CRICKET_EVENTS = [
  {
    name: 'U16 Hyderabad District Cup 2026',
    description: 'Annual district-level cricket tournament for Under-16 category players from all registered academies in Hyderabad.',
    sport: 'cricket',
    startDate: daysLater(15),
    endDate: daysLater(20),
    location: 'Hyderabad',
    venue: 'Gymkhana Cricket Ground, Secunderabad',
    maxParticipants: 120,
    status: 'published',
    isPublic: true,
    registrationOpen: true,
    registrationDeadline: daysLater(10),
    entryFee: 500,
    tags: ['cricket','u16','district','tournament'],
    requirements: 'Players must be under 16 years of age. Academy NOC required.',
    prizes: ['₹25,000 Winner Trophy + Cash Prize','₹15,000 Runner-up Trophy + Cash Prize','₹5,000 Best Batsman Award','₹5,000 Best Bowler Award'],
  },
  {
    name: 'Annual GWD Cricket Premier League – U19',
    description: 'GWD inter-academy T20 league for U19 cricketers. 8 teams, round-robin format followed by knockout stages.',
    sport: 'cricket',
    startDate: daysLater(30),
    endDate: daysLater(45),
    location: 'Hyderabad',
    venue: 'LB Stadium Cricket Ground, Hyderabad',
    maxParticipants: 200,
    status: 'published',
    isPublic: true,
    registrationOpen: true,
    registrationDeadline: daysLater(22),
    entryFee: 800,
    tags: ['cricket','u19','t20','premier-league'],
    requirements: 'Players must be under 19 years of age. Birth certificate mandatory.',
    prizes: ['₹50,000 Winner','₹30,000 Runner-up','₹10,000 Best Player','₹5,000 Player of the Tournament'],
  },
  {
    name: 'Summer Cricket Camp – All Categories',
    description: 'Intensive 10-day summer cricket camp covering batting, bowling, fielding & fitness. Open to U12 through U23 players.',
    sport: 'cricket',
    startDate: daysLater(7),
    endDate: daysLater(17),
    location: 'Hyderabad',
    venue: 'GWD Cricket Academy Ground, Kukatpally',
    maxParticipants: 300,
    status: 'published',
    isPublic: true,
    registrationOpen: true,
    registrationDeadline: daysLater(5),
    entryFee: 1200,
    tags: ['cricket','summer-camp','all-age','training'],
    requirements: 'No prior experience necessary. Parents must sign waiver.',
    prizes: ['Certificates for all participants','Top performer trophies per category','Scholarship for outstanding talent'],
  },
  {
    name: 'U12 Gully Cricket Championship',
    description: 'Exciting tape-ball cricket championship for youngest cricketers. Focus on fun and fundamentals.',
    sport: 'cricket',
    startDate: daysAgo(5),
    endDate: daysAgo(3),
    location: 'Hyderabad',
    venue: 'GWD Academy Indoor Ground',
    maxParticipants: 80,
    status: 'completed',
    isPublic: true,
    registrationOpen: false,
    entryFee: 200,
    tags: ['cricket','u12','fun','tape-ball'],
    requirements: 'Players must be 12 years or under.',
    prizes: ['Medals for top 3 teams','Best Batsman & Best Bowler trophies'],
  },
  {
    name: 'Coach Selection Trials – U23 State Team',
    description: 'Selection trials for Telangana state U23 cricket team. Scouts from HCA will be present.',
    sport: 'cricket',
    startDate: daysLater(60),
    endDate: daysLater(61),
    location: 'Hyderabad',
    venue: 'Rajiv Gandhi International Cricket Stadium, Uppal',
    maxParticipants: 60,
    status: 'published',
    isPublic: false,
    registrationOpen: true,
    registrationDeadline: daysLater(50),
    entryFee: 0,
    tags: ['cricket','u23','trials','selection','hca'],
    requirements: 'Registered academy students only. Performance reports mandatory.',
    prizes: ['State team selection','BCCI training opportunity'],
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  const client = new MongoClient(DB_URI);
  try {
    await client.connect();
    console.log('✅  Connected to MongoDB Atlas');
    const db = client.db(DB_NAME);

    // ── Clean slate ──────────────────────────────────────────────────────────
    const cols = ['users','academies','trainerprofiles','studentprofiles','feepayments','events'];
    for (const c of cols) {
      try { await db.collection(c).deleteMany({}); } catch (_) {}
    }
    console.log('🧹  Existing data cleared');

    // ── Admin (snk@aot.com) ──────────────────────────────────────────────────
    const adminId = new ObjectId();
    await db.collection('users').insertOne({
      _id: adminId,
      name: 'SNK Admin',
      email: 'snk@aot.com',
      password: hash('Admin@123'),
      role: 'admin',
      phone: '9100000001',
      sports: ['cricket'],
      isActive: true,
      refreshTokens: [],
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('👤  Admin created  →  snk@aot.com  /  Admin@123');

    // ── Trainer (jane@example.com) ───────────────────────────────────────────
    const janeId = new ObjectId();
    await db.collection('users').insertOne({
      _id: janeId,
      name: 'Jane Mathews',
      email: 'jane@example.com',
      password: hash('Trainer@123'),
      role: 'trainer',
      phone: '9100000002',
      sports: ['cricket'],
      isActive: true,
      refreshTokens: [],
      lastLogin: daysAgo(1),
      createdAt: daysAgo(180),
      updatedAt: new Date(),
    });
    const janeProfileId = new ObjectId();
    await db.collection('trainerprofiles').insertOne({
      _id: janeProfileId,
      userId: janeId,
      academyId: null, // set after academy creation
      sports: ['cricket'],
      students: [],    // filled after students
      specializations: ['Batting Technique','Spin Bowling','Youth Cricket Development'],
      qualifications: [
        { certification: 'BCCI Level 2 Coaching Certificate', issuedBy: 'BCCI', issuedDate: new Date('2019-06-15'), expiryDate: new Date('2027-06-15') },
        { certification: 'Sports Science Diploma', issuedBy: 'Osmania University', issuedDate: new Date('2018-03-01') },
      ],
      experience: [
        { organization: 'Hyderabad Cricket Association', position: 'Assistant Coach', startDate: new Date('2019-01-01'), endDate: new Date('2022-12-31'), description: 'Coached U19 and U23 district teams. Managed 3 district tournament winning squads.' },
        { organization: 'GWD Cricket Academy', position: 'Head Coach', startDate: new Date('2023-01-01'), description: 'Head coach for all age categories. Responsible for curriculum, player development and academy growth.' },
      ],
      hourlyRate: 800,
      availability: {
        days: ['monday','tuesday','wednesday','thursday','friday','saturday'],
        timeSlots: [{ start: '06:00', end: '09:00' },{ start: '16:00', end: '19:00' }],
      },
      rating: { average: 4.8, totalReviews: 34 },
      joinedDate: new Date('2023-01-01'),
      isActive: true,
      createdAt: daysAgo(500),
      updatedAt: new Date(),
    });
    console.log('🎽  Trainer created  →  jane@example.com  /  Trainer@123');

    // ── Academy ──────────────────────────────────────────────────────────────
    const academyId = new ObjectId();
    await db.collection('academies').insertOne({
      _id: academyId,
      name: 'GWD Cricket Academy',
      description: 'Hyderabad\'s premier cricket academy nurturing talent from grassroots to state level. Specialising in age-category cricket with structured coaching, performance analytics and modern facilities.',
      location: 'Kukatpally, Hyderabad',
      address: 'Plot 14, KPHB Phase 6, Kukatpally, Hyderabad – 500072',
      sports: ['cricket'],
      trainers: [janeId],
      students: [],   // filled after student creation
      fees: { monthly: 2500, quarterly: 7000, yearly: 25000 },
      contactInfo: { name: 'Jane Mathews', phone: '9100000002', email: 'jane@example.com' },
      facilities: ['Turf Pitch','Indoor Nets (4 lanes)','Bowling Machine','Video Analysis Lab','Fitness Room','Physiotherapy Room','Changing Rooms'],
      timings: { opening: '06:00', closing: '19:00', workingDays: ['monday','tuesday','wednesday','thursday','friday','saturday'] },
      capacity: 150,
      images: [],
      isActive: true,
      createdBy: adminId,
      createdAt: daysAgo(400),
      updatedAt: new Date(),
    });
    // Update trainer with academyId
    await db.collection('trainerprofiles').updateOne({ _id: janeProfileId }, { $set: { academyId } });
    console.log('🏏  Academy created  →  GWD Cricket Academy');

    // ── Students per category ─────────────────────────────────────────────────
    const allStudentUserIds = [];
    const feePayments       = [];

    for (const cat of CATEGORIES) {
      const names = STUDENT_NAMES[cat.tag];
      console.log(`\n📋  Creating ${names.length} ${cat.tag} students...`);

      for (let i = 0; i < names.length; i++) {
        const name      = names[i];
        const firstName = name.split(' ')[0].toLowerCase();
        const email     = `${firstName}.${cat.tag.toLowerCase()}@gwdcricket.com`;
        const stuUserId = new ObjectId();
        const stuProfId = new ObjectId();
        const dob       = new Date(Date.now() - rnd(cat.minAge * 365, cat.maxAge * 365) * 86400000);
        const enrollDate = daysAgo(rnd(30, 300));
        const level      = cat.tag === 'U12' || cat.tag === 'U14' ? 'beginner'
                         : cat.tag === 'U16' ? 'intermediate' : 'advanced';

        // User doc
        await db.collection('users').insertOne({
          _id: stuUserId,
          name,
          email,
          password: hash('Student@123'),
          role: 'student',
          phone: `91000${rnd(10000, 99999)}`,
          sports: ['cricket'],
          isActive: true,
          refreshTokens: [],
          lastLogin: daysAgo(rnd(0, 7)),
          createdAt: enrollDate,
          updatedAt: new Date(),
        });

        // ── Attendance (last 60 days) ─────────────────────────────────────
        const attendance = [];
        for (let d = 60; d >= 1; d--) {
          const date = daysAgo(d);
          const dow  = date.getDay();
          if (dow === 0) continue; // no Sundays
          const present = Math.random() < (cat.tag === 'U12' ? 0.78 : 0.85);
          attendance.push({
            date,
            present,
            markedBy: janeId,
            remarks: present ? '' : pick(['Sick leave','Family function','Exams','Medical appointment']),
          });
        }

        // ── Performance reports (cricket-specific) ────────────────────────
        const performance = [];
        for (const perfCat of PERF_CATEGORIES) {
          const baseScore = cat.tag === 'U12' ? 50 : cat.tag === 'U14' ? 58 : cat.tag === 'U16' ? 65 : cat.tag === 'U19' ? 72 : 80;
          performance.push({
            sport: 'cricket',
            score: rnd(baseScore - 10, baseScore + 18),
            maxScore: 100,
            remarks: pick(PERF_REMARKS[perfCat]),
            evaluatedBy: janeId,
            evaluatedAt: daysAgo(rnd(1, 30)),
            category: perfCat,
          });
        }

        // ── Kits ──────────────────────────────────────────────────────────
        const kits = [];
        const kitCount = rnd(2, 5);
        const selectedKits = [...CRICKET_KITS].sort(() => 0.5 - Math.random()).slice(0, kitCount);
        for (const kitName of selectedKits) {
          const status     = pick(KIT_STATUSES);
          const requestedAt = daysAgo(rnd(10, 90));
          kits.push({
            kitName,
            status,
            requestedAt,
            deliveredAt: status === 'delivered' ? new Date(requestedAt.getTime() + rnd(1, 7) * 86400000) : null,
            cost: rnd(500, 4500),
          });
        }

        // ── Fee Payments ──────────────────────────────────────────────────
        const stuFees   = [];
        let totalPaid   = 0;
        let outstanding = 0;
        const monthlyFee = 2500;
        const monthsEnrolled = Math.ceil((Date.now() - enrollDate.getTime()) / (30 * 86400000));
        for (let m = 0; m < Math.min(monthsEnrolled, 6); m++) {
          const payDate = new Date(enrollDate.getTime() + m * 30 * 86400000);
          const status  = m < monthsEnrolled - 1 ? 'paid' : (Math.random() < 0.3 ? 'pending' : 'paid');
          const txnId   = status === 'paid' ? `pay_demo_${stuUserId.toString().slice(-6)}_${m}` : undefined;
          stuFees.push({ amount: monthlyFee, paymentDate: payDate, period: 'monthly', status, transactionId: txnId });
          if (status === 'paid') totalPaid += monthlyFee;
          else outstanding += monthlyFee;
        }

        // ── FeePayment collection records (Razorpay demo) ─────────────────
        const rzpStatuses = ['success','success','success','pending','failed'];
        for (let fp = 0; fp < rnd(1, 4); fp++) {
          const fpStatus = pick(rzpStatuses);
          const orderId  = `order_demo${stuUserId.toString().slice(-5)}${fp}`;
          const amount   = monthlyFee;
          feePayments.push({
            _id: new ObjectId(),
            orderId,
            paymentId: fpStatus === 'success' ? `pay_demo${stuUserId.toString().slice(-5)}${fp}` : undefined,
            signature: fpStatus === 'success' ? `sig_demo${stuUserId.toString().slice(-5)}${fp}` : undefined,
            amount,
            currency: 'INR',
            status: fpStatus,
            receipt: `rcpt_${orderId}`,
            studentId: stuUserId,
            createdAt: daysAgo(rnd(1, 90)),
            updatedAt: new Date(),
          });
        }

        // ── Student Profile ───────────────────────────────────────────────
        await db.collection('studentprofiles').insertOne({
          _id: stuProfId,
          userId: stuUserId,
          academyId,
          trainers: [janeId],
          enrollmentDate: enrollDate,
          feePayments: stuFees,
          totalFeesPaid: totalPaid,
          outstandingFees: outstanding,
          attendance,
          kits,
          performance,
          sports: ['cricket'],
          level,
          medicalInfo: {
            allergies: [],
            medications: [],
            emergencyContact: {
              name: `${name.split(' ')[1] || 'Parent'} (Guardian)`,
              phone: `91000${rnd(10000, 99999)}`,
              relation: pick(['Father','Mother','Uncle','Guardian']),
            },
          },
          isActive: true,
          createdAt: enrollDate,
          updatedAt: new Date(),
        });

        allStudentUserIds.push(stuUserId);
        process.stdout.write(`   ✓ ${name.padEnd(22)} ${email}\n`);
      }
    }

    // ── Update Academy with all student IDs ───────────────────────────────
    await db.collection('academies').updateOne({ _id: academyId }, { $set: { students: allStudentUserIds } });
    // ── Update Jane's trainer profile with all student IDs ────────────────
    await db.collection('trainerprofiles').updateOne({ _id: janeProfileId }, { $set: { students: allStudentUserIds } });

    // ── Insert FeePayments ────────────────────────────────────────────────
    if (feePayments.length) {
      await db.collection('feepayments').insertMany(feePayments);
    }
    console.log(`\n💳  ${feePayments.length} Razorpay fee payment records inserted`);

    // ── Events ────────────────────────────────────────────────────────────
    const eventDocs = CRICKET_EVENTS.map(e => ({
      _id: new ObjectId(),
      ...e,
      participants: allStudentUserIds.slice(0, rnd(5, 25)),
      links: [],
      images: [],
      createdBy: adminId,
      academyId,
      isActive: true,
      createdAt: daysAgo(rnd(5, 30)),
      updatedAt: new Date(),
    }));
    await db.collection('events').insertMany(eventDocs);
    console.log(`🏆  ${eventDocs.length} cricket events inserted`);

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('✅  SEED COMPLETE');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  Admin     →  snk@aot.com          /  Admin@123');
    console.log('  Trainer   →  jane@example.com      /  Trainer@123');
    console.log('  Students  →  50 cricket students   /  Student@123');
    console.log('  Categories → U12 | U14 | U16 | U19 | U23  (10 each)');
    console.log('  Academy   →  GWD Cricket Academy');
    console.log('  Events    →  5 cricket events');
    console.log(`  FeePayments → ${feePayments.length} Razorpay records`);
    console.log('─────────────────────────────────────────────────────────────\n');
  } catch (err) {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
