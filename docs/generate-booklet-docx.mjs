/**
 * GWD Academy Booklet — PREMIUM DOCX Generator v2
 * Generates a 20-page visually rich, print-ready DOCX
 * Run: node docs/generate-booklet-docx.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  AlignmentType, PageBreak, BorderStyle, WidthType,
  ShadingType, Header, Footer,
  convertInchesToTwip, convertMillimetersToTwip,
  TableLayoutType, VerticalAlign
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════
const RED        = 'DC2626';
const RED_DARK   = 'B91C1C';
const RED_DEEPER = '991B1B';
const RED_LIGHT  = 'FEE2E2';
const RED_50     = 'FEF2F2';
const RED_100    = 'FEE2E2';
const CHARCOAL   = '1F2937';
const DARK       = '111827';
const DARK_2     = '0F172A';
const GRAY_50    = 'F9FAFB';
const GRAY_100   = 'F3F4F6';
const GRAY_200   = 'E5E7EB';
const GRAY_300   = 'D1D5DB';
const GRAY_400   = '9CA3AF';
const GRAY_500   = '6B7280';
const GRAY_600   = '4B5563';
const GRAY_700   = '374151';
const GRAY_800   = '1F2937';
const WHITE      = 'FFFFFF';
const FONT       = 'Calibri';  // Universal font that renders everywhere
const FONT_HEAD  = 'Calibri';

// ── IMAGE LOADER ──
const IMG_DIR   = path.join(__dirname, 'booklet-images');
const LOGO_PATH = path.join(__dirname, '..', 'public', 'gwdlogo.png');

function loadImg(name) {
  const p = path.join(IMG_DIR, name);
  if (!fs.existsSync(p)) { console.warn(`⚠ Missing: ${p}`); return null; }
  return fs.readFileSync(p);
}
function loadLogo() {
  if (!fs.existsSync(LOGO_PATH)) { console.warn('⚠ Logo missing'); return null; }
  return fs.readFileSync(LOGO_PATH);
}

const mm = (v) => convertMillimetersToTwip(v);
const inch = (v) => convertInchesToTwip(v);

// ═══════════════════════════════════════════════════
// BORDER HELPERS
// ═══════════════════════════════════════════════════
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = () => ({ top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER });
const thinBorders = (c = GRAY_200) => {
  const b = { style: BorderStyle.SINGLE, size: 1, color: c };
  return { top: b, bottom: b, left: b, right: b };
};
const leftAccentBorder = (c = RED) => ({
  top: NO_BORDER, bottom: NO_BORDER, right: NO_BORDER,
  left: { style: BorderStyle.SINGLE, size: 18, color: c },
});
const topAccentBorder = (c = RED) => ({
  left: NO_BORDER, bottom: NO_BORDER, right: NO_BORDER,
  top: { style: BorderStyle.SINGLE, size: 12, color: c },
});

// ═══════════════════════════════════════════════════
// SECTION PROPERTIES FACTORY
// ═══════════════════════════════════════════════════
function stdMargins() {
  return { top: mm(22), bottom: mm(20), left: mm(22), right: mm(22) };
}
function fullBleedMargins() {
  return { top: 0, bottom: 0, left: 0, right: 0 };
}
function pageSize() {
  return { width: mm(210), height: mm(297) };
}

// ═══════════════════════════════════════════════════
// STANDARD FOOTER BUILDER
// ═══════════════════════════════════════════════════
function stdFooter(pageNum) {
  return {
    default: new Footer({
      children: [
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: RED } },
          spacing: { before: 60 },
          children: [
            new TextRun({ text: 'GWD Sports Ecosystem', font: FONT, size: 14, color: GRAY_400 }),
            new TextRun({ text: '     ·     ', font: FONT, size: 14, color: GRAY_300 }),
            new TextRun({ text: 'Academy Partner Guide 2026', font: FONT, size: 14, color: GRAY_400, italics: true }),
            new TextRun({ text: '                                                              ', font: FONT, size: 14 }),
            new TextRun({ text: pageNum, font: FONT, size: 16, color: RED, bold: true }),
          ],
        }),
      ],
    }),
  };
}

// ═══════════════════════════════════════════════════
// STANDARD HEADER WITH RED TOP BAR
// ═══════════════════════════════════════════════════
function stdHeader() {
  return {
    default: new Header({
      children: [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: RED, space: 4 } },
          children: [],
        }),
      ],
    }),
  };
}

// ═══════════════════════════════════════════════════
// TEXT BUILDERS
// ═══════════════════════════════════════════════════
function sectionLabel(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: '━━  ', font: FONT, size: 14, color: RED, bold: true }),
      new TextRun({
        text: text.toUpperCase(), font: FONT, size: 15, bold: true, color: RED,
        characterSpacing: 100,
      }),
    ],
  });
}

function pageTitle(parts) {
  return new Paragraph({
    spacing: { before: 40, after: 60 },
    children: parts.map(p => new TextRun({
      text: p.text, font: FONT_HEAD, size: 48, bold: true,
      color: p.color || CHARCOAL,
    })),
  });
}

function redBar() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      height: { value: 60, rule: 'exact' },
      children: [
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: RED },
          borders: noBorders(),
          children: [new Paragraph({ children: [] })],
        }),
        new TableCell({
          width: { size: 80, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          children: [new Paragraph({ children: [] })],
        }),
      ],
    })],
  });
}

function redBarFull() {
  return new Paragraph({
    spacing: { after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: RED, space: 1 } },
    children: [new TextRun({ text: ' ', size: 4 })],
  });
}

function h3(text, color) {
  return new Paragraph({
    spacing: { before: 260, after: 100 },
    children: [
      new TextRun({ text: '▎ ', font: FONT, size: 24, color: RED, bold: true }),
      new TextRun({ text, font: FONT_HEAD, size: 26, bold: true, color: color || CHARCOAL }),
    ],
  });
}

function h4(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, font: FONT_HEAD, size: 22, bold: true, color: CHARCOAL })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 140, before: opts.before || 0 },
    alignment: opts.align || AlignmentType.LEFT,
    indent: opts.indent ? { left: mm(opts.indent) } : undefined,
    children: [new TextRun({
      text, font: FONT, size: opts.size || 21,
      color: opts.color || GRAY_600,
      italics: opts.italics || false,
      bold: opts.bold || false,
    })],
  });
}

function richP(runs, opts = {}) {
  return new Paragraph({
    spacing: { before: opts.before || 0, after: opts.after || 140 },
    alignment: opts.align || AlignmentType.LEFT,
    indent: opts.indent ? { left: mm(opts.indent) } : undefined,
    children: runs.map(r => new TextRun({
      text: r.text, font: FONT, size: r.size || 21,
      color: r.color || GRAY_600,
      bold: r.bold || false,
      italics: r.italics || false,
    })),
  });
}

function space(n = 1) {
  const r = [];
  for (let i = 0; i < n; i++) r.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
  return r;
}

// ═══════════════════════════════════════════════════
// IMAGE BLOCK — full-width with rounded-corner illusion border
// ═══════════════════════════════════════════════════
function img(name, widthPx, heightPx) {
  const data = loadImg(name);
  if (!data) return body(`[Image: ${name}]`, { italics: true, color: GRAY_400 });
  return new Paragraph({
    spacing: { before: 120, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ data, transformation: { width: widthPx, height: heightPx }, type: 'jpg' })],
  });
}

function imgInTable(name, widthPx, heightPx, caption) {
  const data = loadImg(name);
  const children = [];
  if (data) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: caption ? 60 : 0 },
      children: [new ImageRun({ data, transformation: { width: widthPx, height: heightPx }, type: 'jpg' })],
    }));
  }
  if (caption) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: caption, font: FONT, size: 16, italics: true, color: GRAY_400 })],
    }));
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.SOLID, color: GRAY_50 },
        borders: thinBorders(GRAY_200),
        margins: { top: 200, bottom: 200, left: 200, right: 200 },
        children: children.length ? children : [body('[Image]')],
      })],
    })],
  });
}

// ═══════════════════════════════════════════════════
// PAIN POINT CARD — with red left accent
// ═══════════════════════════════════════════════════
function painCard(emoji, title, desc) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: [new TableCell({
        borders: leftAccentBorder(RED),
        shading: { type: ShadingType.SOLID, color: RED_50 },
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        children: [
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${emoji}  `, font: FONT, size: 24 }),
              new TextRun({ text: title, font: FONT_HEAD, size: 22, bold: true, color: CHARCOAL }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: desc, font: FONT, size: 19, color: GRAY_600 })],
          }),
        ],
      })],
    })],
  });
}

// ═══════════════════════════════════════════════════
// STEP ITEM — numbered with red circle
// ═══════════════════════════════════════════════════
const CIRCLED = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
function stepCard(num, title, desc) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 80, right: 60 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: CIRCLED[num] || `${num}`,
              font: FONT, size: 32, bold: true, color: RED,
            })],
          })],
        }),
        new TableCell({
          width: { size: 92, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          margins: { top: 80, bottom: 100 },
          children: [
            new Paragraph({
              spacing: { after: 30 },
              children: [new TextRun({ text: title, font: FONT_HEAD, size: 22, bold: true, color: CHARCOAL })],
            }),
            new Paragraph({
              children: [new TextRun({ text: desc, font: FONT, size: 19, color: GRAY_600 })],
            }),
          ],
        }),
      ],
    })],
  });
}

// ═══════════════════════════════════════════════════
// CHECK ITEM
// ═══════════════════════════════════════════════════
function check(text) {
  return richP([
    { text: '  ✓  ', color: WHITE, bold: true, size: 18 },
    { text, size: 20, color: GRAY_700 },
  ], { after: 40, indent: 2 });
}

function checkRed(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          shading: { type: ShadingType.SOLID, color: RED },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '✓', font: FONT, size: 18, bold: true, color: WHITE })],
          })],
        }),
        new TableCell({
          width: { size: 94, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          shading: { type: ShadingType.SOLID, color: RED_50 },
          margins: { top: 60, bottom: 60, left: 140 },
          children: [new Paragraph({
            children: [new TextRun({ text, font: FONT, size: 20, color: CHARCOAL })],
          })],
        }),
      ],
    })],
  });
}

// ═══════════════════════════════════════════════════
// STAT BLOCK — big number with label
// ═══════════════════════════════════════════════════
function statCell(number, label, bg = WHITE) {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    borders: thinBorders(bg === WHITE ? GRAY_200 : RED_DARK),
    shading: { type: ShadingType.SOLID, color: bg },
    margins: { top: 200, bottom: 200 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({
          text: number, font: FONT_HEAD, size: 56, bold: true,
          color: bg === RED ? WHITE : RED,
        })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: label.toUpperCase(), font: FONT, size: 13, bold: true,
          color: bg === RED ? RED_LIGHT : GRAY_500,
          characterSpacing: 60,
        })],
      }),
    ],
  });
}

function statsRow(stats, bg) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: stats.map(s => statCell(s[0], s[1], bg || WHITE)),
    })],
  });
}

// ═══════════════════════════════════════════════════
// QUOTE BOX — with large red quotation mark
// ═══════════════════════════════════════════════════
function quoteBox(text, attribution) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          shading: { type: ShadingType.SOLID, color: RED },
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 160 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '❝', font: FONT, size: 36, bold: true, color: WHITE })],
          })],
        }),
        new TableCell({
          width: { size: 94, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          shading: { type: ShadingType.SOLID, color: GRAY_50 },
          margins: { top: 160, bottom: 160, left: 200, right: 200 },
          children: [
            new Paragraph({
              spacing: { after: attribution ? 60 : 0 },
              children: [new TextRun({ text, font: FONT, size: 20, italics: true, color: GRAY_700 })],
            }),
            ...(attribution ? [new Paragraph({
              children: [new TextRun({ text: `— ${attribution}`, font: FONT, size: 16, color: GRAY_500 })],
            })] : []),
          ],
        }),
      ],
    })],
  });
}

// ═══════════════════════════════════════════════════
// FEATURE CARD — 2 or 3 column grid
// ═══════════════════════════════════════════════════
function fCard(emoji, title, desc) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: WHITE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: RED },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY_200 },
      left: { style: BorderStyle.SINGLE, size: 1, color: GRAY_200 },
      right: { style: BorderStyle.SINGLE, size: 1, color: GRAY_200 },
    },
    margins: { top: 160, bottom: 160, left: 160, right: 160 },
    children: [
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: emoji, font: FONT, size: 32 })],
      }),
      new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun({ text: title, font: FONT_HEAD, size: 20, bold: true, color: CHARCOAL })],
      }),
      new Paragraph({
        children: [new TextRun({ text: desc, font: FONT, size: 17, color: GRAY_500 })],
      }),
    ],
  });
}

function featureGrid2(cards) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: cards.map(row => new TableRow({ children: row.map(c => fCard(c[0], c[1], c[2])) })),
  });
}

function featureGrid3(cards) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({ children: cards.map(c => fCard(c[0], c[1], c[2])) })],
  });
}

// ═══════════════════════════════════════════════════
// RED CALLOUT BOX
// ═══════════════════════════════════════════════════
function calloutRed(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [new TableCell({
        shading: { type: ShadingType.SOLID, color: RED },
        borders: noBorders(),
        margins: { top: 160, bottom: 160, left: 200, right: 200 },
        children: [new Paragraph({
          children: [new TextRun({ text, font: FONT, size: 19, color: WHITE })],
        })],
      })],
    })],
  });
}

function calloutOutline(boldText, restText) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [new TableCell({
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: RED },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: RED },
          left: { style: BorderStyle.SINGLE, size: 6, color: RED },
          right: { style: BorderStyle.SINGLE, size: 6, color: RED },
        },
        shading: { type: ShadingType.SOLID, color: RED_50 },
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        children: [new Paragraph({
          children: [
            new TextRun({ text: boldText, font: FONT, size: 19, bold: true, color: RED }),
            new TextRun({ text: restText, font: FONT, size: 19, color: GRAY_700 }),
          ],
        })],
      })],
    })],
  });
}

// ═══════════════════════════════════════════════════
// FLYWHEEL — horizontal flow
// ═══════════════════════════════════════════════════
function flywheel(items) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: items.flatMap((item, i) => {
        const cells = [new TableCell({
          borders: noBorders(),
          shading: { type: ShadingType.SOLID, color: DARK },
          margins: { top: 80, bottom: 80, left: 40, right: 40 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: item, font: FONT, size: 14, bold: true, color: WHITE })],
          })],
        })];
        if (i < items.length - 1) {
          cells.push(new TableCell({
            width: { size: 2, type: WidthType.PERCENTAGE },
            borders: noBorders(),
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '→', font: FONT, size: 18, color: RED, bold: true })],
            })],
          }));
        }
        return cells;
      }),
    })],
  });
}

// ═══════════════════════════════════════════════════
// FEATURE ROW — inline icon + title + desc
// ═══════════════════════════════════════════════════
function featureRow(emoji, title, desc) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: emoji, font: FONT, size: 22 })],
          })],
        }),
        new TableCell({
          width: { size: 95, type: WidthType.PERCENTAGE },
          borders: { ...noBorders(), bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY_100 } },
          margins: { top: 60, bottom: 60, left: 80 },
          children: [new Paragraph({
            children: [
              new TextRun({ text: title, font: FONT, size: 20, bold: true, color: CHARCOAL }),
              new TextRun({ text: `  ·  ${desc}`, font: FONT, size: 18, color: GRAY_500 }),
            ],
          })],
        }),
      ],
    })],
  });
}

// ═══════════════════════════════════════════════════
// MESSAGE TYPE ROW
// ═══════════════════════════════════════════════════
function msgRow(emoji, title, desc) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          shading: { type: ShadingType.SOLID, color: DARK },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: emoji, font: FONT, size: 22 })],
          })],
        }),
        new TableCell({
          width: { size: 92, type: WidthType.PERCENTAGE },
          borders: { ...noBorders(), bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY_100 } },
          margins: { top: 80, bottom: 80, left: 140 },
          children: [new Paragraph({
            children: [
              new TextRun({ text: title, font: FONT, size: 20, bold: true, color: CHARCOAL }),
              new TextRun({ text: `  —  ${desc}`, font: FONT, size: 18, color: GRAY_500 }),
            ],
          })],
        }),
      ],
    })],
  });
}

// ═══════════════════════════════════════════════════
// TAB BADGE ROW
// ═══════════════════════════════════════════════════
function tabBadges(tabs) {
  // Show as a wrapped inline list
  return new Paragraph({
    spacing: { after: 200 },
    children: tabs.flatMap((t, i) => [
      new TextRun({ text: t, font: FONT, size: 17, bold: true, color: CHARCOAL }),
      ...(i < tabs.length - 1 ? [new TextRun({ text: '   ·   ', font: FONT, size: 17, color: GRAY_300 })] : []),
    ]),
  });
}

// ═══════════════════════════════════════════════════
// FULL-BLEED DARK PAGE BUILDER
// ═══════════════════════════════════════════════════
function darkPage(contentChildren) {
  return {
    properties: { page: { margin: fullBleedMargins(), size: pageSize() } },
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [new TableRow({
          height: { value: mm(297), rule: 'exact' },
          children: [new TableCell({
            shading: { type: ShadingType.SOLID, color: DARK },
            borders: noBorders(),
            verticalAlign: VerticalAlign.CENTER,
            margins: { left: mm(25), right: mm(25), top: mm(30), bottom: mm(30) },
            children: contentChildren,
          })],
        })],
      }),
    ],
  };
}

function darkPageBottom(contentChildren) {
  return {
    properties: { page: { margin: fullBleedMargins(), size: pageSize() } },
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [new TableRow({
          height: { value: mm(297), rule: 'exact' },
          children: [new TableCell({
            shading: { type: ShadingType.SOLID, color: DARK },
            borders: noBorders(),
            verticalAlign: VerticalAlign.BOTTOM,
            margins: { left: mm(25), right: mm(25), top: mm(20), bottom: mm(30) },
            children: contentChildren,
          })],
        })],
      }),
    ],
  };
}

// ═══════════════════════════════════════════════════
// STANDARD CONTENT PAGE
// ═══════════════════════════════════════════════════
function contentPage(pageNum, children, bgColor) {
  return {
    properties: {
      page: { margin: stdMargins(), size: pageSize() },
    },
    headers: stdHeader(),
    footers: stdFooter(pageNum),
    children,
  };
}

// ═══════════════════════════════════════════════════
// PRO TIP BOX
// ═══════════════════════════════════════════════════
function proTip(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [new TableCell({
        borders: leftAccentBorder(RED),
        shading: { type: ShadingType.SOLID, color: RED_50 },
        margins: { top: 120, bottom: 120, left: 200, right: 200 },
        children: [new Paragraph({
          children: [
            new TextRun({ text: '💡 PRO TIP  ', font: FONT, size: 17, bold: true, color: RED }),
            new TextRun({ text, font: FONT, size: 18, color: GRAY_700 }),
          ],
        })],
      })],
    })],
  });
}

// ═══════════════════════════════════════════════════
// TIMELINE ITEM
// ═══════════════════════════════════════════════════
function timeline(emoji, title, desc) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          borders: { ...noBorders(), right: { style: BorderStyle.SINGLE, size: 6, color: RED } },
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 60, right: 100 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '●', font: FONT, size: 20, color: RED, bold: true })],
          })],
        }),
        new TableCell({
          width: { size: 95, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          margins: { top: 60, bottom: 120, left: 160 },
          children: [
            new Paragraph({
              spacing: { after: 30 },
              children: [
                new TextRun({ text: `${emoji}  `, font: FONT, size: 22 }),
                new TextRun({ text: title, font: FONT_HEAD, size: 21, bold: true, color: CHARCOAL }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: desc, font: FONT, size: 18, color: GRAY_600 })],
            }),
          ],
        }),
      ],
    })],
  });
}

// ═══════════════════════════════════════════════════
// DATA TABLE
// ═══════════════════════════════════════════════════
function dataTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: headers.map(h => new TableCell({
          shading: { type: ShadingType.SOLID, color: DARK },
          borders: noBorders(),
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [new Paragraph({
            children: [new TextRun({ text: h, font: FONT, size: 18, bold: true, color: WHITE })],
          })],
        })),
      }),
      ...rows.map((row, i) => new TableRow({
        children: row.map((cell, ci) => new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : GRAY_50 },
          borders: { ...noBorders(), bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY_100 } },
          margins: { top: 60, bottom: 60, left: 140, right: 140 },
          children: [new Paragraph({
            children: [new TextRun({
              text: cell, font: FONT, size: 18,
              bold: ci === 0, color: ci === 0 ? CHARCOAL : GRAY_600,
            })],
          })],
        })),
      })),
    ],
  });
}

// ═══════════════════════════════════════════════════
//  LOAD ASSETS
// ═══════════════════════════════════════════════════
const logoData = loadLogo();
const logoBlock = (w, h) => logoData ? new Paragraph({
  spacing: { after: 300 },
  children: [new ImageRun({ data: logoData, transformation: { width: w, height: h }, type: 'png' })],
}) : new Paragraph({ children: [] });

const logoCentered = (w, h) => logoData ? new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 },
  children: [new ImageRun({ data: logoData, transformation: { width: w, height: h }, type: 'png' })],
}) : new Paragraph({ children: [] });


// ═══════════════════════════════════════════════════════════════
//
//   B U I L D   T H E   D O C U M E N T
//
// ═══════════════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 21, color: CHARCOAL },
        paragraph: { spacing: { line: 300 } },
      },
    },
  },
  sections: [

    // ═══════════════════════════════════════════════════
    // PAGE 1 — COVER (Full-bleed dark)
    // ═══════════════════════════════════════════════════
    darkPageBottom([
      img('cover_hero_1785055363476.jpg', 520, 293),
      ...space(1),
      logoBlock(150, 60),
      new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: 'Your Academy.', font: FONT_HEAD, size: 80, bold: true, color: WHITE })],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Digitally Elevated.', font: FONT_HEAD, size: 80, bold: true, color: RED })],
      }),
      new Paragraph({
        spacing: { after: 400 },
        children: [new TextRun({
          text: 'The complete sports ecosystem — free for every academy in India.',
          font: FONT, size: 26, color: GRAY_400,
        })],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '━━━━━  ', font: FONT, size: 16, color: RED }),
          new TextRun({
            text: 'ACADEMY PARTNER GUIDE  ·  2026',
            font: FONT, size: 14, color: GRAY_500, characterSpacing: 80,
          }),
        ],
      }),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 2 — THE PROBLEM
    // ═══════════════════════════════════════════════════
    contentPage('02', [
      sectionLabel('The Challenge'),
      pageTitle([
        { text: 'Running an Academy Shouldn\'t Mean Running in ' },
        { text: 'Circles', color: RED },
      ]),
      redBarFull(),
      body('You became a coach to build champions. Not to be an accountant, a designer, a WhatsApp broadcaster, and a fee-collector — all before breakfast.', { size: 23, after: 260 }),
      painCard('📋', 'Attendance on Paper Registers', 'Lost registers, no history, parents have no visibility into whether their child showed up.'),
      ...space(1),
      painCard('💸', 'Fee Collection via Cash & UPI Reminders', 'No receipts, no tracking, endless follow-ups on WhatsApp groups. Awkward conversations every month.'),
      ...space(1),
      painCard('🌐', 'Zero Digital Presence', 'Parents searching "cricket academy near me" will never find you. No website, no listing, no discoverability.'),
      ...space(1),
      painCard('🏅', 'No Way to Showcase Student Progress', 'Achievements, performance metrics, training milestones — they exist only in your head or a notebook.'),
      ...space(1),
      painCard('📱', 'Manual WhatsApp Messaging', 'Typing the same fee reminder to 50 parents. Forwarding the same attendance update. Every. Single. Day.'),
      ...space(1),
      quoteBox('"I spend more time managing admin work than actually coaching my students."', 'Every academy owner, everywhere'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 3 — THE ECOSYSTEM
    // ═══════════════════════════════════════════════════
    contentPage('03', [
      sectionLabel('The Solution'),
      pageTitle([
        { text: 'One Platform. Every Academy. ' },
        { text: 'Zero Cost.', color: RED },
      ]),
      redBarFull(),
      body('GWD Sports Ecosystem gives every academy a complete digital platform — website, payments, attendance, WhatsApp messaging, student passports — completely free.', { size: 23, after: 300 }),
      h3('The GWD Flywheel'),
      flywheel(['🗺️ Map', '🌐 Website', '📋 Onboard', '📱 QR', '💳 Fees', '📊 Stats', '🛂 Passport', '📲 Share', '🔄 Leads']),
      ...space(1),
      h3('💰 How We Make Money (Not From You)'),
      body('We charge a small convenience fee to parents (not you) on digital payments. You receive 100% of your coaching fee directly into your bank account via automated Razorpay splits. No deductions. No commissions. No hidden charges.', { after: 260 }),
      statsRow([['100%', 'Fee Goes to You'], ['₹0', 'Setup Cost'], ['₹0', 'Monthly Fee']], RED),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 4 — YOUR FREE WEBSITE
    // ═══════════════════════════════════════════════════
    contentPage('04', [
      sectionLabel('Digital Presence'),
      pageTitle([
        { text: 'Your Academy Gets Its Own ' },
        { text: 'Website', color: RED },
        { text: '. Free.' },
      ]),
      redBarFull(),
      imgInTable('academy_website_mockup_1785055375713.jpg', 500, 282, 'Fully branded academy website — your logo, your colors, your sports'),
      ...space(1),
      featureGrid2([
        [['🎨', 'Fully Customizable', 'Your colors, fonts, logo, tagline, background. 6 curated presets or go fully custom.'],
         ['📱', 'Mobile-First', 'Optimized for the phones parents actually use. Stunning on every screen size.']],
        [['🏟️', 'Real Content Only', 'Sports, stats, testimonials pulled from real data — no fake "1000+ athletes" claims.'],
         ['📸', 'Gallery & Events', 'Upload training photos, showcase events, build a visual portfolio parents browse.']],
      ]),
      ...space(1),
      imgInTable('discovery_map_mockup_1785055465095.jpg', 500, 282, '🗺️ Discovery Map — India\'s first sports academy directory'),
      ...space(1),
      calloutOutline('🗺️ Discovery Map — ', 'Parents searching "cricket academy near me" find YOU on our interactive map. Each pin links to your fully branded page. Free leads, forever.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 5 — SPORTS PASSPORT
    // ═══════════════════════════════════════════════════
    contentPage('05', [
      sectionLabel('Student Identity'),
      pageTitle([
        { text: 'Every Student Gets a ' },
        { text: 'Digital Sports Passport', color: RED },
      ]),
      redBarFull(),
      imgInTable('sports_passport_mockup_1785055386987.jpg', 480, 270, 'Unique digital identity — shareable, branded, always up to date'),
      ...space(1),
      checkRed('Unique Passport ID (GWD-XXXXXX)'),
      ...space(0),
      checkRed('Your academy\'s branding & logo'),
      ...space(0),
      checkRed('QR code for instant check-in'),
      ...space(0),
      checkRed('Performance scores & badges'),
      ...space(0),
      checkRed('Attendance record'),
      ...space(0),
      checkRed('Shareable link for social media'),
      ...space(1),
      calloutRed('🔄 THE VIRAL LOOP — Parents share their child\'s Passport on WhatsApp → Friends see your brand → They visit your website → They become leads → Your academy grows organically, for free.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 6 — FUTURE VISION
    // ═══════════════════════════════════════════════════
    contentPage('06', [
      sectionLabel('Roadmap'),
      pageTitle([
        { text: 'This Is Just the ' },
        { text: 'Beginning', color: RED },
      ]),
      redBarFull(),
      imgInTable('future_vision_collage_1785055476276.jpg', 500, 282, 'School camps, inter-academy tournaments, and talent scouting — all coming soon'),
      ...space(1),
      timeline('🎨', 'Content Engine — Auto-Generated Social Posts', 'AI-powered post generation — training highlights, achievement announcements, event promotions.'),
      timeline('🏫', 'School Camps — GWD Brings Students to You', 'GWD organizes sports camps at schools. Top performers get introduced to YOUR academy.'),
      timeline('⭐', 'Elite Circle — Recognize & Scout Champions', 'Top-performing students are showcased in the Elite Circle. Scouts and selectors discover talent.'),
      timeline('🏆', 'Inter-Academy Tournaments', 'GWD-organized competitive events. Build rivalries, community, and prestige.'),
      ...space(1),
      quoteBox('"Every school camp we run, every tournament we organize, every elite player we scout — it all feeds back into your academy. The ecosystem grows together."'),
    ]),

    // ═══════════════════════════════════════════════════
    // PART 2 DIVIDER
    // ═══════════════════════════════════════════════════
    darkPage([
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: 'PART TWO', font: FONT, size: 16, bold: true, color: GRAY_500, characterSpacing: 120 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: 'Platform ', font: FONT_HEAD, size: 72, bold: true, color: WHITE }),
          new TextRun({ text: 'Features', font: FONT_HEAD, size: 72, bold: true, color: RED }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━', font: FONT, size: 14, color: RED })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: 'Dashboard · Import · Attendance · Fees · WhatsApp · Performance · Branding · Portals',
          font: FONT, size: 22, color: GRAY_400,
        })],
      }),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 7 — ADMIN DASHBOARD
    // ═══════════════════════════════════════════════════
    contentPage('07', [
      sectionLabel('Platform Features'),
      pageTitle([
        { text: 'Your ' },
        { text: 'Command Center', color: RED },
      ]),
      redBarFull(),
      imgInTable('admin_dashboard_mockup_1785055420416.jpg', 500, 282, 'Admin Dashboard — 13 tabs, one mission control'),
      ...space(1),
      body('Manage students, fees, attendance, branding, events, trainers, and WhatsApp communications from a single screen:', { size: 21, after: 160 }),
      tabBadges(['📊 Overview', '👥 Users', '🎓 Students', '📥 Import', '🏋️ Trainers', '📅 Events', '🌐 Landing Page', '💰 Fees', '👕 Kits', '✅ Check-in', '📱 Comms', '🎨 Branding', '⚙️ Settings']),
      featureGrid2([
        [['🚀', 'Smart Setup Checklist', 'Step-by-step guide for what to configure before going live — fees, batches, branding.'],
         ['📈', 'Real-Time Metrics', 'Students, batches, fee collection rate, attendance trends — all on the Overview tab.']],
      ]),
      ...space(1),
      calloutOutline('🔒 Privacy First: ', 'Every piece of data is strictly isolated to your academy. You cannot see any other academy\'s data, student counts, or financials. Ever.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 8 — STUDENT IMPORT
    // ═══════════════════════════════════════════════════
    contentPage('08', [
      sectionLabel('Onboarding'),
      pageTitle([
        { text: 'Add 50 Students in ' },
        { text: 'Under 5 Minutes', color: RED },
      ]),
      redBarFull(),
      h3('Three Ways to Import'),
      featureGrid3([
        ['📋', 'CSV Upload', 'Upload a spreadsheet with names, phone numbers, sports, batches.'],
        ['📷', 'Photo OCR', 'Photo of your paper register. AI extracts names and numbers.'],
        ['💬', 'Paste Text', 'Copy-paste a WhatsApp message or list. Parsed intelligently.'],
      ]),
      ...space(1),
      h3('What Happens Automatically'),
      stepCard(1, 'Digital Passport Created', 'Each student gets a unique ID (GWD-XXXXXX), a passport page, and a QR code — instantly.'),
      stepCard(2, 'Parent Receives WhatsApp Welcome', 'Automated message with passport link, login credentials, and payment link.'),
      stepCard(3, 'Fee Schedule Attached', 'If you\'ve set up fee plans, the student is automatically enrolled. Reminders start on schedule.'),
      ...space(1),
      quoteBox('Import once. The platform handles credentials, welcome messages, passports, and fee linking — all automatically.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 9 — ATTENDANCE
    // ═══════════════════════════════════════════════════
    contentPage('09', [
      sectionLabel('Attendance'),
      pageTitle([
        { text: 'Two Modes. ', color: RED },
        { text: 'Zero Paper.' },
      ]),
      redBarFull(),
      imgInTable('qr_attendance_scene_1785055440324.jpg', 500, 282, 'Parents scan QR at entry → child marked present → instant WhatsApp notification'),
      ...space(1),
      h4('Mode 1: Parent Self Check-In (QR)'),
      body('Print the batch QR code at your entrance. Parents scan → child marked present → instant WhatsApp confirmation.', { after: 160 }),
      h4('Mode 2: Coach Batch Register'),
      body('Coach opens Trainer Portal → batch roster → one tap per student → all parents notified at once.', { after: 200 }),
      featureGrid3([
        ['🔀', 'Smart Merge', 'QR + coach register merge automatically. No duplicate messages.'],
        ['⏰', 'Check-In Windows', 'Configure time slots per batch. QR only works during scheduled windows.'],
        ['📊', 'History', 'Every check-in recorded permanently. View by student, batch, or date.'],
      ]),
      ...space(1),
      calloutRed('WHY PARENTS LOVE IT: "Rohan checked in at MasterGrade Cricket Academy at 5:30 PM ✅" — that one WhatsApp message is worth more than any brochure you\'ll ever print.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 10 — FEE COLLECTION
    // ═══════════════════════════════════════════════════
    contentPage('10', [
      sectionLabel('Payments'),
      pageTitle([
        { text: 'Fee Collection on ' },
        { text: 'Autopilot', color: RED },
      ]),
      redBarFull(),
      body('No more awkward fee conversations. The platform collects fees, sends reminders, issues receipts, and deposits money into your bank — automatically.', { size: 22, after: 260 }),
      stepCard(1, 'Set Your Fee Schedule', 'Define plans: Monthly, Quarterly, Half-Yearly, or Annual. Set the amount.'),
      stepCard(2, 'Parents Receive Payment Links', 'Via WhatsApp, Passport page, or direct /pay link. UPI, cards, net banking — all supported.'),
      stepCard(3, 'Money Splits Automatically', '100% coaching fee → your bank. Convenience fee (charged to parent) → GWD. Powered by Razorpay Route.'),
      stepCard(4, 'Receipt Sent Instantly', 'Parent gets a WhatsApp payment receipt the moment the payment settles.'),
      ...space(1),
      featureRow('🔔', 'Smart Reminders', 'T-5 friendly · Due date · T+1 to T+3 overdue · Then stops. Capped at 3/day.'),
      featureRow('💵', 'Cash & Offline', 'One tap records cash, cancels pending reminders, marks settled.'),
      ...space(1),
      calloutOutline('⚠️ Important: ', 'We never restrict a student\'s attendance, passport, or access due to non-payment. Non-payment is a billing issue — not a reason to punish a child.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 11 — WHATSAPP ENGINE
    // ═══════════════════════════════════════════════════
    contentPage('11', [
      sectionLabel('Communication'),
      pageTitle([
        { text: 'Automated ' },
        { text: 'WhatsApp', color: RED },
        { text: ' That Just Works' },
      ]),
      redBarFull(),
      imgInTable('whatsapp_messages_mockup_1785055429942.jpg', 500, 282, 'Official Meta WhatsApp Cloud API — professional, compliant, reliable'),
      ...space(1),
      h3('7 Automated Message Types'),
      msgRow('👋', 'Welcome Message', 'Passport link + login credentials on import'),
      msgRow('✅', 'Attendance Confirmation', '"Rohan checked in at 5:30 PM ✅"'),
      msgRow('💸', 'Fee Reminder', 'Smart cadence: friendly → due → overdue → stop'),
      msgRow('🧾', 'Payment Receipt', 'Instant confirmation when payment settles'),
      msgRow('📊', 'Weekly Digest', 'Attendance %, achievements, next fee date'),
      msgRow('🏅', 'Achievement Alert', 'Badges & milestones sent to parents'),
      msgRow('📢', 'Broadcast', 'Your own custom announcements to all parents'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 12 — PERFORMANCE
    // ═══════════════════════════════════════════════════
    contentPage('12', [
      sectionLabel('Performance'),
      pageTitle([
        { text: 'Track Progress. ' },
        { text: 'Award Achievements.', color: RED },
      ]),
      redBarFull(),
      h3('Performance Categories'),
      featureGrid2([
        [['🧠', 'Tactical', 'Game sense, positioning, decision-making under pressure'],
         ['⚡', 'Technical', 'Core skills, technique drills, sport-specific fundamentals']],
        [['🎮', 'SSG', 'Small-sided games performance and teamwork evaluation'],
         ['🏟️', 'Match Play', 'Full match performance, competition readiness']],
      ]),
      ...space(1),
      h3('How Evaluations Work'),
      stepCard(1, 'Coach Selects Metric', 'Sport → category → specific metric from predefined taxonomy'),
      stepCard(2, 'Score & Remarks', 'Score out of max (e.g., 8/10) with optional remarks'),
      stepCard(3, 'Auto-Calculated Efficiency', '% efficiency rating computed dynamically across all evaluations'),
      ...space(1),
      calloutRed('🏅 AUTOMATED ACHIEVEMENT ENGINE — Badges awarded automatically: attendance milestones (25, 50, 100 sessions), performance thresholds (Gold, Silver, Bronze), sport-specific achievements, and custom badges you define.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 13 — BRANDING
    // ═══════════════════════════════════════════════════
    contentPage('13', [
      sectionLabel('Branding'),
      pageTitle([
        { text: 'Make It ' },
        { text: 'Yours', color: RED },
        { text: '. Completely.' },
      ]),
      redBarFull(),
      h3('What You Can Customize'),
      featureRow('🎨', 'Colors', '6 presets (Violet, Deep Blue, Forest, Crimson, Midnight, Sunrise) or custom'),
      featureRow('🖼️', 'Logo & Hero', 'Upload your logo and hero background. They appear everywhere.'),
      featureRow('✏️', 'Fonts & Style', 'Modern (DM Sans), Editorial (Playfair), or Friendly (Poppins)'),
      featureRow('🌗', 'Background', 'Light, Soft Tint, Gradient, or Dark mode'),
      featureRow('💪', 'Brand Feel', 'Bold (high energy), Classic (restrained), or Minimal (sharp)'),
      ...space(1),
      h3('Where Branding Appears'),
      dataTable(['Surface', 'Your Brand Shows As'], [
        ['🌐  Academy Website', 'Your colors, fonts, logo, gallery, testimonials'],
        ['🛂  Student Passports', 'Academy-branded digital identity card'],
        ['🧾  Payment Receipts', 'Professional branded payment confirmations'],
        ['🏋️  Trainer Dashboard', 'Your brand in their portal interface'],
        ['🎓  Student Dashboard', 'Your brand, their personalized experience'],
        ['📱  WhatsApp Messages', 'Academy name in every automated message'],
      ]),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 14 — PORTALS
    // ═══════════════════════════════════════════════════
    contentPage('14', [
      sectionLabel('Portals'),
      pageTitle([
        { text: 'Dedicated Dashboards for ' },
        { text: 'Everyone', color: RED },
      ]),
      redBarFull(),
      h3('🏋️ Trainer Portal'),
      featureRow('👤', 'Profile & Info', 'Hourly rate, sports, specializations'),
      featureRow('📋', 'Student Roster', 'View students, mark attendance, evaluate'),
      featureRow('📊', 'Performance Entry', 'Sport → category → metric → score → remarks'),
      featureRow('📅', 'Availability', 'Schedule slots and batch assignments'),
      ...space(1),
      h3('🎓 Student Portal'),
      featureRow('📱', 'QR Code & Overview', 'Digital passport QR, evaluation history'),
      featureRow('📈', 'Evaluation Timeline', 'Performance logs with % efficiency'),
      featureRow('💰', 'Fees & Payments', 'View dues, history, pay online'),
      featureRow('👕', 'Kits', 'Track assigned sports kits'),
      featureRow('⚙️', 'Account Settings', 'Profile, password, preferences'),
      ...space(1),
      calloutRed('ACADEMY-BRANDED EXPERIENCE: Both portals inherit your colors, logo, and fonts. Trainers and students see YOUR brand — not a generic app.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PART 3 DIVIDER
    // ═══════════════════════════════════════════════════
    darkPage([
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: 'PART THREE', font: FONT, size: 16, bold: true, color: GRAY_500, characterSpacing: 120 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: 'How to ', font: FONT_HEAD, size: 72, bold: true, color: WHITE }),
          new TextRun({ text: 'Use', font: FONT_HEAD, size: 72, bold: true, color: RED }),
          new TextRun({ text: ' It', font: FONT_HEAD, size: 72, bold: true, color: WHITE }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━', font: FONT, size: 14, color: RED })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: 'Get your academy live on GWD in under 30 minutes.',
          font: FONT, size: 24, color: GRAY_400,
        })],
      }),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 16 — GETTING STARTED
    // ═══════════════════════════════════════════════════
    contentPage('16', [
      sectionLabel('Getting Started'),
      pageTitle([
        { text: 'Your First ' },
        { text: '10 Minutes', color: RED },
      ]),
      redBarFull(),
      body('GWD will provide you with admin login credentials. Here\'s what to do first:', { size: 22, after: 240 }),
      stepCard(1, 'Log In to Your Admin Dashboard', 'Visit your academy URL and log in with the credentials provided by GWD.'),
      stepCard(2, 'Complete the Setup Checklist', 'The dashboard shows a proactive checklist. Follow it top to bottom.'),
      stepCard(3, 'Set Your Fee Schedule', 'Fees tab → Create a fee plan. Choose Monthly / Quarterly / Half-Yearly / Annual. Without this, parents cannot make payments.'),
      stepCard(4, 'Create Your First Batch', 'Check-in tab → Add Batch. Name it, assign time slot and days. This generates the QR code.'),
      stepCard(5, 'Upload Your Logo & Set Brand Colors', 'Branding tab → Upload logo, write tagline, pick colors. Immediately applies to website, passports, and receipts.'),
      ...space(1),
      proTip('Once fees, batch, and branding are set, your academy website is live. Share the URL with parents immediately.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 17 — ADDING STUDENTS
    // ═══════════════════════════════════════════════════
    contentPage('17', [
      sectionLabel('Step-by-Step'),
      pageTitle([
        { text: 'Adding Students & ' },
        { text: 'Activating Parents', color: RED },
      ]),
      redBarFull(),
      stepCard(1, 'Go to the Import Tab', 'Click "Import" in the admin sidebar.'),
      stepCard(2, 'Choose Your Import Method', 'CSV file, photo of register (OCR), or paste WhatsApp text.'),
      stepCard(3, 'Review & Fix Staged Data', 'Preview every student before import. Fix errors, assign batches, add missing phone numbers.'),
      stepCard(4, 'Click Import', 'Students are created instantly with Passport IDs, QR codes, and login credentials.'),
      stepCard(5, 'Parents Receive WhatsApp Welcome', 'Within minutes, each parent gets: passport link, login credentials, and payment info.'),
      ...space(1),
      quoteBox('Hi Priya! Rohan is now on GWD — MasterGrade Cricket Academy\'s training, attendance and progress all in one place.\n\nView Rohan\'s Sports Passport: [link]\nUsername: rohan_gwd123\nPassword: ••••••••'),
      ...space(1),
      calloutOutline('Adding individually? ', 'Students tab → Add Student. Fill in name, parent phone, batch, and sport. Same automation triggers.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 18 — DAILY OPERATIONS
    // ═══════════════════════════════════════════════════
    contentPage('18', [
      sectionLabel('Daily Workflow'),
      pageTitle([
        { text: 'Your ' },
        { text: 'Daily Routine', color: RED },
        { text: ' — Simplified' },
      ]),
      redBarFull(),
      h3('🌅 Session Start'),
      body('1.  Display the batch QR code at your entrance (Check-in → batch → Print QR)', { size: 19, indent: 3 }),
      body('2.  Parents scan as students arrive → instant WhatsApp confirmation', { size: 19, indent: 3 }),
      body('3.  OR coach opens Trainer Portal → batch roster → one-tap attendance', { size: 19, indent: 3, after: 200 }),
      h3('🌙 End of Day'),
      body('1.  Check Comms tab — all messages and delivery status', { size: 19, indent: 3 }),
      body('2.  Review Fees tab for new payments or overdue', { size: 19, indent: 3 }),
      body('3.  Record cash payments: Fees → student → "Record Cash" → done', { size: 19, indent: 3, after: 200 }),
      h3('📆 Weekly'),
      featureGrid3([
        ['📊', 'Weekly Digest', 'Auto-sent to parents: attendance %, achievements, next fee date'],
        ['🏅', 'Evaluate Students', 'Coaches log performance → badges auto-generate'],
        ['📢', 'Broadcast', 'Comms → Broadcast → write → send to all parents'],
      ]),
      ...space(1),
      proTip('Fee reminders are fully automated. The system sends at T-5, due date, T+1 to T+3 — then stops. Cash just needs a one-tap record.'),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 19 — TEAM & DASHBOARD GUIDE
    // ═══════════════════════════════════════════════════
    contentPage('19', [
      sectionLabel('Advanced'),
      pageTitle([
        { text: 'Managing Your ' },
        { text: 'Team & Data', color: RED },
      ]),
      redBarFull(),
      h3('👥 Adding Trainers'),
      stepCard(1, 'Users Tab → Add User', 'Set role to Trainer. Fill in name, phone, sports, specialization.'),
      stepCard(2, 'Assign to Batches', 'Check-in tab → select batch → assign trainer. They get Trainer Portal access.'),
      ...space(1),
      h3('📅 Creating Events'),
      body('Events tab → Create Event → Add title, date, description, type. Events appear on your academy website automatically.', { after: 200 }),
      h3('📊 Dashboard Tab Guide'),
      dataTable(['Tab', 'What You\'ll Find'], [
        ['📊  Overview', 'Total students, batches, fee rate, activity feed'],
        ['💰  Fees', 'Who paid, overdue amounts, history, cash recording'],
        ['✅  Check-in', 'QR codes, attendance records, batch schedules'],
        ['📱  Comms', 'WhatsApp messages, delivery status, broadcast'],
        ['🎓  Students', 'Profiles, attendance history, performance data'],
        ['🌐  Landing Page', 'Website sections, testimonials, photo gallery'],
      ]),
    ]),

    // ═══════════════════════════════════════════════════
    // PAGE 20 — BACK COVER (Full-bleed dark)
    // ═══════════════════════════════════════════════════
    darkPage([
      logoCentered(180, 72),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [new TextRun({ text: 'Welcome to the', font: FONT_HEAD, size: 60, bold: true, color: WHITE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Ecosystem', font: FONT_HEAD, size: 60, bold: true, color: RED })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━', font: FONT, size: 14, color: RED })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({
          text: 'Join a growing network of academies that are digitizing operations,\ngrowing their student base, and building their brand — together.',
          font: FONT, size: 24, color: GRAY_400,
        })],
      }),
      statsRow([['₹0', 'Setup Cost'], ['100%', 'Fee to Academy'], ['∞', 'Growth Potential']]),
      ...space(3),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: '🌐  Visit Us', font: FONT, size: 22, bold: true, color: WHITE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: 'sports.gwdglobal.in', font: FONT_HEAD, size: 28, bold: true, color: RED })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: 'Discover academies  ·  Explore the ecosystem  ·  Join the movement', font: FONT, size: 16, color: GRAY_500 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: '© 2026 GWD Global  ·  Academy owners receive 100% coaching fee via Razorpay Route  ·  WhatsApp powered by Meta Cloud API',
          font: FONT, size: 11, color: GRAY_500,
        })],
      }),
    ]),
  ],
});

// ═══════════════════════════════════════════════════
//  GENERATE
// ═══════════════════════════════════════════════════
const outPath = path.join(__dirname, 'GWD-Academy-Booklet.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  const kb = (buffer.length / 1024).toFixed(1);
  const mb = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`\n  ╔══════════════════════════════════════════════╗`);
  console.log(`  ║  ✅  GWD Academy Booklet DOCX Generated!     ║`);
  console.log(`  ╠══════════════════════════════════════════════╣`);
  console.log(`  ║  File: GWD-Academy-Booklet.docx              ║`);
  console.log(`  ║  Size: ${mb} MB (${kb} KB)                  `);
  console.log(`  ║  Path: ${outPath}`);
  console.log(`  ╚══════════════════════════════════════════════╝\n`);
}).catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
