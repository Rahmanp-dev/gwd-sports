#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHATSAPP DOCTOR — why can't we send?
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every WhatsApp delivery failure this project has hit was a configuration
 * fact that no amount of type-checking, unit testing or building could reveal:
 * a token scoped to no asset, a template approved in a different language, an
 * app not subscribed to the business account. Each one presented as a generic
 * Meta error code and cost hours to pin down by hand.
 *
 * This asks Meta the questions directly and prints a checklist. Read-only —
 * it never sends a message, so it is safe to run against production at any
 * time.
 *
 *   node scripts/whatsapp-doctor.mjs
 *   node scripts/whatsapp-doctor.mjs <WABA_ID>
 *
 * The WABA id is optional but worth passing: a System User token that is not
 * attached to the business account cannot discover it, which is itself the
 * most common fault. Find it in Meta App Dashboard → WhatsApp → API Setup,
 * shown as "WhatsApp Business Account ID".
 * ════════════════════════════════════════════════════════════════════════════
 */

import fs from 'node:fs';
import path from 'node:path';

const API = 'https://graph.facebook.com/v21.0';

const PASS = '  \x1b[32m✓\x1b[0m';
const FAIL = '  \x1b[31m✗\x1b[0m';
const WARN = '  \x1b[33m!\x1b[0m';
const INFO = '  \x1b[36m·\x1b[0m';

/** Reads .env.local without pulling in a dependency. Values are never printed. */
function readEnv() {
  const file = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    out[line.slice(0, eq).trim()] = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...readEnv(), ...process.env };

const token = env.META_WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = env.META_WHATSAPP_PHONE_NUMBER_ID;
const templateLang = (env.META_WHATSAPP_TEMPLATE_LANG || 'en_US').trim();
const wabaArg = process.argv[2];

