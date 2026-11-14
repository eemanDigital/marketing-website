import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import QRCode from "qrcode";
import type { AgreementContent } from "./agreement";
import { formatDateTime } from "./utils";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;
const FOOTER_SPACE = 42;

const INK = rgb(0.07, 0.09, 0.15);
const MUTED = rgb(0.4, 0.45, 0.53);
const BRAND = rgb(0.05, 0.42, 0.31);
const NAVY = rgb(0.08, 0.16, 0.2);
const TEAL = rgb(0.12, 0.62, 0.58);
const LINE = rgb(0.85, 0.87, 0.9);
const LIGHT = rgb(0.95, 0.97, 0.96);
const PAPER = rgb(0.985, 0.99, 0.985);

function sanitize(input: string) {
  return input
    .replace(/\u20a6/g, "NGN ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7e\n]/g, " ");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of sanitize(text).split(/\r?\n/)) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = "";
          for (const character of word) {
            if (font.widthOfTextAtSize(chunk + character, size) > maxWidth) {
              lines.push(chunk);
              chunk = character;
            } else {
              chunk += character;
            }
          }
          current = chunk;
        } else {
          current = word;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  pageWidth: number;
  pageHeight: number;
  reference: string;
  watermark: string;
};

function createPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage(A4);
  ctx.pageWidth = A4[0];
  ctx.pageHeight = A4[1];
  ctx.page.drawRectangle({
    x: 0,
    y: A4[1] - 8,
    width: A4[0],
    height: 8,
    color: BRAND,
  });
  ctx.page.drawText(
    ctx.watermark === "CERTIFICATE"
      ? "DEALREC  /  VERIFICATION CERTIFICATE"
      : ctx.watermark === "EVIDENCE"
        ? "DEALREC  /  EVIDENCE RECORD"
        : "DEALREC  /  AGREEMENT RECORD",
    {
      x: MARGIN,
      y: A4[1] - 31,
      size: 8,
      font: ctx.bold,
      color: BRAND,
    },
  );
  const referenceWidth = ctx.font.widthOfTextAtSize(sanitize(ctx.reference), 8);
  ctx.page.drawText(sanitize(ctx.reference), {
    x: A4[0] - MARGIN - referenceWidth,
    y: A4[1] - 31,
    size: 8,
    font: ctx.font,
    color: MUTED,
  });
  ctx.page.drawLine({
    start: { x: MARGIN, y: A4[1] - 42 },
    end: { x: A4[0] - MARGIN, y: A4[1] - 42 },
    thickness: 0.6,
    color: LINE,
  });
  ctx.y = A4[1] - 62;

  if (ctx.watermark) {
    ctx.page.drawText(sanitize(ctx.watermark), {
      x: 70,
      y: 330,
      size: 58,
      font: ctx.bold,
      color: rgb(0.88, 0.91, 0.89),
      opacity: 0.45,
      rotate: degrees(32),
    });
  }
}

function ensureSpace(ctx: Ctx, height: number) {
  if (ctx.y - height < MARGIN + FOOTER_SPACE) {
    createPage(ctx);
  }
}

function drawParagraph(
  ctx: Ctx,
  text: string,
  options: { size?: number; color?: ReturnType<typeof rgb>; bold?: boolean; gap?: number } = {},
) {
  const size = options.size ?? 10.5;
  const font = options.bold ? ctx.bold : ctx.font;
  const maxWidth = ctx.pageWidth - MARGIN * 2;
  const lines = wrapText(text, font, size, maxWidth);
  const lineHeight = size * 1.5;

  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    if (line) {
      ctx.page.drawText(line, {
        x: MARGIN,
        y: ctx.y - size,
        size,
        font,
        color: options.color ?? INK,
      });
    }
    ctx.y -= lineHeight;
  }
  ctx.y -= options.gap ?? 4;
}

function drawHeading(ctx: Ctx, text: string) {
  ensureSpace(ctx, 32);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 20,
    width: 3,
    height: 15,
    color: TEAL,
  });
  ctx.page.drawText(sanitize(text), {
    x: MARGIN + 10,
    y: ctx.y - 18,
    size: 10.5,
    font: ctx.bold,
    color: NAVY,
  });
  ctx.y -= 29;
}

