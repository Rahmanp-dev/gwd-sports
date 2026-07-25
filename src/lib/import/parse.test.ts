import { describe, it, expect } from 'vitest';
import { parseWhatsAppText } from './parseText';
import { parseCsv, parseCsvTable } from './parseCsv';
import { cleanFeeAmount } from './types';

describe('parseWhatsAppText — realistic forwarded lists', () => {
  it('parses a numbered dash-separated roster', () => {
    const rows = parseWhatsAppText(`
1. Rohan Sharma - 9876543210 - 2500
2. Aditya Verma - 9123456789 - 2500
3. Priya Nair - 8765432109 - 3000
    `);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      name: 'Rohan Sharma',
      mobileNumber: '9876543210',
      feeAmount: 2500,
    });
    expect(rows[2]).toMatchObject({ name: 'Priya Nair', feeAmount: 3000 });
  });

  it('parses a comma-separated roster including a sport column', () => {
    const rows = parseWhatsAppText(`
Rohan Sharma, 9876543210, Cricket, Rs 2500
Aditya Verma, 9123456789, Swimming, Rs 2000
    `);

    expect(rows[0]).toMatchObject({
      name: 'Rohan Sharma',
      mobileNumber: '9876543210',
      sportOrBatch: 'Cricket',
      feeAmount: 2500,
    });
    expect(rows[1].sportOrBatch).toBe('Swimming');
  });

  it('handles varied numbering, bullets and WhatsApp emphasis markers', () => {
    const rows = parseWhatsAppText(`
1) Rohan Sharma 9876543210
2] Aditya Verma 9123456789
- Priya Nair 8765432109
• Karan Mehta 7654321098
*Sneha Rao* 9988776655
    `);

    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.name)).toEqual([
      'Rohan Sharma',
      'Aditya Verma',
      'Priya Nair',
      'Karan Mehta',
      'Sneha Rao',
    ]);
  });

  it('extracts an explicitly labelled parent name without confusing it for the student', () => {
    const rows = parseWhatsAppText('Priya Nair 8765432109 (mother: Latha Nair)');
    expect(rows[0].name).toBe('Priya Nair');
    expect(rows[0].parentName).toBe('Latha Nair');
  });

  it('leaves parentName null when no guardian is labelled — it does not guess', () => {
    const rows = parseWhatsAppText('Rohan Sharma 9876543210 Cricket');
    expect(rows[0].parentName).toBeNull();
  });

  it('parses currency-marked fees in several formats', () => {
    const cases: Array<[string, number]> = [
      ['Rohan 9876543210 ₹2,500', 2500],
      ['Rohan 9876543210 Rs 2500', 2500],
      ['Rohan 9876543210 Rs. 3,000/-', 3000],
      ['Rohan 9876543210 INR 1750', 1750],
    ];
    for (const [line, expected] of cases) {
      expect(parseWhatsAppText(line)[0].feeAmount, line).toBe(expected);
    }
  });

  it('does not mistake a small number for a fee', () => {
    // Age and jersey number must not become the monthly fee.
    const rows = parseWhatsAppText('Rohan Sharma 9876543210 age 12');
    expect(rows[0].feeAmount).toBeNull();
  });

  it('never leaks phone digits into the extracted name', () => {
    const rows = parseWhatsAppText(`
Rohan Sharma +91 98765 43210 2500
Aditya Verma 91234-56789
    `);
    for (const row of rows) {
      expect(row.name).not.toMatch(/\d/);
    }
    expect(rows[0].name).toBe('Rohan Sharma');
    expect(rows[1].name).toBe('Aditya Verma');
  });

  it('skips headers, separators and conversational chatter', () => {
    const rows = parseWhatsAppText(`
Good morning sir
Cricket Evening Batch
Name - Phone
--------------
1. Rohan Sharma - 9876543210
Total: 1 student
    `);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Rohan Sharma');
  });

  it('keeps a row with a name but an unreadable phone, for the owner to fix', () => {
    const rows = parseWhatsAppText('Rohan Sharma - 98765 (number cut off)');
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Rohan Sharma');
    expect(rows[0].mobileNumber).toBeNull();
  });

  it('returns an empty array for empty or whitespace input', () => {
    expect(parseWhatsAppText('')).toEqual([]);
    expect(parseWhatsAppText('   \n  \n ')).toEqual([]);
  });
});

