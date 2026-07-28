#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════════════
 * CREATE THE 9 GWD TEMPLATES ON A WABA
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A Meta template belongs to ONE WhatsApp Business Account. Going through the
 * WhatsApp onboarding flow more than once silently creates a NEW WABA each
 * time, and it is easy to end up with the templates on one account and the
 * phone number on another — at which point every send fails with
 * "(#132001) Template name does not exist in the translation" (or an opaque
 * permission error), while WhatsApp Manager shows everything Approved.
 *
 * This recreates all 9 on whichever WABA actually owns the sending number.
 *
 *   node scripts/create-whatsapp-templates.mjs <WABA_ID> [--lang en_US] [--dry]
 *
 * Bodies carry deliberate "padding" prose. Meta's spam filter rejects Utility
 * templates with a high variable-to-text ratio, and rejects any body that
 * STARTS or ENDS with a variable — so none of these do.
 *
 * Placeholder counts here must match `variableOrder` in
 * src/lib/messaging/templates.ts exactly; a mismatch is only ever reported at
 * send time, never at approval time.
 * ════════════════════════════════════════════════════════════════════════════
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const WABA = args.find((a) => !a.startsWith('--'));
const LANG = (args.find((a) => a.startsWith('--lang='))?.split('=')[1] || 'en_US').trim();
const DRY = args.includes('--dry');
/** Retry a subset without resubmitting names that already succeeded. */
const ONLY = args.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',').filter(Boolean);

if (!WABA) {
  console.error('\nUsage: node scripts/create-whatsapp-templates.mjs <WABA_ID> [--lang=en_US] [--dry]\n');
  process.exit(1);
}

function readEnv() {
  const file = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...readEnv(), ...process.env };
const token = env.META_WHATSAPP_ACCESS_TOKEN;
if (!token) {
  console.error('META_WHATSAPP_ACCESS_TOKEN is not set.');
  process.exit(1);
}

