import { type ExtractedRow, cleanString, cleanFeeAmount, emptyRow } from './types';

/**
 * CSV import for tech-comfortable owners.
 *
 * Two deliberate choices:
 *
 * 1. No CSV library dependency. The parser below handles quoted fields, escaped
 *    quotes and embedded newlines, which is the whole of RFC 4180 that actually
 *    occurs in an exported student list.
 *
 * 2. Flexible header matching. Owners export from Excel, Google Sheets, or their
 *    previous software, and the column will be called "Student Name", "name",
 *    "Child", "Player" or "STUDENT". Demanding an exact header turns a
 *    ten-second import into a support call, so headers are matched by alias.
 */

const HEADER_ALIASES: Record<keyof ExtractedRow, string[]> = {
  name: ['name', 'student name', 'student', 'child', 'child name', 'player', 'player name', 'full name'],
  mobileNumber: [
    'mobile',
    'mobile number',
    'phone',
    'phone number',
    'contact',
    'contact number',
    'parent mobile',
    'parent phone',
    'parent contact',
    'guardian phone',
    'whatsapp',
    'whatsapp number',
  ],
  parentName: [
    'parent',
    'parent name',
    'father',
    'father name',
    'mother',
    'mother name',
    'guardian',
    'guardian name',
  ],
  sportOrBatch: ['sport', 'sports', 'batch', 'game', 'discipline', 'sport/batch', 'batch name'],
  feeAmount: ['fee', 'fees', 'amount', 'fee amount', 'monthly fee', 'fees amount'],
};

export interface CsvParseResult {
  rows: ExtractedRow[];
  /** Headers we recognised, for showing the owner what mapped to what. */
  mappedColumns: Partial<Record<keyof ExtractedRow, string>>;
  /** Headers present in the file that we ignored. */
  unmappedHeaders: string[];
  /** Set when the file has no recognisable header row. */
  warning?: string;
}

export function parseCsv(content: string): CsvParseResult {
  const table = parseCsvTable(content);
  if (table.length === 0) {
    return { rows: [], mappedColumns: {}, unmappedHeaders: [], warning: 'The file is empty.' };
  }

  const headerRow = table[0].map((cell) => cell.trim().toLowerCase());
  const mapping = mapHeaders(headerRow);
  const mappedIndexes = Object.values(mapping).filter((i): i is number => i !== undefined);

  // No recognisable headers: fall back to positional order, which matches the
  // column order this app's own export and the documented template use.
  if (mappedIndexes.length === 0) {
    const positional: Record<keyof ExtractedRow, number> = {
      name: 0,
      mobileNumber: 1,
      parentName: 2,
      sportOrBatch: 3,
      feeAmount: 4,
    };
    return {
      rows: table.map((cells) => rowFromCells(cells, positional)),
      mappedColumns: {},
      unmappedHeaders: table[0],
      warning:
        'No recognised column headers, so columns were read in order: name, mobile, ' +
        'parent name, sport/batch, fee. Check the preview carefully.',
    };
  }

  const mappedColumns: Partial<Record<keyof ExtractedRow, string>> = {};
  for (const [field, index] of Object.entries(mapping)) {
    if (index !== undefined) {
      mappedColumns[field as keyof ExtractedRow] = table[0][index];
    }
  }

  const unmappedHeaders = table[0].filter((_, index) => !mappedIndexes.includes(index));

  const rows = table
    .slice(1)
    .filter((cells) => cells.some((cell) => cell.trim().length > 0))
    .map((cells) => rowFromCells(cells, mapping));

  return { rows, mappedColumns, unmappedHeaders };
}

function mapHeaders(headerRow: string[]): Partial<Record<keyof ExtractedRow, number>> {
  const mapping: Partial<Record<keyof ExtractedRow, number>> = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<
    [keyof ExtractedRow, string[]]
  >) {
    // Exact alias match first — "parent mobile" should map to the phone column,
    // not the parent-name column, even though both contain "parent".
    let index = headerRow.findIndex((header) => aliases.includes(header));
    if (index === -1) {
      index = headerRow.findIndex(
        (header) => header.length > 0 && aliases.some((alias) => header === alias.replace(/\s+/g, ''))
      );
    }
    if (index !== -1 && !Object.values(mapping).includes(index)) {
      mapping[field] = index;
    }
  }

  return mapping;
}

function rowFromCells(
  cells: string[],
  mapping: Partial<Record<keyof ExtractedRow, number>>
): ExtractedRow {
  const row = emptyRow();
  const at = (field: keyof ExtractedRow): string | undefined => {
    const index = mapping[field];
    return index === undefined ? undefined : cells[index];
  };

  row.name = cleanString(at('name'));
  row.mobileNumber = cleanString(at('mobileNumber'));
  row.parentName = cleanString(at('parentName'));
  row.sportOrBatch = cleanString(at('sportOrBatch'));
  row.feeAmount = cleanFeeAmount(at('feeAmount'));

  return row;
}

/**
 * Minimal RFC 4180 parser: comma-delimited, double-quoted fields, "" as an
 * escaped quote inside a quoted field, CRLF or LF line endings.
 */
export function parseCsvTable(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  // Strip a UTF-8 BOM, which Excel adds and which otherwise corrupts the first
  // header and breaks column mapping.
  const text = content.replace(/^﻿/, '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char === '\r') {
      // Handled by the \n branch; a lone \r is treated as a line ending too.
      if (text[i + 1] !== '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      }
    } else {
      field += char;
    }
  }

  // Flush the final field/row when the file does not end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.length > 0);
}