describe('parseCsvTable — RFC 4180 essentials', () => {
  it('parses quoted fields containing commas', () => {
    const table = parseCsvTable('name,note\n"Sharma, Rohan","paid, in full"');
    expect(table[1]).toEqual(['Sharma, Rohan', 'paid, in full']);
  });

  it('parses escaped double quotes inside a quoted field', () => {
    const table = parseCsvTable('name\n"Rohan ""Ro"" Sharma"');
    expect(table[1][0]).toBe('Rohan "Ro" Sharma');
  });

  it('handles embedded newlines inside quoted fields', () => {
    const table = parseCsvTable('name,address\n"Rohan","Line1\nLine2"');
    expect(table[1][1]).toBe('Line1\nLine2');
  });

  it('handles CRLF line endings', () => {
    const table = parseCsvTable('a,b\r\n1,2\r\n');
    expect(table).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles a file with no trailing newline', () => {
    const table = parseCsvTable('a,b\n1,2');
    expect(table[1]).toEqual(['1', '2']);
  });

  it("strips Excel's UTF-8 BOM so the first header still maps", () => {
    const table = parseCsvTable('﻿name,phone\nRohan,9876543210');
    expect(table[0][0]).toBe('name');
  });
});

describe('parseCsv — header mapping', () => {
  it('maps the canonical headers', () => {
    const result = parseCsv(
      'Name,Mobile Number,Parent Name,Sport,Fee\nRohan Sharma,9876543210,Anil Sharma,Cricket,2500'
    );
    expect(result.rows[0]).toEqual({
      name: 'Rohan Sharma',
      mobileNumber: '9876543210',
      parentName: 'Anil Sharma',
      sportOrBatch: 'Cricket',
      feeAmount: 2500,
    });
    expect(result.warning).toBeUndefined();
  });

  it('maps alias headers from other tools', () => {
    const result = parseCsv(
      'Student Name,WhatsApp Number,Father Name,Batch,Monthly Fee\nRohan,9876543210,Anil,Evening,2500'
    );
    expect(result.rows[0]).toMatchObject({
      name: 'Rohan',
      mobileNumber: '9876543210',
      parentName: 'Anil',
      sportOrBatch: 'Evening',
      feeAmount: 2500,
    });
  });

  it('maps "Parent Mobile" to the phone column, not the parent-name column', () => {
    // Both aliases contain the word "parent" — exact matching must win.
    const result = parseCsv('Name,Parent Mobile\nRohan,9876543210');
    expect(result.rows[0].mobileNumber).toBe('9876543210');
    expect(result.rows[0].parentName).toBeNull();
  });

  it('is case and order insensitive', () => {
    const result = parseCsv('FEE,SPORT,PHONE,NAME\n2500,Cricket,9876543210,Rohan');
    expect(result.rows[0]).toMatchObject({
      name: 'Rohan',
      mobileNumber: '9876543210',
      sportOrBatch: 'Cricket',
      feeAmount: 2500,
    });
  });

  it('reports unmapped headers rather than discarding them silently', () => {
    const result = parseCsv('Name,Phone,Blood Group\nRohan,9876543210,B+');
    expect(result.unmappedHeaders).toContain('Blood Group');
  });

  it('falls back to positional columns and warns when headers are unrecognisable', () => {
    const result = parseCsv('Rohan Sharma,9876543210,Anil Sharma,Cricket,2500');
    expect(result.warning).toMatch(/no recognised column headers/i);
    expect(result.rows[0]).toMatchObject({ name: 'Rohan Sharma', mobileNumber: '9876543210' });
  });

  it('skips entirely blank rows', () => {
    const result = parseCsv('Name,Phone\nRohan,9876543210\n,\n\nAditya,9123456789');
    expect(result.rows).toHaveLength(2);
  });

  it('leaves missing optional columns null instead of blocking the row', () => {
    const result = parseCsv('Name,Phone\nRohan,9876543210');
    expect(result.rows[0]).toEqual({
      name: 'Rohan',
      mobileNumber: '9876543210',
      parentName: null,
      sportOrBatch: null,
      feeAmount: null,
    });
  });

  it('handles an empty file', () => {
    expect(parseCsv('').rows).toEqual([]);
  });
});

describe('cleanFeeAmount', () => {
  it('parses the formats that appear in real registers', () => {
    expect(cleanFeeAmount('2500')).toBe(2500);
    expect(cleanFeeAmount('₹2,500')).toBe(2500);
    expect(cleanFeeAmount('Rs. 2500/-')).toBe(2500);
    expect(cleanFeeAmount('INR 3,000')).toBe(3000);
    expect(cleanFeeAmount(2500)).toBe(2500);
  });

  it('distinguishes a genuine zero fee from a missing value', () => {
    // A scholarship student's fee is 0, which must not be read as "not found".
    expect(cleanFeeAmount('0')).toBe(0);
    expect(cleanFeeAmount(0)).toBe(0);
    expect(cleanFeeAmount('')).toBeNull();
    expect(cleanFeeAmount(null)).toBeNull();
    expect(cleanFeeAmount('not a number')).toBeNull();
  });

  it('rejects negative amounts', () => {
    expect(cleanFeeAmount('-500')).toBeNull();
  });
});
