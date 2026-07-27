/**
 * GWD Sports Ecosystem — Academy Partner Welcome Certificate
 * Generates a beautiful one-page onboarding partnership document.
 *
 * Run:  node docs/generate-partner-certificate.mjs
 *
 * Optionally pass academy details:
 *   node docs/generate-partner-certificate.mjs ^
 *     --name "Champions Football Club" ^
 *     --owner "Coach Rajesh Kumar" ^
 *     --sport "Football" ^
 *     --city "Hyderabad" ^
 *     --slug "champions-fc" ^
 *     --date "27 July 2026"
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer,
  convertMillimetersToTwip,
  TableLayoutType,
} from "docx";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ══════════════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════════════
const RED       = "DC2626";
const RED_DARK  = "B91C1C";
const RED_50    = "FEF2F2";
const CHARCOAL  = "1F2937";
const GRAY_200  = "E5E7EB";
const GRAY_300  = "D1D5DB";
const GRAY_400  = "9CA3AF";
const GRAY_500  = "6B7280";
const WHITE     = "FFFFFF";
const FONT      = "Calibri";

const mm = (v) => convertMillimetersToTwip(v);

// ── Borders ──
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = () => ({
  top: NO_BORDER, bottom: NO_BORDER,
  left: NO_BORDER, right: NO_BORDER,
});

// ══════════════════════════════════════════════════════
//  CLI ARGS
// ══════════════════════════════════════════════════════
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    name:  "Your Academy Name",
    owner: "Head Coach / Owner Name",
    sport: "Multi-Sport",
    city:  "City, State",
    slug:  "your-academy",
    date:  new Date().toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    }),
    id: `GWD-${Date.now().toString(36).toUpperCase().slice(-6)}`,
  };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const val = args[i + 1];
    if (key && val && key in result) result[key] = val;
  }
  return result;
}

// ══════════════════════════════════════════════════════
//  DOCUMENT BUILDER
// ══════════════════════════════════════════════════════
function buildCertificate(academy) {
  // ── Helpers ──

  /** Red accent bar (top / bottom decoration) */
  const accentBar = () =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: RED },
              borders: noBorders(),
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun({ text: " ", size: 10, color: RED })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

  /** Thin horizontal divider */
  const divider = (color = GRAY_200) =>
    new Table({
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
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun({ text: "", size: 4 })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

  /** Section heading (small caps feel) */
  const sectionHead = (text) =>
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          font: FONT, size: 17, bold: true, color: RED_DARK,
        }),
      ],
    });

  /** Benefit row with a simple bullet */
  const benefitItem = (title, desc) =>
    new Paragraph({
      spacing: { before: 50, after: 20 },
      indent: { left: mm(3) },
      children: [
        new TextRun({ text: ">  ", font: FONT, size: 18, color: RED, bold: true }),
        new TextRun({ text: title, font: FONT, size: 18, bold: true, color: CHARCOAL }),
        ...(desc
          ? [new TextRun({ text: `  -  ${desc}`, font: FONT, size: 16, color: GRAY_500 })]
          : []),
      ],
    });

  /** Numbered commitment item */
  const commitItem = (num, boldPart, rest) =>
    new Paragraph({
      spacing: { before: 50, after: 20 },
      indent: { left: mm(3) },
      children: [
        new TextRun({ text: `${num}.  `, font: FONT, size: 18, color: RED, bold: true }),
        new TextRun({ text: boldPart + " ", font: FONT, size: 17, color: CHARCOAL, bold: true }),
        new TextRun({ text: rest, font: FONT, size: 16, color: GRAY_500 }),
      ],
    });

  /** Academy detail row */
  const detailRow = (label, value) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          margins: { top: mm(0.5), bottom: mm(0.5), left: mm(3), right: mm(1) },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({ text: label, font: FONT, size: 16, bold: true, color: GRAY_500 }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: noBorders(),
          margins: { top: mm(0.5), bottom: mm(0.5), left: mm(1), right: mm(3) },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({ text: value, font: FONT, size: 17, bold: true, color: CHARCOAL }),
              ],
            }),
          ],
        }),
      ],
    });

  /** Signature block cell */
  const signatureCell = (role, name) =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: noBorders(),
      margins: { top: mm(1), bottom: mm(1), left: mm(3), right: mm(3) },
      children: [
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
        new Paragraph({ spacing: { before: 0, after: 0 }, children: [] }),
        new Paragraph({
          spacing: { before: 0, after: 20 },
          children: [
            new TextRun({
              text: "________________________________________",
              font: FONT, size: 16, color: GRAY_300,
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({ text: name, font: FONT, size: 17, bold: true, color: CHARCOAL }),
          ],
        }),
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({ text: role, font: FONT, size: 14, color: GRAY_500 }),
          ],
        }),
      ],
    });

  // ══════════════════════════════════════════════════
  //  BUILD PAGE
  // ══════════════════════════════════════════════════
  const children = [];

  // ── Top red accent bar ──
  children.push(accentBar());

  // ── Logo text header ──
  children.push(
    new Paragraph({
      spacing: { before: 300, after: 30 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "GWD SPORTS", font: FONT, size: 26, bold: true, color: RED }),
        new TextRun({ text: "  ECOSYSTEM", font: FONT, size: 26, color: CHARCOAL }),
      ],
    })
  );

  // ── Title ──
  children.push(
    new Paragraph({
      spacing: { before: 60, after: 10 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "OFFICIAL ACADEMY PARTNER",
          font: FONT, size: 30, bold: true, color: CHARCOAL,
        }),
      ],
    })
  );

  // ── Subtitle ──
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 10 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Welcome to the GWD Sports Ecosystem",
          font: FONT, size: 18, color: GRAY_500, italics: true,
        }),
      ],
    })
  );

  children.push(divider(RED));

  // ── Welcome paragraph ──
  children.push(
    new Paragraph({
      spacing: { before: 140, after: 100 },
      children: [
        new TextRun({
          text: "We are excited to welcome ",
          font: FONT, size: 18, color: CHARCOAL,
        }),
        new TextRun({
          text: academy.name,
          font: FONT, size: 18, bold: true, color: RED,
        }),
        new TextRun({
          text: " as an official partner of the GWD Sports Ecosystem. This partnership gives your academy access to a complete digital platform designed to help you grow, automate daily operations, and deliver a premium experience to every parent and athlete.",
          font: FONT, size: 18, color: CHARCOAL,
        }),
      ],
    })
  );

  // ── Academy details table ──
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        detailRow("Academy", academy.name),
        detailRow("Head Coach", academy.owner),
        detailRow("Primary Sport", academy.sport),
        detailRow("Location", academy.city),
        detailRow("Partner Since", academy.date),
        detailRow("Partner ID", academy.id),
        detailRow("Your Page", "gwd.in/" + academy.slug),
      ],
    })
  );

  children.push(divider(GRAY_200));

  // ── What you get ──
  children.push(sectionHead("Everything You Get - Completely Free"));

  children.push(benefitItem("Your Own Branded Academy Page", "professional public page with your colors, logo, and custom theme"));
  children.push(benefitItem("Online Fee Collection", "parents pay via UPI, cards, or net banking - money goes directly to your bank account"));
  children.push(benefitItem("WhatsApp Automation", "automated fee reminders, attendance alerts, and payment receipts via official Meta API"));
  children.push(benefitItem("QR Attendance System", "parents scan a QR code at drop-off and get instant WhatsApp confirmation"));
  children.push(benefitItem("Admin Command Center", "student management, financial analytics, performance tracking, and dashboards"));
  children.push(benefitItem("Discovery Listing", "your academy appears on gwd.in/discover so new parents can find and join you"));
  children.push(benefitItem("Free Forever", "no subscription fees, no hidden charges, no commission on payments - ever"));

  children.push(divider(GRAY_200));

  // ── Getting started ──
  children.push(sectionHead("Getting Started - Three Easy Steps"));

  commitItem(1, "Share your academy page", "with parents so they can find you online, view programs, and pay fees digitally.");
  children.push(commitItem(1, "Share your academy page link", "with parents so they can find you online, view programs, and pay fees digitally."));
  children.push(commitItem(2, "Keep your profile updated", "with current sports, fees, timings, and photos so parents always see accurate information."));
  children.push(commitItem(3, "Tell us what you think!", "Your feedback helps us build a better platform for every academy in the ecosystem."));

  children.push(divider(GRAY_200));

  // ── Signatures ──
  children.push(sectionHead("Partnership Confirmed"));

  children.push(
    new Paragraph({
      spacing: { before: 20, after: 100 },
      children: [
        new TextRun({
          text: "By signing below, both parties confirm this partnership and their commitment to building the future of sports education together.",
          font: FONT, size: 16, color: GRAY_500, italics: true,
        }),
      ],
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            signatureCell("GWD Sports Ecosystem", "Rahman P"),
            signatureCell(academy.name, academy.owner),
          ],
        }),
      ],
    })
  );

  // ── Date / ID line ──
  children.push(
    new Paragraph({
      spacing: { before: 140, after: 20 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Date:  " + academy.date, font: FONT, size: 16, color: GRAY_400 }),
        new TextRun({ text: "          Partner ID:  " + academy.id, font: FONT, size: 16, color: GRAY_400 }),
      ],
    })
  );

  // ── Bottom red accent bar ──
  children.push(accentBar());

  // ══════════════════════════════════════════════════
  //  ASSEMBLE DOCUMENT
  // ══════════════════════════════════════════════════
  return new Document({
    creator: "GWD Sports Ecosystem",
    title: "GWD Academy Partner Certificate - " + academy.name,
    description: "Official academy partnership certificate for the GWD Sports Ecosystem.",
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 20, color: CHARCOAL },
        },
      },
    },
    sections: [
      {
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
                  new TextRun({
                    text: "CONFIDENTIAL  |  " + academy.id,
                    font: FONT, size: 13, color: GRAY_300,
                  }),
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
                  new TextRun({
                    text: "GWD Sports Ecosystem  |  gwd.in  |  ",
                    font: FONT, size: 13, color: GRAY_400,
                  }),
                  new TextRun({
                    text: "Built for Coaches. Powered by Technology.",
                    font: FONT, size: 13, color: RED, italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

// ══════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════
async function main() {
  const academy = parseArgs();

  console.log("");
  console.log("  Generating GWD Academy Partner Certificate...");
  console.log("  Academy:  " + academy.name);
  console.log("  Coach:    " + academy.owner);
  console.log("  Sport:    " + academy.sport);
  console.log("  City:     " + academy.city);
  console.log("  Page:     gwd.in/" + academy.slug);
  console.log("  ID:       " + academy.id);
  console.log("  Date:     " + academy.date);
  console.log("");

  const doc = buildCertificate(academy);
  const buffer = await Packer.toBuffer(doc);

  const safeName = academy.slug.replace(/[^a-z0-9-]/gi, "_");
  const outPath = path.join(__dirname, `GWD-Partner-${safeName}.docx`);
  fs.writeFileSync(outPath, buffer);

  console.log("  Done! Certificate saved:");
  console.log("  " + outPath);
  console.log("  File size: " + (buffer.length / 1024).toFixed(1) + " KB");
  console.log("");
  console.log("  Customize with flags:");
  console.log("  --name --owner --sport --city --slug --date");
  console.log("");
}

main().catch(console.error);
