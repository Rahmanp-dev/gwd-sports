/**
 * GWD Sports Ecosystem — Founding Partner Certificate Generator
 * Generates a beautiful one-page onboarding partnership document.
 * 
 * Run:  node docs/generate-partner-certificate.mjs
 * 
 * Optionally pass academy details:
 *   node docs/generate-partner-certificate.mjs \
 *     --name "Champions Football Club" \
 *     --owner "Coach Rajesh Kumar" \
 *     --sport "Football" \
 *     --city "Hyderabad" \
 *     --slug "champions-fc" \
 *     --date "27 July 2026"
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer,
  convertInchesToTwip, convertMillimetersToTwip,
  TableLayoutType, VerticalAlign
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ══════════════════════════════════════════════════════
//  DESIGN TOKENS — GWD Brand System
// ══════════════════════════════════════════════════════
const RED        = 'DC2626';
const RED_DARK   = 'B91C1C';
const RED_DEEP   = '991B1B';
const RED_LIGHT  = 'FEE2E2';
const RED_50     = 'FEF2F2';
const CHARCOAL   = '1F2937';
const DARK       = '111827';
const SLATE_700  = '334155';
const GRAY_50    = 'F9FAFB';
const GRAY_100   = 'F3F4F6';
const GRAY_200   = 'E5E7EB';
const GRAY_300   = 'D1D5DB';
const GRAY_400   = '9CA3AF';
const GRAY_500   = '6B7280';
const GRAY_600   = '4B5563';
const WHITE      = 'FFFFFF';
const FONT       = 'Calibri';

const mm   = (v) => convertMillimetersToTwip(v);
const inch = (v) => convertInchesToTwip(v);

// ── BORDERS ──
const NO_BORDER   = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders   = () => ({ top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER });

// ── LOGO ──
const LOGO_PATH = path.join(__dirname, '..', 'public', 'gwdlogo.png');
function loadLogo() {
  if (!fs.existsSync(LOGO_PATH)) { console.warn('⚠ Logo not found at', LOGO_PATH); return null; }
  return fs.readFileSync(LOGO_PATH);
}

// ══════════════════════════════════════════════════════
//  CLI ARGUMENT PARSING
// ══════════════════════════════════════════════════════
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    name:  'Your Academy Name',
    owner: 'Head Coach / Owner Name',
    sport: 'Multi-Sport',
    city:  'City, State',
    slug:  'your-academy',
    date:  new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    id:    `GWD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
  };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const val = args[i + 1];
    if (key && val && key in result) result[key] = val;
  }
  return result;
}

// ══════════════════════════════════════════════════════
//  DOCUMENT BUILDER
// ══════════════════════════════════════════════════════
function buildCertificate(academy) {
  const logo = loadLogo();

  // ── Helper: Checkmark bullet item ──
  const checkItem = (text, subtext) => {
    const runs = [
      new TextRun({ text: '✦  ', font: FONT, size: 18, color: RED }),
      new TextRun({ text, font: FONT, size: 18, bold: true, color: CHARCOAL }),
    ];
    if (subtext) {
      runs.push(new TextRun({ text: `  —  ${subtext}`, font: FONT, size: 16, color: GRAY_500 }));
    }
    return new Paragraph({ spacing: { before: 60, after: 20 }, indent: { left: mm(2) }, children: runs });
  };

  // ── Helper: Section heading ──
  const sectionHead = (text) => new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text: text.toUpperCase(), font: FONT, size: 17, bold: true, color: RED_DARK, characterSpacing: 80 }),
    ],
  });

  // ── Helper: Divider line ──
  const divider = (color = GRAY_200) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
              bottom: { style: BorderStyle.SINGLE, size: 3, color },
            },
            children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: '', size: 4 })] })],
          }),
        ],
      }),
    ],
  });

  // ── Helper: Signature block ──
  const signatureBlock = (role, name) => new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: noBorders(),
    margins: { top: mm(1), bottom: mm(1), left: mm(2), right: mm(2) },
    children: [
      new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
      new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
      new Paragraph({
        spacing: { before: 0, after: 20 },
        children: [new TextRun({ text: '________________________________________', font: FONT, size: 16, color: GRAY_300 })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: name, font: FONT, size: 17, bold: true, color: CHARCOAL })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: role, font: FONT, size: 14, color: GRAY_500 })],
      }),
    ],
  });

  // ══════════════════════════════════════════════════
  //  PAGE CONTENT
  // ══════════════════════════════════════════════════
  const children = [];

  // ─── TOP RED ACCENT BAR ───
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: RED },
            borders: noBorders(),
            children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: ' ', size: 8, color: RED })] })],
          }),
        ],
      }),
    ],
  }));

  // ─── LOGO + HEADER ───
  const headerRuns = [];
  if (logo) {
    headerRuns.push(new ImageRun({
      data: logo,
      transformation: { width: 38, height: 38 },
    }));
    headerRuns.push(new TextRun({ text: '   ', font: FONT, size: 20 }));
  }
  headerRuns.push(new TextRun({ text: 'GWD SPORTS', font: FONT, size: 24, bold: true, color: RED }));
  headerRuns.push(new TextRun({ text: '  ECOSYSTEM', font: FONT, size: 24, bold: false, color: CHARCOAL, characterSpacing: 60 }));

  children.push(new Paragraph({
    spacing: { before: 280, after: 30 },
    alignment: AlignmentType.CENTER,
    children: headerRuns,
  }));

  // ─── CERTIFICATE TITLE ───
  children.push(new Paragraph({
    spacing: { before: 60, after: 10 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'FOUNDING PARTNER CERTIFICATE',
        font: FONT, size: 30, bold: true, color: CHARCOAL, characterSpacing: 120,
      }),
    ],
  }));

  children.push(new Paragraph({
    spacing: { before: 0, after: 10 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Academy Ecosystem Onboarding Agreement',
        font: FONT, size: 17, color: GRAY_500, italics: true,
      }),
    ],
  }));

  children.push(divider(RED));

  // ─── ACADEMY DETAILS TABLE ───
  const detailRow = (label, value) => new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        borders: noBorders(),
        margins: { top: mm(0.5), bottom: mm(0.5), left: mm(2), right: mm(1) },
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: label, font: FONT, size: 16, bold: true, color: GRAY_500 })],
        })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: noBorders(),
        margins: { top: mm(0.5), bottom: mm(0.5), left: mm(1), right: mm(2) },
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: value, font: FONT, size: 17, bold: true, color: CHARCOAL })],
        })],
      }),
    ],
  });

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      detailRow('Academy',       academy.name),
      detailRow('Head Coach',    academy.owner),
      detailRow('Primary Sport', academy.sport),
      detailRow('Location',      academy.city),
      detailRow('Partner Since', academy.date),
      detailRow('Partner ID',    academy.id),
      detailRow('Academy Page',  `gwd.in/${academy.slug}`),
    ],
  }));

  children.push(divider(GRAY_200));

  // ─── WHAT YOU RECEIVE ───
  children.push(sectionHead('What You Receive — At Zero Cost, Forever'));

  children.push(checkItem('Branded Academy Page',          'your own professional public page with custom colors, logo & theme'));
  children.push(checkItem('Online Fee Collection',         'Razorpay-powered payments — UPI, cards, net banking — directly to your bank'));
  children.push(checkItem('WhatsApp Automation',           'automated fee reminders, attendance alerts & payment receipts via Meta API'));
  children.push(checkItem('QR Attendance System',          'parent self-check-in with QR codes and real-time WhatsApp notifications'));
  children.push(checkItem('Admin Command Center',          'student management, financial analytics, performance tracking & dashboards'));
  children.push(checkItem('Discovery & Visibility',        'listed on gwd.in/discover so new parents can find and join your academy'));
  children.push(checkItem('Lifetime Platform Access',      'as a founding partner, your academy will never be charged a platform fee'));

  children.push(divider(GRAY_200));

  // ─── YOUR COMMITMENTS ───
  children.push(sectionHead('Your Commitments — Just Three Simple Things'));

  children.push(new Paragraph({
    spacing: { before: 40, after: 20 }, indent: { left: mm(2) },
    children: [
      new TextRun({ text: '\u2460  ', font: FONT, size: 18, color: RED }),
      new TextRun({ text: 'Share your academy page link ', font: FONT, size: 17, color: CHARCOAL }),
      new TextRun({ text: 'with existing and prospective parents so they can discover and join your academy online.', font: FONT, size: 16, color: GRAY_500 }),
    ],
  }));
  children.push(new Paragraph({
    spacing: { before: 40, after: 20 }, indent: { left: mm(2) },
    children: [
      new TextRun({ text: '\u2461  ', font: FONT, size: 18, color: RED }),
      new TextRun({ text: 'Keep your academy profile updated ', font: FONT, size: 17, color: CHARCOAL }),
      new TextRun({ text: '\u2014 sports, fees, timings, and photos \u2014 so parents always see accurate information.', font: FONT, size: 16, color: GRAY_500 }),
    ],
  }));
  children.push(new Paragraph({
    spacing: { before: 40, after: 20 }, indent: { left: mm(2) },
    children: [
      new TextRun({ text: '\u2462  ', font: FONT, size: 18, color: RED }),
      new TextRun({ text: 'Share honest feedback ', font: FONT, size: 17, color: CHARCOAL }),
      new TextRun({ text: 'with us so we can continuously improve the platform for all partner academies.', font: FONT, size: 16, color: GRAY_500 }),
    ],
  }));

  children.push(divider(GRAY_200));

  // ─── SIGNATURE AREA ───
  children.push(sectionHead('Partnership Confirmed'));

  children.push(new Paragraph({
    spacing: { before: 20, after: 100 },
    children: [
      new TextRun({
        text: 'By signing below, both parties confirm this partnership and commitment to building the future of sports education together.',
        font: FONT, size: 16, color: GRAY_500, italics: true,
      }),
    ],
  }));

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          signatureBlock('GWD Sports Ecosystem \u2014 Representative', 'Rahman P'),
          signatureBlock(`${academy.name} \u2014 Head Coach / Owner`, academy.owner),
        ],
      }),
    ],
  }));

  // ─── DATE LINE ───
  children.push(new Paragraph({
    spacing: { before: 140, after: 20 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: `Date:  ${academy.date}`, font: FONT, size: 16, color: GRAY_400 }),
      new TextRun({ text: `          Partner ID:  ${academy.id}`, font: FONT, size: 16, color: GRAY_400 }),
    ],
  }));

  // ─── BOTTOM RED ACCENT BAR ───
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: RED },
            borders: noBorders(),
            children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: ' ', size: 8, color: RED })] })],
          }),
        ],
      }),
    ],
  }));

  // ══════════════════════════════════════════════════
  //  BUILD DOCUMENT
  // ══════════════════════════════════════════════════
  return new Document({
    creator: 'GWD Sports Ecosystem',
    title: `GWD Founding Partner Certificate \u2014 ${academy.name}`,
    description: 'Academy partnership onboarding certificate for the GWD Sports Ecosystem.',
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 20, color: CHARCOAL },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: mm(210), height: mm(297) },
          margin: { top: mm(12), bottom: mm(10), left: mm(18), right: mm(18) },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 0 },
              children: [
                new TextRun({ text: 'CONFIDENTIAL  \u00B7  ', font: FONT, size: 13, color: GRAY_300, characterSpacing: 40 }),
                new TextRun({ text: academy.id, font: FONT, size: 13, color: GRAY_300, characterSpacing: 40 }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({ text: 'GWD Sports Ecosystem  \u00B7  gwd.in  \u00B7  ', font: FONT, size: 13, color: GRAY_400 }),
                new TextRun({ text: 'Built for Coaches. Powered by Technology.', font: FONT, size: 13, color: RED, italics: true }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });
}

// ══════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════
async function main() {
  const academy = parseArgs();
  console.log('\n\uD83C\uDFC6 Generating GWD Founding Partner Certificate\u2026');
  console.log(`   Academy:  ${academy.name}`);
  console.log(`   Coach:    ${academy.owner}`);
  console.log(`   Sport:    ${academy.sport}`);
  console.log(`   City:     ${academy.city}`);
  console.log(`   Page:     gwd.in/${academy.slug}`);
  console.log(`   ID:       ${academy.id}`);
  console.log(`   Date:     ${academy.date}\n`);

  const doc = buildCertificate(academy);
  const buffer = await Packer.toBuffer(doc);

  const outPath = path.join(__dirname, 'GWD-Partner-Certificate.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`\u2705 Certificate saved: ${outPath}`);
  console.log(`   File size: ${(buffer.length / 1024).toFixed(1)} KB\n`);
  console.log('\uD83D\uDCA1 Tip: Open in Word or Google Docs for best rendering.');
  console.log('   Customize with --name, --owner, --sport, --city, --slug, --date flags.\n');
}

main().catch(console.error);
