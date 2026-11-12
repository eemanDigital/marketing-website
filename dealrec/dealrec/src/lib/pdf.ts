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
const LINE = rgb(0.85, 0.87, 0.9);
const LIGHT = rgb(0.95, 0.97, 0.96);

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
  ctx.y = A4[1] - MARGIN;

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
  ensureSpace(ctx, 34);
  ctx.y -= 8;
  ctx.page.drawText(sanitize(text), {
    x: MARGIN,
    y: ctx.y - 12,
    size: 12,
    font: ctx.bold,
    color: BRAND,
  });
  ctx.y -= 22;
}

function drawKeyValue(ctx: Ctx, label: string, value: string) {
  ensureSpace(ctx, 16);
  ctx.page.drawText(sanitize(label), {
    x: MARGIN,
    y: ctx.y - 10,
    size: 9,
    font: ctx.bold,
    color: MUTED,
  });
  const valueLines = wrapText(value, ctx.font, 9.5, ctx.pageWidth - MARGIN * 2 - 120);
  for (const line of valueLines) {
    ctx.page.drawText(line, {
      x: MARGIN + 120,
      y: ctx.y - 10,
      size: 9.5,
      font: ctx.font,
      color: INK,
    });
    ctx.y -= 14;
  }
  ctx.y -= 4;
}

function drawHeader(ctx: Ctx, title: string, subtitle: string) {
  ctx.page.drawText("DEALREC", {
    x: MARGIN,
    y: ctx.y - 14,
    size: 16,
    font: ctx.bold,
    color: BRAND,
  });
  ctx.page.drawText(sanitize(ctx.reference), {
    x: ctx.pageWidth - MARGIN - ctx.font.widthOfTextAtSize(sanitize(ctx.reference), 9),
    y: ctx.y - 13,
    size: 9,
    font: ctx.font,
    color: MUTED,
  });
  ctx.y -= 28;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: ctx.pageWidth - MARGIN, y: ctx.y },
    thickness: 1,
    color: LINE,
  });
  ctx.y -= 26;

  const titleLines = wrapText(title, ctx.bold, 18, ctx.pageWidth - MARGIN * 2);
  for (const line of titleLines) {
    ensureSpace(ctx, 24);
    ctx.page.drawText(line, {
      x: MARGIN,
      y: ctx.y - 18,
      size: 18,
      font: ctx.bold,
      color: INK,
    });
    ctx.y -= 24;
  }
  ctx.y -= 2;
  drawParagraph(ctx, subtitle, { size: 9.5, color: MUTED, gap: 8 });
}

