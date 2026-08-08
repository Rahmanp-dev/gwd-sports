/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * ════════════════════════════════════════════════════════════════════════════
 * LOCAL SCHEDULER — runs the job tick on a machine you control
 * ════════════════════════════════════════════════════════════════════════════
 *
 *   node scripts/local-cron.js                 # every 15 min, forever
 *   node scripts/local-cron.js --once          # one tick, then exit
 *   node scripts/local-cron.js --every 5m
 *   node scripts/local-cron.js --url https://sports.gwdglobal.in
 *
 * WHAT IT DOES. Nothing clever — it POSTs `/api/jobs/tick` with the bearer
 * token, on an interval, and prints what came back. All the actual work
 * (dispatch → reminders → digest → send) happens server-side inside that one
 * endpoint, which already guards itself against running twice for the same
 * student, stage and cycle.
 *
 * WHY THIS EXISTS. Vercel's hobby plan gives you one cron a day. That is enough
 * for the fee sweep but NOT for outbound messages: a parent who pays at 9am
 * should get their receipt at 9am, not at 3am tomorrow. Running this on any
 * always-on machine — a laptop that stays open, a cheap VPS, a Raspberry Pi —
 * makes the queue drain on a human timescale without paying for a scheduler.
 *
 * SAFE TO RUN ALONGSIDE the Vercel cron. Every stage inside the tick is
 * idempotent and claims its work atomically, so two schedulers firing at once
 * produce no duplicate messages — the second one simply finds nothing to claim.
 *
 * SAFE TO STOP. Nothing is lost. Events and queued messages sit in the database
 * until something ticks; the next run picks them up. A laptop that was shut for
 * the weekend catches up on Monday, and the reminder cadence self-guards so
 * nobody receives three days of backlog at once.
 * ════════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const path = require('path');

(function loadEnv() {
  const file = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
})();

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** "15m" | "90s" | "1h" → milliseconds. */
function parseEvery(v) {
  const m = String(v).trim().match(/^(\d+)\s*([smh])?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = (m[2] || 'm').toLowerCase();
  return n * (unit === 's' ? 1000 : unit === 'h' ? 3_600_000 : 60_000);
}

const BASE = (arg('url', process.env.APP_URL || 'http://localhost:3000')).replace(/\/$/, '');
const SECRET = process.env.CRON_SECRET;
const ONCE = process.argv.includes('--once');
const EVERY = parseEvery(arg('every', '15m'));

if (!SECRET) {
  console.error(
    'CRON_SECRET is not set. The tick endpoint refuses unauthenticated calls —\n' +
      'that is deliberate, it sends real messages. Add CRON_SECRET to .env.local\n' +
      '(any long random string) and use the same value in your deployment.',
  );
  process.exit(1);
}
if (!EVERY) {
  console.error('--every must look like 30s, 15m or 1h.');
  process.exit(1);
}

let running = false;
let consecutiveFailures = 0;

async function tick() {
  // A slow tick must not stack up behind itself. Skipping is correct — the
  // work is still queued and the next run will claim it.
  if (running) {
    console.log(`[${new Date().toISOString()}] previous tick still running, skipping`);
    return;
  }
  running = true;
  const started = Date.now();

  try {
    const res = await fetch(`${BASE}/api/jobs/tick`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SECRET}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 300) };
    }

    const ms = Date.now() - started;

    if (!res.ok) {
      consecutiveFailures++;
      console.error(
        `[${new Date().toISOString()}] HTTP ${res.status} in ${ms}ms —`,
        body?.message || body?.raw || '(no message)',
      );
      if (res.status === 401) {
        console.error('  CRON_SECRET does not match the server. Fix it and restart.');
      }
      return;
    }

    consecutiveFailures = 0;
    const d = body?.data ?? body ?? {};
    const bits = [];
    if (d.dispatch) bits.push(`dispatch q=${d.dispatch.queued ?? 0}`);
    if (d.reminders) bits.push(`reminders=${d.reminders.queued ?? d.reminders.sent ?? 0}`);
    if (d.digest) bits.push(`digest=${d.digest.queued ?? 0}`);
    if (d.send) bits.push(`sent=${d.send.sent ?? 0} failed=${d.send.failed ?? 0}`);

    console.log(
      `[${new Date().toISOString()}] ok ${ms}ms  ${bits.join('  ') || '(nothing to do)'}`,
    );
  } catch (err) {
    consecutiveFailures++;
    console.error(
      `[${new Date().toISOString()}] unreachable —`,
      err instanceof Error ? err.message : err,
    );
    if (consecutiveFailures === 3) {
      console.error(`  Is the app running at ${BASE}?`);
    }
  } finally {
    running = false;
  }
}

(async () => {
  console.log(`local-cron → ${BASE}/api/jobs/tick`);
  console.log(ONCE ? 'running one tick' : `running every ${arg('every', '15m')} (Ctrl-C to stop)`);
  console.log('');

  await tick();
  if (ONCE) return;

  const timer = setInterval(tick, EVERY);
  const stop = () => {
    clearInterval(timer);
    console.log('\nstopped. Nothing was lost — queued work resumes on the next run.');
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();
