/**
 * Pulls a check-in token out of whatever a parent actually gives us.
 *
 * It arrives by three different routes and all three have to work: scanned from
 * a QR (which encodes a full URL), pasted out of a WhatsApp message (a URL,
 * often with tracking parameters appended), or typed off the printed poster by
 * someone who only copied the code part.
 *
 * Lives in lib rather than beside the component because the test runner is
 * configured for a node environment with no JSX transform — a pure helper
 * inside a .tsx file is untestable here, and this is exactly the sort of
 * parsing that should be tested.
 */
const TOKEN = /^[a-f0-9]{32}$/i;
const IN_URL = /\/check-in\/([a-f0-9]{32})/i;

export function extractToken(raw: string): string | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;

  if (TOKEN.test(value)) return value.toLowerCase();

  const match = value.match(IN_URL);
  return match ? match[1].toLowerCase() : null;
}