function drawKeyValue(ctx: Ctx, label: string, value: string) {
  const labelWidth = 116;
  const valueLines = wrapText(value, ctx.font, 9.2, ctx.pageWidth - MARGIN * 2 - labelWidth - 20);
  const rowHeight = Math.max(26, valueLines.length * 12 + 12);
  ensureSpace(ctx, rowHeight + 4);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - rowHeight,
    width: ctx.pageWidth - MARGIN * 2,
    height: rowHeight,
    borderColor: LINE,
    borderWidth: 0.5,
    color: PAPER,
  });
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - rowHeight,
    width: labelWidth,
    height: rowHeight,
    color: LIGHT,
  });
  ctx.page.drawText(sanitize(label), {
    x: MARGIN + 8,
    y: ctx.y - 17,
    size: 8,
    font: ctx.bold,
    color: BRAND,
  });
  for (const [index, line] of valueLines.entries()) {
    ctx.page.drawText(line, {
      x: MARGIN + labelWidth + 10,
      y: ctx.y - 17 - index * 12,
      size: 9.2,
      font: ctx.font,
      color: INK,
    });
  }
  ctx.y -= rowHeight + 4;
}

function drawHeader(ctx: Ctx, title: string, subtitle: string, eyebrow = "AGREEMENT") {
  ctx.page.drawRectangle({
    x: 0,
    y: ctx.pageHeight - 8,
    width: ctx.pageWidth,
    height: 8,
    color: BRAND,
  });
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 23,
    width: 22,
    height: 22,
    color: BRAND,
  });
  ctx.page.drawText("D", {
    x: MARGIN + 7,
    y: ctx.y - 17,
    size: 12,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  ctx.page.drawText("DEALREC", {
    x: MARGIN + 30,
    y: ctx.y - 13,
    size: 11,
    font: ctx.bold,
    color: BRAND,
  });
  ctx.page.drawText(sanitize(eyebrow.endsWith("RECORD") ? eyebrow : `${eyebrow} RECORD`), {
    x: MARGIN + 30,
    y: ctx.y - 24,
    size: 7,
    font: ctx.font,
    color: MUTED,
  });
  const referenceWidth = ctx.bold.widthOfTextAtSize("REFERENCE", 7.5);
  ctx.page.drawText(sanitize(ctx.reference), {
    x: ctx.pageWidth - MARGIN - ctx.bold.widthOfTextAtSize(sanitize(ctx.reference), 8),
    y: ctx.y - 15,
    size: 8,
    font: ctx.bold,
    color: NAVY,
  });
  ctx.page.drawText("REFERENCE", {
    x: ctx.pageWidth - MARGIN - referenceWidth,
    y: ctx.y - 27,
    size: 7.5,
    font: ctx.font,
    color: MUTED,
  });
  ctx.y -= 42;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: ctx.pageWidth - MARGIN, y: ctx.y },
    thickness: 0.8,
    color: LINE,
  });
  ctx.y -= 22;

  ctx.page.drawText(sanitize(eyebrow), {
    x: MARGIN,
    y: ctx.y - 8,
    size: 8,
    font: ctx.bold,
    color: TEAL,
  });
  ctx.y -= 17;
  const titleLines = wrapText(title, ctx.bold, 22, ctx.pageWidth - MARGIN * 2);
  for (const line of titleLines) {
    ensureSpace(ctx, 29);
    ctx.page.drawText(line, {
      x: MARGIN,
      y: ctx.y - 22,
      size: 22,
      font: ctx.bold,
      color: NAVY,
    });
    ctx.y -= 28;
  }
  const subtitleLines = wrapText(subtitle, ctx.font, 9.2, ctx.pageWidth - MARGIN * 2 - 20);
  const subtitleHeight = Math.max(30, subtitleLines.length * 13 + 12);
  ensureSpace(ctx, subtitleHeight + 10);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - subtitleHeight,
    width: ctx.pageWidth - MARGIN * 2,
    height: subtitleHeight,
    color: LIGHT,
  });
  for (const [index, line] of subtitleLines.entries()) {
    ctx.page.drawText(line, {
      x: MARGIN + 10,
      y: ctx.y - 18 - index * 13,
      size: 9.2,
      font: ctx.font,
      color: MUTED,
    });
  }
  ctx.y -= subtitleHeight + 12;
}