/** name → { body, examples }. Example count MUST equal placeholder count. */
const TEMPLATES = [
  {
    name: 'gwd_welcome_v1',
    body:
      "Hello {{1}}, welcome aboard! We are excited to announce that {{2}} is now officially on the GWD platform. This means that {{3}}'s training schedule, attendance records, and overall progress will all be available in one convenient place for you.\n\nYou can view their complete Sports Passport right here: {{4}}\n\nHere is a quick update on your account: {{5}}\n\nTo access the platform, {{6}}\n\nIf you have any questions, feel free to reach out to the academy. Have a great day!",
    examples: [
      'Rajesh',
      'Master Grid FC',
      'Aryan',
      'https://gwdsports.in/passport/xyz123',
      'A fee of 2000 is due for this month.',
      'You can sign in using your registered phone number.',
    ],
  },
  {
    name: 'gwd_attendance_confirmation_v1',
    /**
     * Meta rejects a body that ENDS with a variable, and a trailing full stop
     * does not count as text — "The team at {{3}}." was refused. A real
     * closing sentence after the last placeholder is what satisfies it.
     */
    body:
      'Hello! This is a quick automated update to let you know that {{1}} has successfully checked in at exactly {{2}}.\n\nWe hope they have a great training session today!\n\nBest regards,\nThe team at {{3}}.\n\nThank you for choosing us.',
    examples: ['Aryan', '04:30 PM', 'Master Grid FC'],
  },
  {
    name: 'gwd_weekly_digest_v1',
    body:
      "Hello! Here is the weekly training digest for {{1}}'s recent sessions at {{2}}.\n\nThis week's attendance record is: {{3}}.\nHere is their latest highlight: {{4}}.\nPlease note that the next fee is scheduled for: {{5}}.\n\nYou can always check their full progress and training history by visiting their passport link here: {{6}}.\n\nKeep up the great work!",
    examples: [
      'Aryan',
      'Master Grid FC',
      '3/3 sessions (100%)',
      'Earned Star Player Badge',
      '05 Aug 2026',
      'https://gwdsports.in/passport/xyz123',
    ],
  },
  {
    name: 'gwd_fee_reminder_v1',
    body:
      "Hello! We have an important update regarding your account: {{1}}\n\nThis is a friendly reminder that {{2}}'s upcoming coaching fee of {{3}} is scheduled to be due on {{4}}.\n\nYou can securely complete the payment online by clicking this link: {{5}}.\n\nThank you for your prompt attention to this matter!",
    examples: ['Friendly reminder', 'Aryan', '2000', '05 Aug 2026', 'https://gwdsports.in/pay/xyz123'],
  },
  {
    name: 'gwd_achievement_v1',
    body:
      'Great news! We are thrilled to share that {{1}} has officially earned the {{2}} achievement during their time at {{3}}!\n\nYou can see this new milestone and all other updates on their personalized Sports Passport right here: {{4}}.\n\nWe are incredibly proud of their progress!',
    examples: ['Aryan', 'Hat-Trick Hero', 'Master Grid FC', 'https://gwdsports.in/passport/xyz123'],
  },
  {
    name: 'gwd_broadcast_v1',
    // Same trailing-variable rule as the attendance template above.
    body:
      'Hello! We have an important announcement for you:\n\n{{1}}\n\nIf you have any questions about this update, please let us know.\n\nBest regards,\nManagement at {{2}}.\n\nThank you for your attention.',
    examples: ['Training is cancelled today due to heavy rain.', 'Master Grid FC'],
  },
  {
    name: 'gwd_payment_receipt_v1',
    body:
      "Payment successfully received - thank you so much!\n\nThis confirms the transaction for {{1}}'s training at {{2}}.\nThe total amount processed is: {{3}}.\nYour official receipt number for this transaction is: {{4}}.\n\nYou can view and download your full official receipt by visiting this link: {{5}}.\n\nThank you for your continued support!",
    examples: ['Aryan', 'Master Grid FC', '2000', 'RCPT-98765', 'https://gwdsports.in/receipt/xyz123'],
  },
  {
    name: 'gwd_owner_new_student_v1',
    body:
      'Awesome news! A brand new student has just joined {{1}}!\n\nStudent Details:\nName: {{2}}\nParent or Guardian: {{3}}\nSelected Sports: {{4}}\n\nYou can view the newly generated student passport profile right here: {{5}}.\n\nLet us give them a great welcome to the academy!',
    examples: ['Master Grid FC', 'Aryan', 'Rajesh', 'Football', 'https://gwdsports.in/passport/xyz123'],
  },
  {
    name: 'gwd_owner_payment_v1',
    body:
      'Great news! A new payment has been successfully received at {{1}}!\n\nTransaction Details:\nStudent Name: {{2}}\nAmount Paid: {{3}}\n\nYou can view the full official receipt for your records by clicking this link: {{4}}.\n\nKeep up the great work running the academy!',
    examples: ['Master Grid FC', 'Aryan', '2000', 'https://gwdsports.in/receipt/xyz123'],
  },
];

/** Guards the mismatch Meta only reports at send time. */
function placeholderCount(body) {
  return new Set(body.match(/\{\{\d+\}\}/g) ?? []).size;
}

async function main() {
  console.log(`\nCreating ${TEMPLATES.length} templates on WABA ${WABA} in "${LANG}"${DRY ? ' (dry run)' : ''}\n`);

  let ok = 0;
  let failed = 0;

  for (const t of TEMPLATES) {
    if (ONLY && !ONLY.includes(t.name)) continue;
    const count = placeholderCount(t.body);
    if (count !== t.examples.length) {
      console.log(`  ✗ ${t.name}: ${count} placeholders but ${t.examples.length} examples — refusing to submit`);
      failed++;
      continue;
    }

    if (DRY) {
      console.log(`  · ${t.name}: ${count} params, ${t.body.length} chars — looks valid`);
      ok++;
      continue;
    }

    const payload = {
      name: t.name,
      language: LANG,
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: t.body,
          example: { body_text: [t.examples] },
        },
      ],
    };

    const res = await fetch(`https://graph.facebook.com/v21.0/${WABA}/message_templates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();

    if (res.status === 200 && body.id) {
      console.log(`  ✓ ${t.name} → ${body.status ?? 'submitted'} (${body.id})`);
      ok++;
    } else {
      const msg = body?.error?.error_user_msg || body?.error?.message || JSON.stringify(body);
      console.log(`  ✗ ${t.name}: ${msg}`);
      failed++;
    }
  }

  console.log(`\n${ok} submitted, ${failed} failed.`);
  console.log('Templates land as PENDING and are usually auto-approved for UTILITY within minutes.');
  console.log(`Verify with: npm run whatsapp:doctor ${WABA}\n`);
}

main().catch((e) => {
  console.error('\nFailed:', e.message, '\n');
  process.exit(1);
});
