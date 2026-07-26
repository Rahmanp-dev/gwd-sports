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
// Meta WhatsApp Cloud API (direct — no BSP reseller)
// ---------------------------------------------------------------------------

/**
 * Pinned API version, deliberately.
 *
 * Graph API versions are deprecated on a rolling ~2-year schedule and the
 * unversioned URL follows the newest, which means Meta could change the request
 * shape under us without a deploy on our side. Bump this on purpose, having
 * read the changelog — never implicitly.
 */
const META_GRAPH_VERSION = 'v21.0';

/**
 * Meta's WhatsApp Cloud API, talking to Meta directly rather than through a
 * BSP reseller.
 *
 * Auth is `Authorization: Bearer <token>`. Use a **System User** token from
 * Business Settings, not the temporary 24-hour token the App Dashboard shows
 * on the getting-started panel — that one expires overnight and produces a
 * baffling 401 the next morning.
 *
 * Meta wants the recipient as digits with country code and NO leading `+`
 * ("919876543210"). It accepts the `+` form too, but the digit form is what the
 * docs specify and what the status webhook echoes back.
 *
 * Template parameters are positional and must exactly match the number of
 * `{{n}}` placeholders in the approved template body. A mismatch is a permanent
 * 400 (`132000`), never a transient one — retrying it just burns quota.
 */
export class MetaCloudProvider implements WhatsAppProvider {
  name = 'meta_cloud';

  isConfigured(): boolean {
    return Boolean(
      process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID
    );
  }

  async sendTemplate(params: SendTemplateParams): Promise<ProviderSendResult> {
    const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return {
        outcome: 'not_configured',
        retryable: false,
        error:
          'META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID are required',
      };
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
      response = await fetch(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: `91${national}`,
            type: 'template',
            template: {
              name: params.templateName,
              language: { code: params.languageCode },
              // Body-only components: none of our templates carry header media
              // or buttons with variables. Sending an empty `components` array
              // for a template with no placeholders is also valid.
              components: params.bodyValues.length
                ? [
                    {
                      type: 'body',
                      parameters: params.bodyValues.map((text) => ({
                        type: 'text',
                        text,
                      })),
                    },
                  ]
                : [],
            },
          }),
          // A hung request must not hold a cron worker open indefinitely.
          signal: AbortSignal.timeout(15_000),
        }
      );
    } catch (err: any) {
      return {
        outcome: 'transient_failure',
        retryable: true,
        error: `Meta request failed: ${err?.message || err}`,
      };
    }

    const bodyText = await response.text().catch(() => '');
    let body: any;
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      body = { raw: bodyText.slice(0, 300) };
    }

    if (response.ok && body?.messages?.[0]?.id) {
      return {
        // `wamid.…` — this is what the status webhook correlates against.
        outcome: 'accepted',
        providerMessageId: body.messages[0].id,
        retryable: false,
      };
    }

    /**
     * Meta puts a numeric `code` in the error body that is far more reliable
     * than the HTTP status for deciding retryability:
     *   4 / 80007  — application or account rate limit  → retry
     *   131048     — per-number send limit reached       → retry
     *   131056     — pair rate limit                     → retry
     *   132xxx     — template problems (missing, param mismatch, not approved)
     *   131026     — recipient is not on WhatsApp
     * The 132xxx and 131026 families never succeed on retry.
     */
    const code = Number(body?.error?.code);
    const retryableCodes = new Set([4, 80007, 131048, 131056, 131000]);
    const retryable =
      retryableCodes.has(code) || response.status === 429 || response.status >= 500;

    return {
      outcome: retryable ? 'transient_failure' : 'rejected',
      retryable,
      error:
        `Meta returned ${response.status}` +
        (code ? ` (code ${code})` : '') +
        ': ' +
        (body?.error?.message ?? bodyText.slice(0, 300) ?? 'no detail'),
    };
  }
}

// ---------------------------------------------------------------------------
// No-op provider
// ---------------------------------------------------------------------------

/**
 * Used when no WhatsApp credentials are configured.
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
      error:
        'No WhatsApp provider configured (META_WHATSAPP_ACCESS_TOKEN / ' +
        'META_WHATSAPP_PHONE_NUMBER_ID missing)',
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

  const meta = new MetaCloudProvider();
  if (meta.isConfigured()) return meta;

  return new NoopProvider();
}

export function resolveSmsProvider(): SmsProvider | null {
  if (smsOverride) return smsOverride;

  const msg91 = new Msg91SmsProvider();
  return msg91.isConfigured() ? msg91 : null;
}
