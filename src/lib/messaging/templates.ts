import { MESSAGE_PRIORITY } from '@/lib/models/OutboundMessage';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHATSAPP TEMPLATE REGISTRY
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every template here must be SUBMITTED TO AND APPROVED BY META through Interakt
 * before a single message can be delivered. The `interaktTemplateName` and the
 * placeholder count must match the approved template exactly, or the send is
 * rejected at the provider.
 *
 * The exact body text to submit is in the comment above each definition. Copy it
 * verbatim — {{1}}, {{2}} ordering is what `variableOrder` maps onto.
 *
 * NOTE ON T+7 AND T+15 OVERDUE: there are deliberately NO parent-facing
 * templates for those stages. Past T+3 the escalation stops being automated and
 * becomes the owner's personal call. See OwnerAlert.
 * ════════════════════════════════════════════════════════════════════════════
 */

export class TemplateValidationError extends Error {}

export interface TemplateDefinition {
  key: string;
  /** Must match the Meta-approved template name registered in Interakt. */
  interaktTemplateName: string;
  languageCode: string;
  priority: number;
  description: string;
  /** Positional order for the BSP's bodyValues array. */
  variableOrder: string[];
  /** Variables that must be present and non-empty, or the send hard-fails. */
  required: string[];
  /** Plain-text rendering, used for the SMS fallback and the audit trail. */
  plainText: (vars: Record<string, string>) => string;
}

/**
 * SUBMIT TO META AS: gwd_welcome_v1  (category: UTILITY)
 *
 *   Hi {{1}}! {{2}} is now on GWD — {{3}}'s training, attendance and progress
 *   all in one place.
 *
 *   View {{3}}'s Sports Passport: {{4}}
 *
 *   {{5}}
 *
 * {{5}} carries either the payment line or a short neutral sentence, because
 * Meta templates cannot have conditionally-absent parameters — an empty
 * parameter is rejected. See renderWelcome().
 */
const welcome: TemplateDefinition = {
  key: 'welcome',
  interaktTemplateName: 'gwd_welcome_v1',
  languageCode: 'en',
  // Tier 2 rather than payment tier: a welcome is sent once per student, in bulk
  // on import day when little else competes, so it does not need the payment
  // reserve — and must not be able to consume it.
  priority: MESSAGE_PRIORITY.ATTENDANCE,
  description: 'Sent once when a student record is created. Intro + passport link + first payment link if a fee is due.',
  variableOrder: ['parentGreetingName', 'academyName', 'childName', 'passportUrl', 'paymentLine'],
  required: ['parentGreetingName', 'academyName', 'childName', 'passportUrl', 'paymentLine'],
  plainText: (v) =>
    `Hi ${v.parentGreetingName}! ${v.academyName} is now on GWD — ${v.childName}'s training, attendance and progress all in one place. View ${v.childName}'s Sports Passport: ${v.passportUrl} ${v.paymentLine}`,
};

/**
 * SUBMIT TO META AS: gwd_attendance_confirmation_v1  (category: UTILITY)
 *
 *   {{1}} checked in at {{2}} ✅
 *   — {{3}}
 */
const attendanceConfirmation: TemplateDefinition = {
  key: 'attendance_confirmation',
  interaktTemplateName: 'gwd_attendance_confirmation_v1',
  languageCode: 'en',
  priority: MESSAGE_PRIORITY.ATTENDANCE,
  description: 'Fires on attendance.created. The highest-frequency touchpoint — a parent wants to know their child arrived safely.',
  variableOrder: ['childName', 'checkInTime', 'academyName'],
  required: ['childName', 'checkInTime', 'academyName'],
  plainText: (v) => `${v.childName} checked in at ${v.checkInTime} ✅ — ${v.academyName}`,
};

/**
 * SUBMIT TO META AS: gwd_weekly_digest_v1  (category: UTILITY)
 *
 *   {{1}}'s week at {{2}}
 *
 *   Attendance: {{3}}
 *   {{4}}
 *   Next fee due: {{5}}
 *
 *   Full progress: {{6}}
 */
const weeklyDigest: TemplateDefinition = {
  key: 'weekly_digest',
  interaktTemplateName: 'gwd_weekly_digest_v1',
  languageCode: 'en',
  priority: MESSAGE_PRIORITY.ACHIEVEMENT,
  description: 'Scheduled Sunday evening, per student. Attendance %, any achievement, upcoming fee date, passport link.',
  variableOrder: [
    'childName',
    'academyName',
    'attendanceSummary',
    'achievementLine',
    'nextFeeDue',
    'passportUrl',
  ],
  required: ['childName', 'academyName', 'attendanceSummary', 'achievementLine', 'nextFeeDue', 'passportUrl'],
  plainText: (v) =>
    `${v.childName}'s week at ${v.academyName}. Attendance: ${v.attendanceSummary}. ${v.achievementLine} Next fee due: ${v.nextFeeDue}. Full progress: ${v.passportUrl}`,
};