function drawFooters(ctx: Ctx) {
  const pages = ctx.doc.getPages();
  pages.forEach((page, index) => {
    const width = page.getWidth();
    const footerY = 25;
    page.drawLine({
      start: { x: MARGIN, y: footerY + 12 },
      end: { x: width - MARGIN, y: footerY + 12 },
      thickness: 0.5,
      color: LINE,
    });
    page.drawText(
      sanitize(`${ctx.reference}  |  dealrec platform record  |  ${ctx.watermark || "Draft"}`),
      { x: MARGIN, y: footerY, size: 7, font: ctx.font, color: MUTED },
    );
    const pageLabel = `Page ${index + 1} of ${pages.length}`;
    page.drawText(pageLabel, {
      x: width - MARGIN - ctx.font.widthOfTextAtSize(pageLabel, 7.5),
      y: footerY,
      size: 7.5,
      font: ctx.font,
      color: MUTED,
    });
  });
}

export type PartyForPdf = {
  role: string;
  name: string;
  signerName?: string;
  signedAt?: Date | null;
  signatureType?: string;
  authLabel?: string;
  signaturePng?: Buffer | null;
};

export type WitnessForPdf = {
  role: string;
  name: string;
  address?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  signerName?: string | null;
  signedAt?: Date | null;
  acceptedAt?: Date | null;
  signatureType?: string | null;
  authLabel?: string;
  signaturePng?: Buffer | null;
  attested?: boolean;
};

export type AgreementPdfInput = {
  reference: string;
  title: string;
  versionNumber: number;
  content: AgreementContent;
  parties: PartyForPdf[];
  witnesses?: WitnessForPdf[];
  watermark: string;
  executed: boolean;
  generatedAt?: Date;
  documentId?: string;
};


async function drawWitnessBlocks(ctx: Ctx, witnesses: WitnessForPdf[] | undefined, executed: boolean) {
  if (!witnesses || witnesses.length === 0) return;
  drawHeading(ctx, "Witnesses");
  drawParagraph(
    ctx,
    "A witness attestation records that the named person confirmed they observed the identified party sign this version. Remote attestation may not satisfy formalities that require physical presence, a notary, or a specific witness.",
    { size: 8.5, color: MUTED, gap: 8 },
  );

  for (const witness of witnesses) {
    ensureSpace(ctx, 96);
    const cardHeight = witness.signaturePng && executed ? 86 : 64;
    ctx.page.drawRectangle({
      x: MARGIN,
      y: ctx.y - cardHeight,
      width: ctx.pageWidth - MARGIN * 2,
      height: cardHeight,
      borderColor: LINE,
      borderWidth: 0.6,
      color: witness.attested ? PAPER : undefined,
    });
    ctx.page.drawText(sanitize(`${witness.role}: ${witness.name}`), {
      x: MARGIN + 10,
      y: ctx.y - 15,
      size: 9.5,
      font: ctx.bold,
      color: INK,
    });
    const details = [witness.address, witness.occupation, witness.relationship].filter(Boolean).join(" | ");
    if (details) {
      ctx.page.drawText(sanitize(details).slice(0, 120), {
        x: MARGIN + 10,
        y: ctx.y - 29,
        size: 8,
        font: ctx.font,
        color: MUTED,
      });
    }

    if (executed && witness.signaturePng) {
      const image = await ctx.doc.embedPng(witness.signaturePng);
      const scale = Math.min(110 / image.width, 18 / image.height);
      ctx.page.drawImage(image, {
        x: MARGIN + 10,
        y: ctx.y - 67,
        width: image.width * scale,
        height: image.height * scale,
      });
    }

    if (executed && witness.attested && witness.acceptedAt) {
      ctx.page.drawText(`Intention accepted ${formatDateTime(witness.acceptedAt)}`, {
        x: MARGIN + 10,
        y: ctx.y - 42,
        size: 7.5,
        font: ctx.font,
        color: MUTED,
      });
    }

    const attestedLine =
      executed && witness.attested
        ? `Attested by ${witness.signerName || witness.name} - ${witness.signedAt ? formatDateTime(witness.signedAt) : ""} | ${witness.signatureType ?? "signature recorded"} | ${witness.authLabel ?? "contact verified"}`
        : executed
          ? witness.acceptedAt
            ? `Accepted to witness on ${formatDateTime(witness.acceptedAt)}; no attestation recorded before execution.`
            : "No witness attestation was recorded before execution."
          : "Witness signature: ______________________________";
    ctx.page.drawText(sanitize(attestedLine).slice(0, 120), {
      x: MARGIN + 10,
      y: ctx.y - cardHeight + 6,
      size: 7.5,
      font: ctx.font,
      color: witness.attested ? INK : MUTED,
    });
    ctx.y -= cardHeight + 8;
  }
}