function drawFooters(ctx: Ctx) {
  const pages = ctx.doc.getPages();
  pages.forEach((page, index) => {
    const width = page.getWidth();
    const footerY = 24;
    page.drawLine({
      start: { x: MARGIN, y: footerY + 12 },
      end: { x: width - MARGIN, y: footerY + 12 },
      thickness: 0.5,
      color: LINE,
    });
    page.drawText(
      sanitize(`${ctx.reference} - platform electronic record - ${ctx.watermark || "Draft"}`),
      { x: MARGIN, y: footerY, size: 7.5, font: ctx.font, color: MUTED },
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
    ensureSpace(ctx, witness.signaturePng ? 98 : 78);
    ctx.page.drawRectangle({
      x: MARGIN,
      y: ctx.y - 64,
      width: ctx.pageWidth - MARGIN * 2,
      height: 64,
      borderColor: LINE,
      borderWidth: 0.8,
      color: witness.attested ? LIGHT : undefined,
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
      try {
        const image = await ctx.doc.embedPng(witness.signaturePng);
        const scale = Math.min(110 / image.width, 22 / image.height);
        ctx.page.drawImage(image, {
          x: MARGIN + 10,
          y: ctx.y - 51,
          width: image.width * scale,
          height: image.height * scale,
        });
      } catch {
        // A corrupt witness signature image should not block the executed record.
      }
    }

    const attestedLine =
      executed && witness.attested
        ? `Attested by ${witness.signerName || witness.name}${witness.signedAt ? ` - ${formatDateTime(witness.signedAt)}` : ""}${witness.authLabel ? ` (${witness.authLabel})` : ""}`
        : executed
          ? "No witness attestation was recorded before execution."
          : "Witness signature: ______________________________";
    ctx.page.drawText(sanitize(attestedLine).slice(0, 120), {
      x: MARGIN + 10,
      y: ctx.y - 58,
      size: 8,
      font: ctx.font,
      color: witness.attested ? INK : MUTED,
    });
    ctx.y -= 74;
  }
}

async function drawSignatureBlocks(ctx: Ctx, parties: PartyForPdf[], executed: boolean) {
  drawHeading(ctx, "Signatures");
  drawParagraph(
    ctx,
    "Each signature is linked to the document version hash recorded on the platform. A drawn or typed signature image alone is not a qualified digital signature.",
    { size: 8.5, color: MUTED, gap: 8 },
  );

  for (const party of parties) {
    ensureSpace(ctx, executed && party.signaturePng ? 90 : 62);
    ctx.page.drawRectangle({
      x: MARGIN,
      y: ctx.y - 58,
      width: ctx.pageWidth - MARGIN * 2,
      height: 58,
      borderColor: LINE,
      borderWidth: 0.8,
      color: executed ? LIGHT : undefined,
    });
    ctx.page.drawText(sanitize(`${party.role}: ${party.name}`), {
      x: MARGIN + 10,
      y: ctx.y - 16,
      size: 9.5,
      font: ctx.bold,
      color: INK,
    });

    if (executed && party.signaturePng) {
      try {
        const image = await ctx.doc.embedPng(party.signaturePng);
        const scale = Math.min(110 / image.width, 26 / image.height);
        ctx.page.drawImage(image, {
          x: MARGIN + 10,
          y: ctx.y - 48,
          width: image.width * scale,
          height: image.height * scale,
        });
      } catch {
        // A corrupt signature image should not block the executed record.
      }
    }

    const signedLine = executed
      ? `Signed by ${party.signerName || party.name} - ${party.signedAt ? formatDateTime(party.signedAt) : ""}`
      : "Signature: ______________________________";
    ctx.page.drawText(sanitize(signedLine), {
      x: MARGIN + 10,
      y: ctx.y - 50,
      size: 8.5,
      font: ctx.font,
      color: MUTED,
    });

    const authLine = executed ? party.authLabel ?? "" : "Date: __________________";
    if (authLine) {
      ctx.page.drawText(sanitize(authLine), {
        x: ctx.pageWidth - MARGIN - 150,
        y: ctx.y - 50,
        size: 7.5,
        font: ctx.font,
        color: MUTED,
      });
    }

    ctx.y -= 70;
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
  signers: { role: string; name: string; signerName: string; authLabel: string; signedAt: Date }[];
  parties: { role: string; name: string }[];
  witnesses?: WitnessForPdf[];
};

export async function buildCertificatePdf(input: CertificateInput) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(sanitize(`Verification certificate - ${input.reference}`));
  doc.setAuthor("dealrec");

  const ctx: Ctx = {
    doc,
    page: doc.addPage(A4),
    font,
    bold,
    y: A4[1] - MARGIN,
    pageWidth: A4[0],
    pageHeight: A4[1],
    reference: input.reference,
    watermark: "CERTIFICATE",
  };
  ctx.page.drawText("CERTIFICATE", {
    x: 70,
    y: 330,
    size: 58,
    font: bold,
    color: rgb(0.9, 0.92, 0.91),
    opacity: 0.4,
    rotate: degrees(32),
  });

  drawHeader(ctx, "Deal verification certificate", "Platform Deal Verification - Electronic Record");

  drawHeading(ctx, "Record details");
  drawKeyValue(ctx, "Deal reference", input.reference);
  drawKeyValue(ctx, "Deal title", input.title);
  drawKeyValue(ctx, "Seal serial", input.sealSerial);
  drawKeyValue(ctx, "Document version", `Version ${input.documentVersion}`);
  drawKeyValue(ctx, "Executed at", formatDateTime(input.executedAt));
  drawKeyValue(ctx, "Certificate issued", formatDateTime(input.issuedAt));
  drawKeyValue(ctx, "Document SHA-256", input.documentHash);
  drawKeyValue(ctx, "Verification URL", input.verificationUrl);

  drawHeading(ctx, "Parties and signatories");
  for (const party of input.parties) {
    drawParagraph(ctx, `${party.role}: ${party.name}`, { size: 10 });
  }
  for (const signer of input.signers) {
    drawParagraph(
      ctx,
      `${signer.role} - signed by ${signer.signerName} on ${formatDateTime(signer.signedAt)} (${signer.authLabel})`,
      { size: 9, color: MUTED },
    );
  }

  if (input.witnesses && input.witnesses.length > 0) {
    drawHeading(ctx, "Witness attestations");
    for (const witness of input.witnesses) {
      drawParagraph(
        ctx,
        witness.attested
          ? `${witness.role}: ${witness.name}${witness.address ? ` | ${witness.address}` : ""}${witness.occupation ? ` | ${witness.occupation}` : ""} - attested ${witness.signedAt ? formatDateTime(witness.signedAt) : ""} (${witness.authLabel ?? "contact verified"})`
          : `${witness.role}: ${witness.name} - no attestation recorded before execution.`,
        { size: 9, color: witness.attested ? INK : MUTED },
      );
    }
  }

  drawHeading(ctx, "What this certificate records");
  drawParagraph(
    ctx,
    "The platform recorded the document version, computed a SHA-256 hash of the exact executed agreement file, recorded the signing events and issued this certificate. You can scan the QR code or visit the verification URL to check the record reference and compare a file hash.",
    { size: 9.5 },
  );

  drawParagraph(
    ctx,
    "A hash match shows that the file is byte-for-byte identical to the file recorded by the platform. A mismatch shows that the uploaded file differs; it does not by itself prove fraud. This certificate is not an NBA stamp or seal, notarial seal, government certification or guarantee of legal validity. It is not a Section 84 Evidence Act certificate unless separately prepared and issued through an approved process.",
    { size: 8.5, color: MUTED },
  );

  ensureSpace(ctx, 150);
  const qr = await qrPngBuffer(input.verificationUrl);
  const qrImage = await doc.embedPng(qr);
  ctx.page.drawImage(qrImage, {
    x: MARGIN,
    y: ctx.y - 110,
    width: 100,
    height: 100,
  });
  ctx.page.drawText("Scan to verify", {
    x: MARGIN,
    y: ctx.y - 124,
    size: 8,
    font: font,
    color: MUTED,
  });

  const badgeX = MARGIN + 130;
  const badgeY = ctx.y - 110;
  ctx.page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: 210,
    height: 96,
    borderColor: BRAND,
    borderWidth: 1.5,
    color: LIGHT,
  });
  ctx.page.drawText("DEAL RECORD VERIFIED", {
    x: badgeX + 14,
    y: badgeY + 70,
    size: 11,
    font: bold,
    color: BRAND,
  });
  ctx.page.drawText(sanitize(input.sealSerial), {
    x: badgeX + 14,
    y: badgeY + 52,
    size: 8.5,
    font: font,
    color: INK,
  });
  ctx.page.drawText(sanitize(`Hash: ${input.documentHash.slice(0, 20)}...`), {
    x: badgeX + 14,
    y: badgeY + 38,
    size: 7.5,
    font: font,
    color: MUTED,
  });
  ctx.page.drawText("Platform Deal Verification -", {
    x: badgeX + 14,
    y: badgeY + 22,
    size: 7.5,
    font: font,
    color: MUTED,
  });
  ctx.page.drawText("Electronic Record", {
    x: badgeX + 14,
    y: badgeY + 12,
    size: 7.5,
    font: font,
    color: MUTED,
  });

  ctx.y = badgeY - 20;
  drawParagraph(
    ctx,
    "This is a platform verification mark. It is not an NBA stamp or seal, notarial seal, government certification or guarantee of legal validity.",
    { size: 8, color: MUTED },
  );

  drawFooters(ctx);
  return doc.save();
}
