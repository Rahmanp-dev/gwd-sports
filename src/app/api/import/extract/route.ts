import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { adminMiddleware } from '@/lib/middleware/auth';
import ImportJob, { type ImportMethod } from '@/lib/models/ImportJob';
import { Academy } from '@/lib/models/Academy';
import { parseWhatsAppText } from '@/lib/import/parseText';
import { parseCsv } from '@/lib/import/parseCsv';
import {
  extractRowsFromRegisterImage,
  isOcrConfigured,
  OcrNotConfiguredError,
  OcrExtractionError,
} from '@/lib/import/ocr';
import { stageRows } from '@/lib/import/flags';
import type { ExtractedRow } from '@/lib/import/types';

/**
 * Step 1 of the import wizard: extract rows and stage them for review.
 *
 * WRITES NOTHING TO THE STUDENT COLLECTIONS. It creates an ImportJob holding the
 * extracted rows and returns it for the owner to review and edit. Only
 * POST /api/import/[jobId]/commit creates students.
 *
 * Body (JSON):
 *   { method: 'register_ocr',  imageDataUrl: string }
 *   { method: 'whatsapp_text', text: string }
 *   { method: 'csv',           csvContent: string, fileName?: string }
 *
 * Optional for all methods:
 *   defaultSport — applied to rows with no sport, so single-sport academies
 *   don't have to type it on every row.
 */

// A register page photo at high detail; generous but bounded.
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_TEXT_LENGTH = 200_000;

export async function POST(req: NextRequest) {
  try {
    const auth = await adminMiddleware(req);
    if (auth?.error) {
      return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
    }
    await connectToDatabase();

    const academyId = auth.academyId;
    if (!academyId) {
      return NextResponse.json(
        { success: false, message: 'Your account is not linked to an academy.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const method: ImportMethod = body.method;

    if (!['register_ocr', 'whatsapp_text', 'csv'].includes(method)) {
      return NextResponse.json(
        { success: false, message: 'method must be register_ocr, whatsapp_text or csv' },
        { status: 400 }
      );
    }

    const academy = await Academy.findById(academyId).select('name sports');
    // Single-sport academies get a sensible default so "sport" being required
    // never blocks an import.
    const defaultSport =
      body.defaultSport ?? (academy?.sports?.length === 1 ? academy.sports[0] : null);

    let rows: ExtractedRow[] = [];
    let extractionModel: string | null = null;
    let sourceTextPreview: string | null = null;
    let sourceFileName: string | null = null;
    let parseWarning: string | undefined;
    let mappedColumns: Record<string, string> | undefined;
    let unmappedHeaders: string[] | undefined;

    if (method === 'register_ocr') {
      if (!isOcrConfigured()) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Register-photo OCR is not configured (OPENAI_API_KEY is missing). ' +
              'Use CSV or WhatsApp-text import, or set the key.',
            code: 'OCR_NOT_CONFIGURED',
          },
          { status: 503 }
        );
      }

      const imageDataUrl: string = body.imageDataUrl;
      if (typeof imageDataUrl !== 'string' || !imageDataUrl) {
        return NextResponse.json(
          { success: false, message: 'imageDataUrl is required' },
          { status: 400 }
        );
      }
      if (approximateDataUrlBytes(imageDataUrl) > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { success: false, message: 'That image is over 12 MB. Please compress it and retry.' },
          { status: 413 }
        );
      }

      const ocr = await extractRowsFromRegisterImage(imageDataUrl);
      rows = ocr.rows;
      extractionModel = ocr.model;
      if (ocr.discardedCount > 0) {
        parseWarning = `${ocr.discardedCount} unreadable entries were discarded.`;
      }
    } else if (method === 'whatsapp_text') {
      const text: string = body.text;
      if (typeof text !== 'string' || !text.trim()) {
        return NextResponse.json({ success: false, message: 'text is required' }, { status: 400 });
      }
      if (text.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
          { success: false, message: 'That message is too long to parse in one go.' },
          { status: 413 }
        );
      }
      rows = parseWhatsAppText(text);
      sourceTextPreview = text.slice(0, 2000);
    } else {
      const csvContent: string = body.csvContent;
      if (typeof csvContent !== 'string' || !csvContent.trim()) {
        return NextResponse.json(
          { success: false, message: 'csvContent is required' },
          { status: 400 }
        );
      }
      if (csvContent.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
          { success: false, message: 'That file is too large. Split it and import in batches.' },
          { status: 413 }
        );
      }
      const parsed = parseCsv(csvContent);
      rows = parsed.rows;
      parseWarning = parsed.warning;
      mappedColumns = parsed.mappedColumns as Record<string, string>;
      unmappedHeaders = parsed.unmappedHeaders;
      sourceFileName = body.fileName ?? null;
      sourceTextPreview = csvContent.slice(0, 2000);
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No student entries could be read from that. Check the image is in focus, or ' +
            'that the text/file contains one student per line.',
          code: 'NO_ROWS_EXTRACTED',
          data: { parseWarning },
        },
        { status: 422 }
      );
    }

    const staged = await stageRows(rows, { academyId, defaultSport });

    const job = await ImportJob.create({
      academyId,
      createdBy: auth.user._id,
      method,
      status: 'awaiting_review',
      rows: staged,
      extractionModel,
      sourceTextPreview,
      sourceFileName,
      sourceImageUrl: null,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: String(job._id),
        method,
        defaultSport,
        rows: job.rows,
        counts: summarise(job.rows),
        parseWarning,
        mappedColumns,
        unmappedHeaders,
      },
    });
  } catch (error: any) {
    if (error instanceof OcrNotConfiguredError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 503 });
    }
    if (error instanceof OcrExtractionError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 502 });
    }
    console.error('[import/extract]', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Extraction failed' },
      { status: 500 }
    );
  }
}

export function summarise(rows: Array<{ status: string }>) {
  const counts = { total: rows.length, ready: 0, needsReview: 0, skipped: 0, created: 0, failed: 0 };
  for (const row of rows) {
    if (row.status === 'ready') counts.ready++;
    else if (row.status === 'needs_review' || row.status === 'pending') counts.needsReview++;
    else if (row.status === 'skipped') counts.skipped++;
    else if (row.status === 'created') counts.created++;
    else if (row.status === 'failed') counts.failed++;
  }
  return counts;
}

/** Base64 is ~4/3 the size of the bytes it encodes. */
function approximateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  const base64Length = commaIndex === -1 ? dataUrl.length : dataUrl.length - commaIndex - 1;
  return Math.floor((base64Length * 3) / 4);
}