async function drawSignatureBlocks(ctx: Ctx, parties: PartyForPdf[], executed: boolean) {
  drawHeading(ctx, "Signatures");
  drawParagraph(
    ctx,
    "Each signature is linked to the document version hash recorded on the platform. A drawn, typed, or uploaded signature image alone does not establish identity or constitute a qualified digital signature.",
    { size: 8.5, color: MUTED, gap: 8 },
  );

  for (const party of parties) {
    const cardHeight = executed ? 86 : 64;
    ensureSpace(ctx, cardHeight + 10);
    ctx.page.drawRectangle({
      x: MARGIN,
      y: ctx.y - cardHeight,
      width: ctx.pageWidth - MARGIN * 2,
      height: cardHeight,
      borderColor: LINE,
      borderWidth: 0.6,
      color: executed ? PAPER : undefined,
    });
    ctx.page.drawText(sanitize(`${party.role}: ${party.name}`), {
      x: MARGIN + 10,
      y: ctx.y - 16,
      size: 9.5,
      font: ctx.bold,
      color: INK,
    });

    if (executed && party.signaturePng) {
      const image = await ctx.doc.embedPng(party.signaturePng);
      const scale = Math.min(110 / image.width, 22 / image.height);
      ctx.page.drawImage(image, {
        x: MARGIN + 10,
        y: ctx.y - 49,
        width: image.width * scale,
        height: image.height * scale,
      });
    }

    const signedLine = executed
      ? `Signed by ${party.signerName || party.name} - ${party.signedAt ? formatDateTime(party.signedAt) : ""}`
      : "Signature: ______________________________";
    ctx.page.drawText(sanitize(signedLine), {
      x: MARGIN + 10,
      y: executed ? ctx.y - 63 : ctx.y - 43,
      size: 7.2,
      font: ctx.font,
      color: MUTED,
    });

    const authLine = executed
      ? `Signature method: ${party.signatureType ?? "recorded"}  |  Authentication: ${party.authLabel ?? "not recorded"}`
      : "Date: __________________";
    if (authLine) {
      ctx.page.drawText(sanitize(authLine), {
        x: MARGIN + 10,
        y: executed ? ctx.y - 78 : ctx.y - 56,
        size: 6.8,
        font: ctx.font,
        color: MUTED,
      });
    }

    ctx.y -= cardHeight + 8;
  }
}

export async function buildAgreementPdf(input: AgreementPdfInput) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(sanitize(input.title));
  doc.setAuthor("dealrec");
  doc.setSubject("Platform electronic agreement record");

  const ctx: Ctx = {
    doc,
    page: doc.addPage(A4),
    font,
    bold,
    y: A4[1] - MARGIN,
    pageWidth: A4[0],
    pageHeight: A4[1],
    reference: input.reference,
    watermark: input.watermark,
  };
  if (input.watermark) {
    ctx.page.drawText(sanitize(input.watermark), {
      x: 70,
      y: 330,
      size: 58,
      font: bold,
      color: rgb(0.88, 0.91, 0.89),
      opacity: 0.45,
      rotate: degrees(32),
    });
  }

  drawHeader(ctx, input.content.title, input.content.subtitle);

  drawKeyValue(ctx, "Deal reference", input.reference);
  drawKeyValue(ctx, "Document version", `Version ${input.versionNumber}`);
  drawKeyValue(
    ctx,
    "Generated",
    formatDateTime(input.generatedAt ?? new Date()),
  );
  if (input.documentId) drawKeyValue(ctx, "Document ID", input.documentId);

  drawHeading(ctx, "Parties");
  for (const party of input.content.parties) {
    drawParagraph(ctx, `${party.role}: ${party.name}`, { size: 10.5 });
  }

  for (const section of input.content.sections) {
    drawHeading(ctx, section.heading);
    for (const paragraph of section.body) {
      drawParagraph(ctx, paragraph);
    }
  }

  await drawSignatureBlocks(ctx, input.parties, input.executed);
  await drawWitnessBlocks(ctx, input.witnesses, input.executed);

  if (input.content.notice) {
    drawHeading(ctx, "Important limitations");
    drawParagraph(ctx, input.content.notice, { size: 8.5, color: MUTED });
  }

  drawFooters(ctx);
  return doc.save();
}

