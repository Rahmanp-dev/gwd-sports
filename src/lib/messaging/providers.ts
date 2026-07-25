import { requirePhone } from '@/lib/phone';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BSP ABSTRACTION — THE PROVIDER IS SWAPPABLE ON PURPOSE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Interakt is the BSP today, not forever. WhatsApp Business Solution Providers
 * are interchangeable resellers of the same Meta Cloud API: pricing, rate limits
 * and template-approval turnaround differ between them, and switching BSP is a
 * commercial decision that should cost one file, not a rewrite of the messaging
 * engine.
 *
 * Nothing outside this file may import the Interakt SDK, reference an Interakt
 * URL, or branch on the provider's name. Everything goes through
 * WhatsAppProvider.
 * ════════════════════════════════════════════════════════════════════════════
 */

export type SendOutcome = 'accepted' | 'rejected' | 'transient_failure' | 'not_configured';

export interface ProviderSendResult {
  outcome: SendOutcome;
  /** The BSP's own id, used to correlate later status callbacks. */
  providerMessageId?: string | null;
  /** Provider-facing error, for the audit trail. */
  error?: string | null;
  /**
   * True when retrying could plausibly succeed (timeout, 5xx, rate limit).
   * False for a permanent rejection (unapproved template, invalid number) —
   * retrying those just burns quota and delays the SMS fallback.
   */
  retryable: boolean;
}

export interface SendTemplateParams {
  /** E.164, e.g. "+919876543210". */
  toPhoneE164: string;
  /** The Meta-approved template name. */
  templateName: string;
  languageCode: string;
  /** Positional body parameters, already validated. */
  bodyValues: string[];
  /** Plain text equivalent, for providers/channels that need it. */
  plainText: string;
}

export interface WhatsAppProvider {
  name: string;
  isConfigured(): boolean;
  sendTemplate(params: SendTemplateParams): Promise<ProviderSendResult>;
}

// ---------------------------------------------------------------------------
// Interakt
// ---------------------------------------------------------------------------

const INTERAKT_ENDPOINT = 'https://api.interakt.ai/v1/public/message/';

/**
 * Interakt's public message API.
 *
 * Auth is `Authorization: Basic <API_KEY>` where the key is ALREADY base64 —
 * Interakt issues it pre-encoded, so encoding it again is the classic
 * first-integration failure and produces a confusing 401.
 *
 * Interakt wants the country code and the subscriber number as separate fields
 * rather than a single E.164 string.
 */
export class InteraktProvider implements WhatsAppProvider {
  name = 'interakt';

  isConfigured(): boolean {
    return Boolean(process.env.INTERAKT_API_KEY);
  }

  async sendTemplate(params: SendTemplateParams): Promise<ProviderSendResult> {
    const apiKey = process.env.INTERAKT_API_KEY;
    if (!apiKey) {
      return { outcome: 'not_configured', retryable: false, error: 'INTERAKT_API_KEY is not set' };
    }

    let national: string;
    try {
      national = requirePhone(params.toPhoneE164).national;
    } catch {
      return {
        outcome: 'rejected',
        retryable: false,
        error: `Not a valid Indian mobile number: ${params.toPhoneE164}`,
      };
    }

    let response: Response;
    try {
      response = await fetch(INTERAKT_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryCode: '+91',
          phoneNumber: national,
          type: 'Template',
          template: {
            name: params.templateName,
            languageCode: params.languageCode,
            bodyValues: params.bodyValues,
          },
        }),
        // A hung BSP request must not hold a cron worker open indefinitely.
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err: any) {
      // Network error or timeout — worth retrying.
      return {
        outcome: 'transient_failure',
        retryable: true,
        error: `Interakt request failed: ${err?.message || err}`,
      };
    }

    const bodyText = await response.text().catch(() => '');
    let body: any;
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      body = { raw: bodyText.slice(0, 300) };
    }

    if (response.ok && body?.result !== false) {
      return {
        outcome: 'accepted',
        providerMessageId: body?.id ?? body?.messageId ?? null,
        retryable: false,
      };
    }

    // 429 and 5xx are worth retrying; 4xx generally is not. An unapproved
    // template or a number not on WhatsApp will never succeed on retry, and
    // treating it as retryable delays the SMS fallback that could still land.
    const retryable = response.status === 429 || response.status >= 500;

    return {
      outcome: retryable ? 'transient_failure' : 'rejected',
      retryable,
      error:
        `Interakt returned ${response.status}: ` +
        (body?.message ?? body?.error ?? bodyText.slice(0, 300) ?? 'no detail'),
    };
  }
}