/**
 * SUBMIT TO META AS: gwd_fee_reminder_v1  (category: UTILITY)
 *
 *   {{1}}
 *
 *   {{2}}'s fee of {{3}} is due on {{4}}.
 *
 *   Pay here: {{5}}
 *
 * ONE approved template serves T-5, due-date and T+3. {{1}} carries the
 * stage-specific opening line. Three near-identical templates would mean three
 * separate Meta approvals and three chances of one being rejected while the
 * others pass — which would silently break one stage of the cadence.
 */
function feeReminderTemplate(key: string, description: string): TemplateDefinition {
  return {
    key,
    interaktTemplateName: 'gwd_fee_reminder_v1',
    languageCode: 'en',
    priority: MESSAGE_PRIORITY.PAYMENT,
    description,
    variableOrder: ['openingLine', 'childName', 'amount', 'dueDate', 'paymentUrl'],
    required: ['openingLine', 'childName', 'amount', 'dueDate', 'paymentUrl'],
    plainText: (v) =>
      `${v.openingLine} ${v.childName}'s fee of ${v.amount} is due on ${v.dueDate}. Pay here: ${v.paymentUrl}`,
  };
}

/**
 * SUBMIT TO META AS: gwd_achievement_v1  (category: UTILITY)
 *
 *   🏅 {{1}} earned {{2}} at {{3}}!
 *
 *   See it on their Passport: {{4}}
 */
const achievement: TemplateDefinition = {
  key: 'achievement',
  interaktTemplateName: 'gwd_achievement_v1',
  languageCode: 'en',
  priority: MESSAGE_PRIORITY.ACHIEVEMENT,
  description: 'A milestone or badge. Shareable — this is distribution and retention in one motion.',
  variableOrder: ['childName', 'achievementName', 'academyName', 'passportUrl'],
  required: ['childName', 'achievementName', 'academyName', 'passportUrl'],
  plainText: (v) =>
    `🏅 ${v.childName} earned ${v.achievementName} at ${v.academyName}! See it on their Passport: ${v.passportUrl}`,
};

/**
 * SUBMIT TO META AS: gwd_broadcast_v1  (category: UTILITY)
 *
 *   {{1}}
 *
 *   — {{2}}
 */
const broadcast: TemplateDefinition = {
  key: 'broadcast',
  interaktTemplateName: 'gwd_broadcast_v1',
  languageCode: 'en',
  priority: MESSAGE_PRIORITY.BROADCAST,
  description: 'Owner-composed announcement. Lowest priority — always yields to everything else.',
  variableOrder: ['messageBody', 'academyName'],
  required: ['messageBody', 'academyName'],
  plainText: (v) => `${v.messageBody} — ${v.academyName}`,
};

export const TEMPLATES: Record<string, TemplateDefinition> = {
  welcome,
  attendance_confirmation: attendanceConfirmation,
  weekly_digest: weeklyDigest,
  fee_reminder_t5: feeReminderTemplate(
    'fee_reminder_t5',
    'Five days before the fee falls due. Friendly, includes the payment link.'
  ),
  fee_due_today: feeReminderTemplate(
    'fee_due_today',
    'On the due date. Direct, same payment link.'
  ),
  fee_overdue_3: feeReminderTemplate(
    'fee_overdue_3',
    'Three days overdue. LAST automated parent message in the cadence — T+7 and T+15 are owner-dashboard only.'
  ),
  achievement,
  broadcast,
};

export function getTemplate(key: string): TemplateDefinition {
  const template = TEMPLATES[key];
  if (!template) {
    throw new TemplateValidationError(`Unknown template "${key}"`);
  }
  return template;
}

/** Every distinct Meta template name that must be approved before launch. */
export function requiredInteraktTemplateNames(): string[] {
  return [...new Set(Object.values(TEMPLATES).map((t) => t.interaktTemplateName))].sort();
}

// ---------------------------------------------------------------------------
// Validation — the hard-fail gate before any send
// ---------------------------------------------------------------------------

/**
 * Values that indicate a rendering bug rather than real data. Sending any of
 * these to a parent is worse than sending nothing: "Hi undefined, Rohan's fee of
 * ₹NaN is due on Invalid Date" destroys trust in one message.
 */
const BAD_VALUE_PATTERNS: RegExp[] = [
  /\{\{\s*\d+\s*\}\}/,        // an unrendered placeholder
  /\bundefined\b/i,
  /\bnull\b/i,
  /\bNaN\b/,
  /Invalid Date/i,
  /\[object Object\]/,
];

export interface ValidatedTemplate {
  template: TemplateDefinition;
  /** Positional values, ready for the BSP. */
  variables: string[];
  variableMap: Record<string, string>;
  plainText: string;
}

/**
 * Validates and positionally orders a template's variables.
 *
 * HARD-FAILS rather than sending. A missing amount or a broken link in a fee
 * reminder is not a cosmetic defect — the parent either cannot pay or loses
 * confidence that the platform knows what it is doing.
 */
