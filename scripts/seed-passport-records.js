/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seeds a realistic sporting record onto one student's Sports Passport, so the
 * passport page and the coach's editor can be seen with real-looking content.
 *
 *   node scripts/seed-passport-records.js                      # report only
 *   node scripts/seed-passport-records.js --apply              # write
 *   node scripts/seed-passport-records.js --apply --passport GWD-7K2M9X
 *   node scripts/seed-passport-records.js --apply --academy "MasterGrade"
 *   node scripts/seed-passport-records.js --apply --clear      # replace seeded rows
 *
 * WHAT THIS IS AND IS NOT. These are sample entries for a demonstration
 * passport — they are marked with `seeded: true` in the summary-free metadata
 * below so `--clear` can find and remove exactly them and nothing a coach
 * typed. It does NOT invent achievements, attendance or performance scores:
 * those are earned by the rules engine from real activity, and manufacturing
 * them would put numbers on a child's page that no coach stands behind.
 *
 * Requires DB_URI (the name the app itself uses — see src/lib/db.ts).
 * MONGODB_URI is accepted as a fallback. Reads .env.local if present.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// ── env ─────────────────────────────────────────────────────────────────────
(function loadEnv() {
  const file = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
})();

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

const APPLY = process.argv.includes('--apply');
const CLEAR = process.argv.includes('--clear');
const WANT_PASSPORT = (arg('passport') || '').toUpperCase();
const WANT_ACADEMY = arg('academy') || 'MasterGrade';

/** Marker written into every seeded row so --clear can be exact. */
const SEED_TAG = 'seed:demo-sporting-record';

/**
 * A year of a real-shaped junior cricket season, working backwards from the
 * run of the script so the passport never looks stale.
 */
function sampleRecords(daysAgo) {
  const at = (d) => new Date(Date.now() - d * 86_400_000);
  return [
    {
      kind: 'tournament',
      title: 'U-14 District Championship',
      organisation: 'Hyderabad District Cricket Association',
      sport: 'cricket',
      level: 'district',
      result: 'Runners-up',
      startedOn: at(daysAgo + 0),
      endedOn: at(daysAgo - 2),
      location: 'Gymkhana Ground, Secunderabad',
      summary:
        'Opened the batting through the group stage and top-scored with 46 in the semi-final. Named in the tournament XI.',
    },
    {
      kind: 'league',
      title: 'Telangana Junior League — Season 4',
      organisation: 'Telangana Cricket Association',
      sport: 'cricket',
      level: 'state',
      result: 'Selected',
      startedOn: at(daysAgo + 120),
      endedOn: at(daysAgo + 45),
      location: 'Multiple venues, Telangana',
      summary:
        'Played nine matches across the season as a top-order batter, finishing with 287 runs at an average of 35.8.',
    },
    {
      kind: 'trial',
      title: 'State U-16 Selection Trial',
      organisation: 'Telangana Cricket Association',
      sport: 'cricket',
      level: 'state',
      result: 'Shortlisted',
      startedOn: at(daysAgo + 30),
      endedOn: null,
      location: 'Rajiv Gandhi International Stadium',
      summary:
        'Attended the age-group trial and progressed to the final shortlist of 30 from an initial pool of 240.',
    },
    {
      kind: 'camp',
      title: 'Summer High-Performance Camp',
      organisation: 'MasterGrade Sports Academy',
      sport: 'cricket',
      level: 'academy',
      result: 'Completed',
      startedOn: at(daysAgo + 210),
      endedOn: at(daysAgo + 196),
      location: 'MasterGrade Sports Academy, Kukatpally',
      summary:
        'Two-week intensive on spin play and running between the wickets, with video review after every session.',
    },
    {
      kind: 'certification',
      title: 'BCCI Level 1 — Junior Fitness Assessment',
      organisation: 'Board of Control for Cricket in India',
      sport: 'cricket',
      // Deliberately unlevelled. The assessment is nationally STANDARDISED,
      // which is not the same as competing at national level — and `level`
      // drives the "highest level reached" badge in the passport header. Tagging
      // it `national` made the page announce a credential this child has not
      // earned, which is exactly the overstatement this codebase refuses to
      // generate anywhere else.
      level: null,
      result: 'Passed',
      startedOn: at(daysAgo + 260),
      endedOn: null,
      location: 'Hyderabad',
      summary:
        'Cleared the standardised junior fitness battery — yo-yo test, sprint splits and agility.',
    },
    {
      kind: 'milestone',
      title: 'First century for the academy',
      organisation: 'MasterGrade Sports Academy',
      sport: 'cricket',
      level: 'academy',
      result: '104 not out',
      startedOn: at(daysAgo + 300),
      endedOn: null,
      location: 'MasterGrade Sports Academy, Kukatpally',
      summary:
        'Carried the bat for an unbeaten 104 in the inter-batch final — the first century recorded at the academy.',
    },
  ];
}

