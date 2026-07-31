/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Repairs Passport documents that the public page cannot serve.
 *
 *   node scripts/repair-passports.js            # report only
 *   node scripts/repair-passports.js --apply    # fix
 *
 * ════════════════════════════════════════════════════════════════════════════
 * WHAT IS BROKEN AND WHY IT IS INVISIBLE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * `/api/passport/[passportId]` shape-checks the id before it queries:
 *
 *     /^GWD-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/
 *
 * That alphabet deliberately excludes 0/1/I/L/O/U so a parent reading an id off
 * a screen cannot confuse glyphs. Any passport whose id does not match is
 * rejected with a 400 BEFORE the database is touched — so the record exists,
 * looks fine in the admin, and is simply unreachable at its own URL. Nobody
 * finds out until a parent taps the link in their welcome message.
 *
 * This repairs two classes of damage, both from documents inserted outside the
 * mongoose model (which would have refused them):
 *
 *   1. Ids like `GWD-HYD-00001` — wrong shape, wrong alphabet, wrong length.
 *   2. A missing `studentName`, which the schema declares required.
 *
 * REGENERATING AN ID IS NORMALLY FORBIDDEN — models/Passport.ts rule 4 says a
 * passportId is public and permanent, because parents bookmark it. That rule is
 * safe to set aside for exactly these documents and no others: an id that fails
 * the route regex has never successfully served a page, so there is no working
 * link anywhere to invalidate. The script only ever rewrites ids that are
 * already unreachable, and prints each one it changes.
 * ════════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

(function loadEnv() {
  const file = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
})();

const APPLY = process.argv.includes('--apply');

/** Must stay identical to src/lib/passport.ts and the route's regex. */
const ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const VALID = /^GWD-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;

function generatePassportId() {
  const bytes = crypto.randomBytes(6);
  let out = 'GWD-';
  for (let i = 0; i < 6; i++) out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return out;
}

function normalizeStudentName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  const uri = process.env.DB_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('DB_URI is not set. Put it in .env.local or the environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const passports = db.collection('passports');
  const profiles = db.collection('studentprofiles');
  const users = db.collection('users');

  const all = await passports.find({}).toArray();
  const taken = new Set(all.map((p) => p.passportId));

  const broken = all.filter((p) => !VALID.test(String(p.passportId)) || !p.studentName);

  console.log(`Scanned ${all.length} passport(s). ${broken.length} need repair.\n`);
  if (broken.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const plan = [];

  for (const p of broken) {
    const reasons = [];
    const set = {};

    // Resolve the child's name from the enrolment record, then the user.
    let name = p.studentName;
    if (!name) {
      const profile =
        (await profiles.findOne({ passportId: p.passportId })) ||
        (p.currentStudentProfileId
          ? await profiles.findOne({ _id: p.currentStudentProfileId })
          : null);
      const user = profile ? await users.findOne({ _id: profile.userId }) : null;
      name = user?.name || profile?.name || null;
      if (name) {
        set.studentName = name;
        reasons.push(`studentName ← "${name}" (from ${user ? 'user' : 'profile'})`);
      } else {
        reasons.push('studentName MISSING and unresolvable — skipping this document');
      }
    }

    if (!VALID.test(String(p.passportId))) {
      let next = generatePassportId();
      while (taken.has(next)) next = generatePassportId();
      taken.add(next);
      set.passportId = next;
      reasons.push(`passportId ${p.passportId} → ${next}  (old id was unreachable)`);
    }

    // identityKey is uniquely indexed and is what stops duplicate passports
    // being created for the same child. A document missing it is a future
    // duplicate waiting to happen.
    const finalName = set.studentName ?? p.studentName;
    if (!p.identityKey && p.parentPhone && finalName) {
      set.identityKey = `${p.parentPhone}::${normalizeStudentName(finalName)}`;
      reasons.push('identityKey rebuilt');
    }

    if (!set.studentName && !p.studentName) continue; // unresolvable, leave alone
    if (Object.keys(set).length === 0) continue;

    plan.push({ _id: p._id, was: p.passportId, set, reasons });
  }

  for (const item of plan) {
    console.log(`${item.was}`);
    for (const r of item.reasons) console.log(`   · ${r}`);
    // The profile carries a denormalised copy of the id; it has to move too or
    // the enrolment record points at a passport that no longer answers to it.
    if (item.set.passportId) {
      console.log(`   · studentprofiles.passportId will be updated to match`);
    }
    console.log('');
  }

  if (!APPLY) {
    console.log('DRY RUN — re-run with --apply to write.');
    await mongoose.disconnect();
    return;
  }

  for (const item of plan) {
    await passports.updateOne({ _id: item._id }, { $set: { ...item.set, updatedAt: new Date() } });
    if (item.set.passportId) {
      const res = await profiles.updateMany(
        { passportId: item.was },
        { $set: { passportId: item.set.passportId } }
      );
      // Achievements are keyed on passportId too — see models/Achievement.ts.
      const ach = await db
        .collection('achievements')
        .updateMany({ passportId: item.was }, { $set: { passportId: item.set.passportId } });
      console.log(
        `${item.was} → ${item.set.passportId}  (${res.modifiedCount} profile(s), ${ach.modifiedCount} achievement(s) repointed)`
      );
    } else {
      console.log(`${item.was}  repaired in place`);
    }
  }

  console.log(`\nRepaired ${plan.length} passport(s).`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