export function validateAndRender(
  templateKey: string,
  variableMap: Record<string, unknown>
): ValidatedTemplate {
  const template = getTemplate(templateKey);
  const clean: Record<string, string> = {};

  for (const name of template.variableOrder) {
    const raw = variableMap[name];
    const value = raw === undefined || raw === null ? '' : String(raw).trim();

    if (template.required.includes(name) && value.length === 0) {
      throw new TemplateValidationError(
        `Template "${templateKey}" is missing required variable "${name}". Refusing to send.`
      );
    }

    for (const pattern of BAD_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        throw new TemplateValidationError(
          `Template "${templateKey}" variable "${name}" resolved to a bad value ` +
            `(${JSON.stringify(value)}). This is a rendering bug — refusing to send.`
        );
      }
    }

    // WhatsApp rejects newlines and tabs inside template parameters.
    clean[name] = value.replace(/[\r\n\t]+/g, ' ');
  }

  // A variable supplied but not declared means caller and template disagree —
  // usually a renamed variable, which would silently send the wrong text.
  const undeclared = Object.keys(variableMap).filter(
    (name) => !template.variableOrder.includes(name)
  );
  if (undeclared.length > 0) {
    throw new TemplateValidationError(
      `Template "${templateKey}" received undeclared variable(s): ${undeclared.join(', ')}. ` +
        `Declared: ${template.variableOrder.join(', ')}.`
    );
  }

  return {
    template,
    variables: template.variableOrder.map((name) => clean[name]),
    variableMap: clean,
    plainText: template.plainText(clean),
  };
}

/** A passport id anywhere in a string, e.g. inside a link. */
const PASSPORT_ID_PATTERN = /GWD-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}/g;

export interface PassportIdentity {
  passportId: string;
  studentName: string;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CROSS-CONTAMINATION GUARD
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Asserts that the rendered variables actually belong to the student this
 * message is about.
 *
 * This is the check the brief asks for — "hard-fail rather than send if a
 * required variable ... resolves to another student's data". The realistic bug it
 * catches is an off-by-one or a stale closure inside a bulk loop: sixty parents
 * get sixty messages, and one of them carries another child's name or, worse,
 * another child's payment link. Money into the wrong ledger, and a parent who
 * now knows we mix children up.
 *
 * Two independent assertions:
 *   1. Any name variable must match this passport's student name.
 *   2. EVERY passport id appearing anywhere in any variable — including inside
 *      URLs — must be this passport's id.
 * ════════════════════════════════════════════════════════════════════════════
 */
export function assertVariablesBelongTo(
  rendered: ValidatedTemplate,
  identity: PassportIdentity
): void {
  const { variableMap, template } = rendered;

  const declaredName = variableMap.childName;
  if (declaredName && !namesMatch(declaredName, identity.studentName)) {
    throw new TemplateValidationError(
      `Template "${template.key}" would send childName "${declaredName}" to the parent of ` +
        `"${identity.studentName}" (passport ${identity.passportId}). Cross-contamination — refusing to send.`
    );
  }

  for (const [name, value] of Object.entries(variableMap)) {
    const found = value.match(PASSPORT_ID_PATTERN);
    if (!found) continue;

    for (const passportId of found) {
      if (passportId.toUpperCase() !== identity.passportId.toUpperCase()) {
        throw new TemplateValidationError(
          `Template "${template.key}" variable "${name}" references passport ${passportId} ` +
            `but this message is for ${identity.passportId}. Cross-contamination — refusing to send.`
        );
      }
    }
  }
}

/**
 * Name comparison for the guard. Tolerates case and whitespace differences,
 * because a display name may legitimately be trimmed or re-cased, but nothing
 * looser — the point is to catch a DIFFERENT child, so fuzzy matching here would
 * defeat the check.
 */
function namesMatch(a: string, b: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
  return normalize(a) === normalize(b);
}

// ---------------------------------------------------------------------------
// Renderers for the conditional bits Meta templates cannot express
// ---------------------------------------------------------------------------

/**
 * The welcome message's fifth parameter.
 *
 * Meta rejects empty template parameters, so "no fee due" cannot simply be a
 * blank. It becomes a short neutral sentence instead.
 */
export function renderWelcomePaymentLine(input: {
  isFeeDue: boolean;
  amountFormatted?: string;
  paymentUrl?: string;
}): string {
  if (input.isFeeDue && input.amountFormatted && input.paymentUrl) {
    return `This month's fee of ${input.amountFormatted} is due — pay here: ${input.paymentUrl}`;
  }
  return 'No fee is due right now — we will let you know when one is.';
}

/** The weekly digest's achievement line, which is often empty in a quiet week. */
export function renderAchievementLine(achievementName?: string | null): string {
  return achievementName
    ? `Achievement this week: ${achievementName}.`
    : 'No new achievement this week — steady progress.';
}

/** Stage-specific opening line for the shared fee-reminder template. */
export function renderFeeOpeningLine(stage: 't5' | 'due' | 'overdue3'): string {
  switch (stage) {
    case 't5':
      return 'A friendly reminder.';
    case 'due':
      return 'Payment is due today.';
    case 'overdue3':
      return 'This fee is now 3 days overdue.';
  }
}