async function main() {
  // DB_URI is the canonical name — src/lib/db.ts reads config.DB_URI, and that
  // is what .env.local actually defines. MONGODB_URI is accepted so the name
  // the other scripts in this folder use keeps working.
  const uri = process.env.DB_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('DB_URI is not set. Put it in .env.local or the environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // Raw collections — this script must not depend on the app's model registry,
  // which pulls in TypeScript and the whole `@/` alias chain.
  const passports = db.collection('passports');
  const profiles = db.collection('studentprofiles');
  const academies = db.collection('academies');
  const users = db.collection('users');

  let passport;

  if (WANT_PASSPORT) {
    passport = await passports.findOne({ passportId: WANT_PASSPORT });
    if (!passport) {
      console.error(`No passport found with id ${WANT_PASSPORT}`);
      process.exit(1);
    }
  } else {
    const academy = await academies.findOne({
      name: { $regex: WANT_ACADEMY, $options: 'i' },
    });
    if (!academy) {
      console.error(`No academy matching "${WANT_ACADEMY}".`);
      const all = await academies.find({}).project({ name: 1 }).toArray();
      console.error('Available:', all.map((a) => a.name).join(', ') || '(none)');
      process.exit(1);
    }
    console.log(`Academy: ${academy.name}  (${academy._id})`);

    // Prefer a student who already has a passport — creating one here would
    // duplicate logic that lib/auth/ensurePassport.ts already owns.
    const candidates = await profiles
      .find({ academyId: academy._id, passportId: { $nin: [null, ''] } })
      .limit(25)
      .toArray();

    if (candidates.length === 0) {
      console.error(
        `No student at ${academy.name} has a Sports Passport yet.\n` +
          'Import or add a student first — the passport is issued automatically.'
      );
      process.exit(1);
    }

    // The one with the most attendance looks most alive on the page.
    candidates.sort((a, b) => (b.attendance?.length ?? 0) - (a.attendance?.length ?? 0));
    passport = await passports.findOne({ passportId: candidates[0].passportId });
    if (!passport) {
      console.error(`Profile references passport ${candidates[0].passportId}, which is missing.`);
      process.exit(1);
    }
  }

  const owner = await users.findOne({ _id: passport.currentStudentProfileId }).catch(() => null);
  const profile = await profiles.findOne({ passportId: passport.passportId });
  const student = profile ? await users.findOne({ _id: profile.userId }) : owner;

  const existing = passport.records ?? [];
  const seeded = existing.filter((r) => r.location === SEED_TAG || r.__seed === SEED_TAG);
  const coachWritten = existing.length - seeded.length;

  console.log('');
  console.log(`Passport : ${passport.passportId}`);
  console.log(`Student  : ${passport.studentName}${student?.email ? `  <${student.email}>` : ''}`);
  console.log(`Existing : ${existing.length} record(s) — ${coachWritten} written by a coach`);
  console.log(`Public   : /passport/${passport.passportId}`);
  console.log('');

  const academyId = passport.currentAcademyId ?? null;
  const academyDoc = academyId ? await academies.findOne({ _id: academyId }) : null;

  const rows = sampleRecords(14).map((r) => ({
    _id: new mongoose.Types.ObjectId(),
    ...r,
    academyId,
    academyName: academyDoc?.name ?? null,
    recordedBy: null,
    recordedAt: new Date(),
    updatedAt: null,
    __seed: SEED_TAG,
  }));

  if (!APPLY) {
    console.log('DRY RUN — would add:');
    for (const r of rows) {
      console.log(`  ${r.kind.padEnd(14)} ${r.title}${r.result ? `  → ${r.result}` : ''}`);
    }
    if (CLEAR) console.log(`\n  ...and first remove ${seeded.length} previously seeded row(s).`);
    console.log('\nRe-run with --apply to write.');
    await mongoose.disconnect();
    return;
  }

  let next = existing;
  if (CLEAR) {
    next = existing.filter((r) => r.__seed !== SEED_TAG && r.location !== SEED_TAG);
    console.log(`Removed ${existing.length - next.length} previously seeded row(s).`);
  }

  await passports.updateOne(
    { _id: passport._id },
    { $set: { records: [...next, ...rows], updatedAt: new Date() } }
  );

  console.log(`Added ${rows.length} record(s).`);
  console.log(`\nOpen: /passport/${passport.passportId}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
