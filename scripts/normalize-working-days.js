/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * One-off repair: normalise Academy.timings.workingDays to the canonical
 * lowercase full names the schema enum expects.
 *
 * WHY THIS EXISTS. Academies created before the enum was added hold "Mon",
 * "Tue", "Wed". Mongoose validates the whole document on save(), so those
 * values failed EVERY unrelated write to the academy — including the student
 * import's roster append, which 500'd after all the students had already been
 * created. The code no longer saves the whole document there, and a setter now
 * coerces on write, but existing documents are only fixed by rewriting them.
 *
 * Safe to run more than once: rows already canonical are skipped.
 *
 *   node scripts/normalize-working-days.js            # report only
 *   node scripts/normalize-working-days.js --apply    # write
 */
const mongoose = require('mongoose');

const CANONICAL = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
const BY_PREFIX = Object.fromEntries(CANONICAL.map((d) => [d.slice(0, 3), d]));

function normalise(value) {
  if (typeof value !== 'string') return value;
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return value;
  const canonical = BY_PREFIX[cleaned.slice(0, 3)];
  if (canonical && (cleaned === canonical || cleaned === cleaned.slice(0, 3))) {
    return canonical;
  }
  return value;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  // Raw collection access on purpose: loading through the model would run the
  // very validation these documents currently fail.
  const collection = mongoose.connection.db.collection('academies');

  const academies = await collection
    .find({ 'timings.workingDays': { $exists: true, $ne: [] } })
    .project({ name: 1, 'timings.workingDays': 1 })
    .toArray();

  let changed = 0;
  let unrecognised = 0;

  for (const academy of academies) {
    const current = academy.timings?.workingDays ?? [];
    const next = current.map(normalise);

    const bad = next.filter((d) => !CANONICAL.includes(d));
    if (bad.length > 0) {
      unrecognised++;
      console.warn(
        `! ${academy.name}: cannot normalise ${JSON.stringify(bad)} — left untouched, will still fail validation.`
      );
      continue;
    }

    if (JSON.stringify(current) === JSON.stringify(next)) continue;

    changed++;
    console.log(
      `${apply ? 'fixed  ' : 'would fix'} ${academy.name}: ${JSON.stringify(current)} -> ${JSON.stringify(next)}`
    );

    if (apply) {
      await collection.updateOne(
        { _id: academy._id },
        { $set: { 'timings.workingDays': next } }
      );
    }
  }

  console.log(
    `\n${academies.length} academies scanned, ${changed} ${apply ? 'updated' : 'need updating'}` +
      (unrecognised ? `, ${unrecognised} with values needing a human` : '')
  );
  if (!apply && changed > 0) console.log('Re-run with --apply to write.');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