// ---------------------------------------------------------------------------
// No-op provider
// ---------------------------------------------------------------------------

/**
 * Used when no BSP is configured — which is the state of this deployment right
 * now, since there are no Interakt credentials yet.
 *
 * It logs and reports `not_configured` rather than throwing, so the rest of the
 * engine can be exercised end to end in development and messages accumulate as
 * `skipped` with a clear reason instead of `failed`. A developer running the
 * import wizard locally should not see fake delivery failures.
 */
export class NoopProvider implements WhatsAppProvider {
  name = 'noop';

  isConfigured(): boolean {
    return true;
  }

  async sendTemplate(params: SendTemplateParams): Promise<ProviderSendResult> {
    console.log(
      `[messaging:noop] would send "${params.templateName}" to ${params.toPhoneE164}: ${params.plainText}`
    );
    return {
      outcome: 'not_configured',
      retryable: false,
      error: 'No WhatsApp provider configured (INTERAKT_API_KEY missing)',
    };
  }
}

// ---------------------------------------------------------------------------
// SMS fallback
// ---------------------------------------------------------------------------

export interface SmsProvider {
  name: string;
  isConfigured(): boolean;
  sendText(params: { toPhoneE164: string; text: string }): Promise<ProviderSendResult>;
}

/**
 * SMS fallback over MSG91, which the project already had partial wiring for in
 * src/lib/sms.ts.
 *
 * INCOMPLETE BY NECESSITY, FLAGGED RATHER THAN FAKED: MSG91 transactional SMS in
 * India requires DLT-registered templates with a template id per message type,
 * and no such ids are configured (`MSG91_TEMPLATE_ID_*` are all unset). Free-text
 * SMS is not deliverable to Indian numbers under TRAI DLT rules, so this cannot
 * be made to work by writing more code here — it needs DLT template registration
 * first.
 *
 * The interface and the fallback trigger path are complete and tested. When the
 * DLT ids exist, only sendText() below changes.
 */
export class Msg91SmsProvider implements SmsProvider {
  name = 'msg91';

  isConfigured(): boolean {
    return Boolean(process.env.MSG91_API_KEY && process.env.MSG91_TEMPLATE_ID_GENERIC);
  }

  async sendText(params: { toPhoneE164: string; text: string }): Promise<ProviderSendResult> {
    const apiKey = process.env.MSG91_API_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID_GENERIC;

    if (!apiKey || !templateId) {
      return {
        outcome: 'not_configured',
        retryable: false,
        error:
          'SMS fallback unavailable: MSG91_API_KEY and MSG91_TEMPLATE_ID_GENERIC are required. ' +
          'Indian SMS also requires a DLT-registered template.',
      };
    }

    let national: string;
    try {
      national = requirePhone(params.toPhoneE164).national;
    } catch {
      return { outcome: 'rejected', retryable: false, error: 'Invalid mobile number' };
    }

    try {
      const response = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: { authkey: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          short_url: '0',
          recipients: [{ mobiles: `91${national}`, MESSAGE: params.text }],
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) {
        const body: any = await response.json().catch(() => ({}));
        return { outcome: 'accepted', providerMessageId: body?.request_id ?? null, retryable: false };
      }
      const retryable = response.status === 429 || response.status >= 500;
      return {
        outcome: retryable ? 'transient_failure' : 'rejected',
        retryable,
        error: `MSG91 returned ${response.status}`,
      };
    } catch (err: any) {
      return {
        outcome: 'transient_failure',
        retryable: true,
        error: `MSG91 request failed: ${err?.message || err}`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

let whatsappOverride: WhatsAppProvider | null = null;
let smsOverride: SmsProvider | null = null;

/** Test seam. Lets the send worker be exercised without network access. */
export function __setProvidersForTesting(
  whatsapp: WhatsAppProvider | null,
  sms: SmsProvider | null = null
): void {
  whatsappOverride = whatsapp;
  smsOverride = sms;
}

export function resolveWhatsAppProvider(): WhatsAppProvider {
  if (whatsappOverride) return whatsappOverride;

  const interakt = new InteraktProvider();
  if (interakt.isConfigured()) return interakt;

  return new NoopProvider();
}

export function resolveSmsProvider(): SmsProvider | null {
  if (smsOverride) return smsOverride;

  const msg91 = new Msg91SmsProvider();
  return msg91.isConfigured() ? msg91 : null;
}
