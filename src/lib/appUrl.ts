/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE PUBLIC BASE URL FOR LINKS WE SEND TO PARENTS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Four modules independently wrote:
 *
 *   const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gwd.in';
 *
 * With the variable unset, that fallback is not a safe default — it is a
 * silent, confident wrong answer. Every passport link, payment link and
 * sign-in link sent to a parent pointed at a domain this deployment does not
 * serve, and nothing anywhere reported a problem: the message queued, sent,
 * and was recorded as delivered. The only symptom is a parent tapping a dead
 * link, which nobody on this side ever sees.
 *
 * This keeps a fallback (a broken link still beats a crash mid-import) but
 * makes the condition LOUD in logs and reportable to the health screen, so it
 * is discovered before a parent finds it.
 * ════════════════════════════════════════════════════════════════════════════
 */

const FALLBACK = 'https://gwd.in';

let warned = false;

/** True when NEXT_PUBLIC_APP_URL is missing and links are using the fallback. */
export function isAppUrlConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim());
}

/**
 * Base URL with no trailing slash, so callers can safely template
 * `${appUrl()}/passport/${id}` without producing a double slash.
 */
export function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configured) {
    if (!warned) {
      warned = true;
      console.error(
        '[appUrl] NEXT_PUBLIC_APP_URL is not set. Every link sent to a parent ' +
          `will point at ${FALLBACK}, which is almost certainly not this ` +
          'deployment. Set it to the public origin, e.g. https://sports.example.com',
      );
    }
    return FALLBACK;
  }

  return configured.replace(/\/+$/, '');
}
