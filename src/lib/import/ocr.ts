import { type ExtractedRow, cleanString, cleanFeeAmount } from './types';

/**
 * Register-photo OCR: the owner photographs a page of their paper register and
 * we extract the student rows.
 *
 * PROVIDER CHOICE: GPT-4o Vision, per the brief. Neither an OpenAI key nor
 * Google Cloud Vision credentials were configured in the repo, so there was no
 * existing provider to prefer. GPT-4o is the better fit here regardless — plain
 * OCR returns a bag of text positions and leaves the hard part (deciding which
 * scrawl is a name, which is a phone number, which column is the fee) to us,
 * whereas a vision model can be asked for structured rows directly and handles
 * mixed Devanagari/Latin handwriting in the same pass.
 *
 * Called through fetch rather than the OpenAI SDK deliberately: one HTTP call
 * with a fixed request shape does not justify adding a dependency to a project
 * that has none.
 */

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';

export class OcrNotConfiguredError extends Error {}
export class OcrExtractionError extends Error {}

export function isOcrConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * The extraction prompt.
 *
 * Every instruction here is load-bearing, so change it carefully:
 *
 * - "Return null" rather than "omit" or "guess": a hallucinated phone number
 *   sends a stranger a message about someone else's child. A null gets flagged
 *   for the owner to read off the register themselves. Nulls are cheap; wrong
 *   numbers are not.
 * - Explicit script guidance: registers in this market are written in English,
 *   Hindi and regional scripts, frequently mixed within one page and sometimes
 *   within one row.
 * - "Do not infer": models will happily complete a 9-digit number to 10 digits
 *   or expand an initial into a full name.
 * - Row order preserved: the owner reviews against the physical page, so the
 *   on-screen order has to match the paper.
 */
const EXTRACTION_PROMPT = `You are extracting student records from a photograph of a sports academy's paper attendance/fee register.

Return a JSON object with a single key "students" whose value is an array. One array element per student entry visible in the image, in the same top-to-bottom order as the page.

Each element must have exactly these keys:
{
  "name": string | null,
  "mobile_number": string | null,
  "parent_name": string | null,
  "sport_or_batch": string | null,
  "fee_amount": number | null
}

Rules:
- The handwriting may be in English, Hindi (Devanagari), or another Indian regional script, and scripts may be mixed on the same page or in the same row. Transliterate names into Latin script.
- If a field is not clearly legible, set it to null. DO NOT GUESS and DO NOT INFER.
- Never complete a partially visible phone number. If you can only read 8 or 9 digits, return null.
- Never expand initials or abbreviations into full names. Return exactly what is written.
- mobile_number: digits only, no spaces or punctuation. Indian mobile numbers are 10 digits. If a country code is written, drop it.
- parent_name: only when the register explicitly identifies a parent or guardian. If a single name is written and it is ambiguous whose it is, treat it as the student's name and set parent_name to null.
- fee_amount: a plain number with no currency symbol or separators. A written zero means 0, not null.
- Ignore column headers, page totals, dates and any text that is not a student entry.
- Include a row even when most fields are null, as long as it is clearly a student entry.
- Return ONLY the JSON object, with no commentary.`;

export interface OcrResult {
  rows: ExtractedRow[];
  model: string;
  /** Rows the model returned that we discarded as structurally unusable. */
  discardedCount: number;
}

/**
 * Extracts student rows from a register photograph.
 *
 * @param imageDataUrl A data URI (`data:image/jpeg;base64,...`) or an https URL.
 */
export async function extractRowsFromRegisterImage(imageDataUrl: string): Promise<OcrResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OcrNotConfiguredError(
      'OPENAI_API_KEY is not set, so register-photo OCR is unavailable. ' +
        'CSV and WhatsApp-text import still work.'
    );
  }

  const model = process.env.OPENAI_VISION_MODEL || DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        // Forces syntactically valid JSON, removing the need to strip markdown
        // fences or repair truncated objects.
        response_format: { type: 'json_object' },
        // Deterministic extraction: creativity is the enemy here.
        temperature: 0,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_PROMPT },
              {
                type: 'image_url',
                // "high" detail costs more but handwriting is unreadable at low
                // detail, which defeats the purpose of the feature.
                image_url: { url: imageDataUrl, detail: 'high' },
              },
            ],
          },
        ],
      }),
    });
  } catch (err: any) {
    throw new OcrExtractionError(`Could not reach the vision API: ${err?.message || err}`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new OcrExtractionError(
      `Vision API returned ${response.status}. ${truncate(detail, 300)}`
    );
  }

  const payload = await response.json().catch(() => null);
  const content: string | undefined = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new OcrExtractionError('Vision API returned no content.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new OcrExtractionError('Vision API returned content that was not valid JSON.');
  }

  const raw = Array.isArray(parsed?.students)
    ? parsed.students
    : // Tolerate a bare array despite the instruction to wrap it.
      Array.isArray(parsed)
      ? parsed
      : [];

  const rows: ExtractedRow[] = [];
  let discardedCount = 0;

  for (const entry of raw) {
    const row = normalizeOcrEntry(entry);
    if (row) rows.push(row);
    else discardedCount++;
  }

  return { rows, model, discardedCount };
}

/**
 * Converts one model-returned object into our row shape.
 *
 * Never trusts the model's types: it will occasionally return a number for a
 * name, the string "null", or a fee as "Rs. 2500" despite instructions.
 */
function normalizeOcrEntry(entry: unknown): ExtractedRow | null {
  if (!entry || typeof entry !== 'object') return null;
  const source = entry as Record<string, unknown>;

  const row: ExtractedRow = {
    name: nullifyLiteralNull(cleanString(source.name)),
    mobileNumber: nullifyLiteralNull(cleanString(source.mobile_number ?? source.mobileNumber)),
    parentName: nullifyLiteralNull(cleanString(source.parent_name ?? source.parentName)),
    sportOrBatch: nullifyLiteralNull(cleanString(source.sport_or_batch ?? source.sportOrBatch)),
    feeAmount: cleanFeeAmount(source.fee_amount ?? source.feeAmount),
  };

  // A row with nothing in it at all carries no information for the owner.
  if (!row.name && !row.mobileNumber && !row.parentName) return null;

  return row;
}

/** Models sometimes emit the literal strings "null", "N/A", "-" instead of null. */
function nullifyLiteralNull(value: string | null): string | null {
  if (value === null) return null;
  return /^(?:null|nil|n\/?a|none|-{1,2}|\?+)$/i.test(value) ? null : value;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