export async function buildUploadedExecutionPdf(input: {
  originalBytes: Uint8Array;
  reference: string;
  title: string;
  versionNumber: number;
  parties: PartyForPdf[];
  witnesses?: WitnessForPdf[];
  watermark: string;
  executed: boolean;
  generatedAt?: Date;
}) {
  const source = await PDFDocument.load(input.originalBytes);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(sanitize(input.title));
  doc.setAuthor("dealrec");

  const copied = await doc.copyPages(source, source.getPageIndices());
  for (const page of copied) {
    doc.addPage(page);
  }

  for (const page of doc.getPages()) {
    const width = page.getWidth();
    const height = page.getHeight();
    if (input.watermark) {
      page.drawText(sanitize(input.watermark), {
        x: Math.max(40, width / 2 - 150),
        y: height / 2 - 20,
        size: 52,
        font: bold,
        color: rgb(0.88, 0.91, 0.89),
        opacity: 0.4,
        rotate: degrees(32),
      });
    }
  }

  const ctx: Ctx = {
    doc,
    page: doc.addPage(A4),
    font,
    bold,
    y: A4[1] - MARGIN,
    pageWidth: A4[0],
    pageHeight: A4[1],
    reference: input.reference,
    watermark: input.watermark,
  };
  if (input.watermark) {
    ctx.page.drawText(sanitize(input.watermark), {
      x: 70,
      y: 330,
      size: 58,
      font: bold,
      color: rgb(0.88, 0.91, 0.89),
      opacity: 0.45,
      rotate: degrees(32),
    });
  }

  drawHeader(ctx, "Execution page", "Uploaded agreement - signing and record page");
  drawKeyValue(ctx, "Deal reference", input.reference);
  drawKeyValue(ctx, "Document version", `Version ${input.versionNumber}`);
  drawKeyValue(ctx, "Recorded", formatDateTime(input.generatedAt ?? new Date()));
  drawParagraph(
    ctx,
    "This execution page is attached to the uploaded agreement for the same deal. The original uploaded file is preserved separately. The executed copy and this page are hashed and recorded by the platform.",
    { size: 9.5, color: MUTED },
  );

  await drawSignatureBlocks(ctx, input.parties, input.executed);
  await drawWitnessBlocks(ctx, input.witnesses, input.executed);

  drawHeading(ctx, "Important limitations");
  drawParagraph(
    ctx,
    "This is a platform record of the uploaded document and signing events. It is not legal advice, a notarial act, a government certification or a guarantee of enforceability or admissibility. Independent legal advice may be needed.",
    { size: 8.5, color: MUTED },
  );

  drawFooters(ctx);
  return doc.save();
}