async function get(pathname) {
  const res = await fetch(`${API}/${pathname}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, body: await res.json() };
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

let problems = 0;
const fail = (msg, fix) => {
  problems++;
  console.log(`${FAIL} ${msg}`);
  if (fix) console.log(`      → ${fix}`);
};

async function main() {
  console.log('\n\x1b[1mWhatsApp delivery doctor\x1b[0m (read-only)');

  // ── Credentials present ────────────────────────────────────────────────
  section('1. Credentials');
  if (!token) {
    fail(
      'META_WHATSAPP_ACCESS_TOKEN is not set',
      'Without it the engine runs in no-op mode: messages queue and are recorded as "skipped", never sent.',
    );
    console.log('\nCannot continue without a token.\n');
    process.exit(1);
  }
  console.log(`${PASS} META_WHATSAPP_ACCESS_TOKEN present (${token.length} chars)`);

  if (!phoneNumberId) {
    fail(
      'META_WHATSAPP_PHONE_NUMBER_ID is not set',
      'This is the numeric id of the SENDING number — not the phone number, and not the WABA id.',
    );
  } else {
    console.log(`${PASS} META_WHATSAPP_PHONE_NUMBER_ID = ${phoneNumberId}`);
  }

  if (!env.NEXT_PUBLIC_APP_URL) {
    fail(
      'NEXT_PUBLIC_APP_URL is not set',
      'Every passport/payment/sign-in link sent to a parent will be built against a fallback ' +
        'domain. Messages still send and report as delivered — only the links inside are dead.',
    );
  } else {
    console.log(`${PASS} Links will be built as ${env.NEXT_PUBLIC_APP_URL}`);
  }

  if (!env.CRON_SECRET) {
    fail(
      'CRON_SECRET is not set',
      'Nothing drains the event log: POST /api/jobs/tick refuses to run, so events never ' +
        'become messages. Set it here, in the deployment env, AND as a GitHub repo secret.',
    );
  } else {
    console.log(`${PASS} CRON_SECRET present (scheduler can be invoked)`);
  }

  // ── Token identity ─────────────────────────────────────────────────────
  section('2. Access token');
  const dbg = await get(
    `debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`,
  );
  const d = dbg.body?.data;

  if (!d?.is_valid) {
    fail('Token is not valid', JSON.stringify(d?.error ?? dbg.body));
  } else {
    console.log(`${PASS} Valid, type ${d.type}, app ${d.app_id}`);

    if (d.type !== 'SYSTEM_USER') {
      fail(
        `Token type is ${d.type}, not SYSTEM_USER`,
        'The token on the App Dashboard getting-started panel expires in 24 hours. Production ' +
          'needs a System User token from Business Settings.',
      );
    }

    if (d.expires_at === 0) {
      console.log(`${PASS} Never expires`);
    } else {
      const when = new Date(d.expires_at * 1000);
      const days = Math.round((when - Date.now()) / 86400000);
      (days <= 7 ? fail : (m) => console.log(`${WARN} ${m}`))(
        `Token expires ${when.toISOString()} (${days} day(s))`,
        'Replace with a non-expiring System User token.',
      );
    }

    const scopes = d.scopes ?? [];
    for (const need of ['whatsapp_business_messaging', 'whatsapp_business_management']) {
      if (scopes.includes(need)) console.log(`${PASS} Scope ${need}`);
      else fail(`Scope ${need} missing`, 'Re-generate the System User token with this permission ticked.');
    }

    /**
     * THE CHECK THAT MATTERS MOST.
     *
     * A permission says what the token MAY do; target_ids says WHICH assets it
     * may do it to. A System User can hold whatsapp_business_messaging and
     * still be attached to no business account at all — which fails at send
     * time with the maddeningly generic:
     *
     *   (#200) You do not have the necessary permissions to send messages
     *          on behalf of this WhatsApp Business Account
     *
     * and nowhere else. Reading the phone number still succeeds, so every
     * other check looks green.
     */
    const granular = d.granular_scopes ?? [];
    const messaging = granular.find((g) => g.scope === 'whatsapp_business_messaging');
    const targets = messaging?.target_ids ?? [];

    if (targets.length > 0) {
      console.log(`${PASS} Token is attached to WABA asset(s): ${targets.join(', ')}`);
    } else {
      fail(
        'Token is attached to NO WhatsApp Business Account asset',
        'Business Settings → Users → System Users → pick the user → Add Assets → ' +
          'WhatsApp Accounts → select your WABA → enable Full control → Save. ' +
          'This is what causes "(#200) ... on behalf of this WhatsApp Business Account".',
      );
    }
  }

  // ── Sending number ─────────────────────────────────────────────────────
  if (phoneNumberId) {
    section('3. Sending number');
    const pn = await get(
      `${phoneNumberId}?fields=display_phone_number,verified_name,platform_type,status,name_status,account_mode,quality_rating`,
    );
    if (pn.status !== 200) {
      fail(
        `Cannot read the phone number (HTTP ${pn.status})`,
        pn.body?.error?.message ?? 'Check META_WHATSAPP_PHONE_NUMBER_ID is the sending number id.',
      );
    } else {
      const p = pn.body;
      console.log(`${PASS} ${p.display_phone_number} — "${p.verified_name}"`);
      const expect = (label, actual, want) =>
        actual === want
          ? console.log(`${PASS} ${label}: ${actual}`)
          : fail(`${label}: ${actual} (expected ${want})`);
      expect('Platform', p.platform_type, 'CLOUD_API');
      expect('Status', p.status, 'CONNECTED');
      expect('Display name', p.name_status, 'APPROVED');
      if (p.account_mode === 'LIVE') {
        console.log(`${PASS} Account mode: LIVE`);
      } else {
        fail(
          `Account mode: ${p.account_mode}`,
          'In sandbox/test mode Meta only delivers to numbers on the allowed list — ' +
            'the cause of "(#131030) Recipient phone number not in allowed list".',
        );
      }
    }
  }

  // ── Business account ───────────────────────────────────────────────────
  section('4. Business account & app subscription');
  const dbgTargets =
    (d?.granular_scopes ?? []).find((g) => g.scope === 'whatsapp_business_messaging')?.target_ids ??
    [];
  const wabaIds = wabaArg ? [wabaArg] : dbgTargets;

  if (wabaIds.length === 0) {
    console.log(
      `${WARN} No WABA id known — the token is not attached to one and none was passed.`,
    );
    console.log(
      '      → Re-run as: node scripts/whatsapp-doctor.mjs <WABA_ID>',
    );
    console.log(
      '      → Find it in Meta App Dashboard → WhatsApp → API Setup ("WhatsApp Business Account ID").',
    );
  }

  for (const waba of wabaIds) {
    const subs = await get(`${waba}/subscribed_apps`);
    if (subs.status !== 200) {
      fail(
        `Cannot read subscribed apps for WABA ${waba} (HTTP ${subs.status})`,
        subs.body?.error?.message ??
          'Usually means this token has no management access to that business account.',
      );
      continue;
    }

    const apps = subs.body?.data ?? [];
    if (apps.length === 0) {
      fail(
        `No app is subscribed to WABA ${waba}`,
        'The app must be subscribed to receive webhooks and act on the account. ' +
          'WhatsApp Manager → Settings → Webhooks, or POST /' + waba + '/subscribed_apps.',
      );
    } else {
      const names = apps
        .map((a) => `${a.whatsapp_business_api_data?.name ?? '?'} (${a.whatsapp_business_api_data?.id ?? '?'})`)
        .join(', ');
      console.log(`${PASS} Subscribed app(s) on ${waba}: ${names}`);
      if (d?.app_id && !apps.some((a) => String(a.whatsapp_business_api_data?.id) === String(d.app_id))) {
        fail(
          `The token's app (${d.app_id}) is NOT among the subscribed apps`,
          'The token belongs to a different app than the one subscribed to this WABA.',
        );
      }
    }

    // ── Templates, in the language we actually request ──────────────────
    const tpl = await get(`${waba}/message_templates?limit=100&fields=name,language,status`);
    if (tpl.status === 200) {
      const rows = tpl.body?.data ?? [];
      const approved = new Set(
        rows.filter((t) => t.status === 'APPROVED').map((t) => `${t.name}::${t.language}`),
      );
      console.log(`${INFO} ${rows.length} template(s) on this WABA; expecting language "${templateLang}"`);

      const required = [
        'gwd_welcome_v1',
        'gwd_attendance_confirmation_v1',
        'gwd_weekly_digest_v1',
        'gwd_fee_reminder_v1',
        'gwd_achievement_v1',
        'gwd_broadcast_v1',
        'gwd_payment_receipt_v1',
        'gwd_owner_new_student_v1',
        'gwd_owner_payment_v1',
      ];

      for (const name of required) {
        if (approved.has(`${name}::${templateLang}`)) {
          console.log(`${PASS} ${name} (${templateLang})`);
        } else {
          const otherLangs = rows.filter((t) => t.name === name);
          if (otherLangs.length === 0) {
            fail(`${name} — not found on this WABA`, 'Submit it in WhatsApp Manager.');
          } else {
            fail(
              `${name} — exists as ${otherLangs.map((t) => `${t.language}/${t.status}`).join(', ')}, ` +
                `but not APPROVED in "${templateLang}"`,
              `A template is keyed on (name, language). Either add the "${templateLang}" ` +
                `translation, or set META_WHATSAPP_TEMPLATE_LANG to the language shown here.`,
            );
          }
        }
      }
    }
  }

  // ── Verdict ────────────────────────────────────────────────────────────
  section('Verdict');
  if (problems === 0) {
    console.log(`${PASS} No configuration problems found. Messages should deliver.\n`);
  } else {
    console.log(
      `${FAIL} ${problems} problem(s) above will stop delivery. Fix them and re-run.\n`,
    );
  }
  process.exit(problems === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('\nDoctor crashed:', e.message, '\n');
  process.exit(1);
});