export async function qrPngBuffer(url: string) {
  const dataUrl = await QRCode.toDataURL(url, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
}

export type CertificateInput = {
  reference: string;
  title: string;
  sealSerial: string;
  verificationUrl: string;
  documentHash: string;
  documentVersion: number;
  executedAt: Date;
  issuedAt: Date;
  signers: {
    role: string;
    name: string;
    signerName: string;
    signatureType: string;
    authLabel: string;
    signedAt: Date;
  }[];
  parties: { role: string; name: string }[];
  witnesses?: WitnessForPdf[];
};

export async function buildCertificatePdf(input: CertificateInput) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(sanitize(`Verification certificate - ${input.reference}`));
  doc.setAuthor("dealrec");
  doc.setSubject("Deal record verification details");

  const page = doc.addPage(A4);
  const ctx: Ctx = {
    doc,
    page,
    font,
    bold,
    y: A4[1] - 174,
    pageWidth: A4[0],
    pageHeight: A4[1],
    reference: input.reference,
    watermark: "CERTIFICATE",
  };
  page.drawRectangle({
    x: 0,
    y: A4[1] - 154,
    width: A4[0],
    height: 154,
    color: NAVY,
  });
  page.drawRectangle({
    x: 0,
    y: A4[1] - 160,
    width: A4[0],
    height: 6,
    color: TEAL,
  });
  page.drawText("DEALREC", {
    x: MARGIN,
    y: A4[1] - 40,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("PLATFORM RECORD  /  VERIFICATION CERTIFICATE", {
    x: MARGIN,
    y: A4[1] - 56,
    size: 7.5,
    font,
    color: rgb(0.73, 0.86, 0.84),
  });
  page.drawText("Record verification", {
    x: MARGIN,
    y: A4[1] - 94,
    size: 24,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Certificate", {
    x: MARGIN,
    y: A4[1] - 122,
    size: 24,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(`DEAL REFERENCE  ${sanitize(input.reference)}`, {
    x: MARGIN,
    y: A4[1] - 141,
    size: 8,
    font,
    color: rgb(0.82, 0.89, 0.88),
  });

  const serialX = A4[0] - MARGIN - 150;
  const serialY = A4[1] - 118;
  page.drawRectangle({
    x: serialX,
    y: serialY,
    width: 150,
    height: 54,
    borderColor: rgb(0.36, 0.75, 0.69),
    borderWidth: 0.8,
    color: rgb(0.11, 0.22, 0.26),
  });
  page.drawText("PLATFORM SEAL SERIAL", {
    x: serialX + 10,
    y: serialY + 36,
    size: 6.5,
    font: bold,
    color: rgb(0.73, 0.86, 0.84),
  });
  for (const [index, line] of wrapText(input.sealSerial, bold, 8.5, 130).entries()) {
    page.drawText(line, {
      x: serialX + 10,
      y: serialY + 20 - index * 10,
      size: 8.5,
      font: bold,
      color: rgb(1, 1, 1),
    });
  }

  drawHeading(ctx, "Record details");
  drawKeyValue(ctx, "Deal title", input.title);
  drawKeyValue(ctx, "Document version", `Version ${input.documentVersion}`);
  drawKeyValue(ctx, "Executed at", formatDateTime(input.executedAt));
  drawKeyValue(ctx, "Certificate issued", formatDateTime(input.issuedAt));
  drawKeyValue(ctx, "SHA-256", input.documentHash);

  drawHeading(ctx, "Parties");
  for (const party of input.parties) {
    drawParagraph(ctx, `${party.role}  |  ${party.name}`, { size: 9, gap: 2 });
  }

  drawHeading(ctx, "Signing record");
  for (const signer of input.signers) {
    drawParagraph(
      ctx,
      `${signer.role}: ${signer.signerName}  |  ${formatDateTime(signer.signedAt)}  |  ${signer.signatureType} signature  |  ${signer.authLabel}`,
      { size: 8.3, color: MUTED, gap: 2 },
    );
  }

  if (input.witnesses && input.witnesses.length > 0) {
    drawHeading(ctx, "Witness record");
    for (const witness of input.witnesses) {
      drawParagraph(
        ctx,
        witness.attested
          ? `${witness.role}: ${witness.signerName || witness.name}${witness.acceptedAt ? `  |  intention accepted ${formatDateTime(witness.acceptedAt)}` : ""}  |  attested ${witness.signedAt ? formatDateTime(witness.signedAt) : "at an unrecorded time"}  |  ${witness.signatureType ?? "signature"}  |  ${witness.authLabel ?? "contact verified"}`
          : `${witness.role}: ${witness.name}  |  ${
              witness.acceptedAt
                ? `accepted to witness ${formatDateTime(witness.acceptedAt)}; no attestation before execution`
                : "no attestation recorded before execution"
            }`,
        { size: 8.3, color: witness.attested ? INK : MUTED, gap: 2 },
      );
    }
  }

  drawHeading(ctx, "Verification and limitations");
  drawParagraph(
    ctx,
    "This certificate records the platform's deal reference, executed document version and SHA-256 hash, signing metadata, and verification link. Scan the code or open the link to check the current platform record. A matching hash means the compared file is byte-for-byte identical to the file recorded by the platform.",
    { size: 8.2, gap: 3 },
  );
  drawParagraph(
    ctx,
    "A mismatch only means the files differ; it does not by itself prove fraud. This is a platform verification record, not proof of civil identity, a qualified digital signature, legal advice, an NBA or notarial seal, government certification, a Section 84 certificate, or a guarantee of enforceability or admissibility.",
    { size: 7.8, color: MUTED, gap: 6 },
  );

  ensureSpace(ctx, 126);
  const qr = await qrPngBuffer(input.verificationUrl);
  const qrImage = await doc.embedPng(qr);
  const panelY = ctx.y - 112;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: panelY,
    width: ctx.pageWidth - MARGIN * 2,
    height: 112,
    borderColor: LINE,
    borderWidth: 0.8,
    color: LIGHT,
  });
  ctx.page.drawImage(qrImage, {
    x: MARGIN + 10,
    y: panelY + 10,
    width: 92,
    height: 92,
  });
  const verifyX = MARGIN + 118;
  ctx.page.drawText("VERIFY THIS RECORD", {
    x: verifyX,
    y: panelY + 88,
    size: 9,
    font: bold,
    color: BRAND,
  });
  ctx.page.drawText("Scan the QR code or visit:", {
    x: verifyX,
    y: panelY + 72,
    size: 8,
    font,
    color: MUTED,
  });
  const urlLines = wrapText(input.verificationUrl, font, 7.2, ctx.pageWidth - MARGIN * 2 - 138);
  for (const [index, line] of urlLines.slice(0, 3).entries()) {
    ctx.page.drawText(line, {
      x: verifyX,
      y: panelY + 57 - index * 10,
      size: 7.2,
      font,
      color: INK,
    });
  }
  ctx.page.drawText(`Seal serial  ${sanitize(input.sealSerial)}`, {
    x: verifyX,
    y: panelY + 15,
    size: 7.5,
    font: bold,
    color: NAVY,
  });

  drawFooters(ctx);
  return doc.save();
}

export type EvidenceRecordField = { label: string; value: string };

export type EvidenceRecordItem = { title: string; fields: EvidenceRecordField[] };

export type EvidenceRecordSection = {
  title: string;
  description?: string;
  items: EvidenceRecordItem[];
  emptyText?: string;
};

export type EvidenceRecordPdfInput = {
  reference: string;
  title: string;
  generatedAt: Date;
  sections: EvidenceRecordSection[];
};

export async function buildEvidenceRecordPdf(input: EvidenceRecordPdfInput) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(sanitize(`Evidence record - ${input.reference}`));
  doc.setAuthor("dealrec");
  doc.setSubject("Platform evidence record");

  const ctx: Ctx = {
    doc,
    page: doc.addPage(A4),
    font,
    bold,
    y: A4[1] - MARGIN,
    pageWidth: A4[0],
    pageHeight: A4[1],
    reference: input.reference,
    watermark: "EVIDENCE",
  };

  drawHeader(
    ctx,
    input.title,
    `Evidence record generated ${formatDateTime(input.generatedAt)}. This PDF replaces spreadsheet exports so the record cannot be silently reordered, reformatted or changed by spreadsheet formulas.`,
    "EVIDENCE RECORD",
  );

  for (const section of input.sections) {
    drawHeading(ctx, section.title);
    if (section.description) {
      drawParagraph(ctx, section.description, { size: 8.6, color: MUTED, gap: 4 });
    }
    if (section.items.length === 0) {
      drawParagraph(ctx, section.emptyText ?? "No records.", { size: 9, color: MUTED });
      continue;
    }
    for (const [index, item] of section.items.entries()) {
      ensureSpace(ctx, 30);
      ctx.page.drawText(sanitize(item.title), {
        x: MARGIN,
        y: ctx.y - 10,
        size: 9.5,
        font: bold,
        color: NAVY,
      });
      ctx.y -= 17;
      for (const field of item.fields) {
        if (!field.value) continue;
        drawParagraph(ctx, `${field.label}: ${field.value}`, { size: 8.8, gap: 1 });
      }
      if (index < section.items.length - 1) {
        ensureSpace(ctx, 14);
        ctx.page.drawLine({
          start: { x: MARGIN, y: ctx.y - 4 },
          end: { x: ctx.pageWidth - MARGIN, y: ctx.y - 4 },
          thickness: 0.4,
          color: LINE,
        });
        ctx.y -= 13;
      } else {
        ctx.y -= 6;
      }
    }
  }

  drawHeading(ctx, "Integrity and limitations");
  drawParagraph(
    ctx,
    "Every file in this pack has a SHA-256 hash in manifest.txt. The ZIP hash is recorded in the platform audit trail and shown on the public verification page. If any byte of a file changes, its hash changes. A mismatch shows the copy differs from the platform record; it does not by itself prove fraud.",
    { size: 8.2, gap: 3 },
  );
  drawParagraph(
    ctx,
    "This evidence record is a platform record, not legal advice, a notarial act, a government certification or a guarantee of payment, enforceability or admissibility.",
    { size: 7.8, color: MUTED, gap: 6 },
  );

  drawFooters(ctx);
  return doc.save();
}
