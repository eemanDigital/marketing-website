import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

try {
  process.loadEnvFile();
} catch {
  // Environment variables may be injected by the host.
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

const CONSENT_TEXT_VERSION = "2026-01";

function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

function storagePath(key) {
  const configured = process.env.STORAGE_DIR ?? ".storage";
  const root = path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  return path.join(root, key.replace(/\\/g, "/"));
}

async function saveFile(key, bytes) {
  const full = storagePath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

async function appendEvent(dealId, eventType, description, actorPartyId = null, metadata = {}) {
  const previous = await prisma.dealEvent.findFirst({
    where: { dealId },
    orderBy: { sequence: "desc" },
    select: { sequence: true, eventHash: true },
  });
  const sequence = (previous?.sequence ?? 0) + 1;
  const previousEventHash = previous?.eventHash ?? null;
  const createdAt = new Date();
  const metadataJson = stableStringify(metadata);
  const eventHash = sha256(
    stableStringify({
      dealId,
      sequence,
      eventType,
      description,
      actorPartyId,
      metadata: JSON.parse(metadataJson),
      createdAt: createdAt.toISOString(),
      previousEventHash,
    }),
  );
  await prisma.dealEvent.create({
    data: {
      dealId,
      sequence,
      eventType,
      description,
      actorPartyId,
      metadataJson,
      createdAt,
      previousEventHash,
      eventHash,
    },
  });
}

async function makePdf(title, lines, watermark) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const width = page.getWidth();

  page.drawRectangle({ x: 0, y: page.getHeight() - 90, width, height: 90, color: rgb(0.12, 0.35, 0.27) });
  page.drawText("dealrec", { x: 48, y: page.getHeight() - 52, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText(title.slice(0, 80), { x: 48, y: page.getHeight() - 74, size: 10, font, color: rgb(0.9, 0.95, 0.92) });

  let y = page.getHeight() - 130;
  for (const line of lines) {
    if (y < 70) break;
    page.drawText(String(line).slice(0, 100), { x: 48, y, size: 10, font, color: rgb(0.15, 0.2, 0.17) });
    y -= 17;
  }

  if (watermark) {
    page.drawText(watermark, {
      x: 110,
      y: 60,
      size: 18,
      font: bold,
      color: rgb(0.72, 0.76, 0.73),
    });
  }

  page.drawText("Demo seed document. Not legal advice.", {
    x: 48,
    y: 34,
    size: 8,
    font,
    color: rgb(0.55, 0.58, 0.56),
  });

  return Buffer.from(await pdf.save());
}

function reference(prefix) {
  return prefix;
}

async function seedTemplates() {
  const raw = await readFile(new URL("../src/lib/template-definitions.json", import.meta.url), "utf8");
  const definitions = JSON.parse(raw);
  for (const template of definitions) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        description: template.description,
        version: template.version,
        reviewedAt: new Date(`${template.reviewedAt}T00:00:00+01:00`),
        definitionsJson: JSON.stringify(template),
        active: true,
      },
      create: {
        slug: template.slug,
        name: template.name,
        description: template.description,
        version: template.version,
        reviewedAt: new Date(`${template.reviewedAt}T00:00:00+01:00`),
        definitionsJson: JSON.stringify(template),
      },
    });
  }
  return definitions.length;
}

async function seedUsers() {
  const password = await bcrypt.hash("Dealrec123!", 12);
  const adminPassword = await bcrypt.hash("DealrecAdmin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dealrec.ng" },
    update: { fullName: "dealrec admin", isAdmin: true, emailVerifiedAt: new Date() },
    create: {
      fullName: "dealrec admin",
      email: "admin@dealrec.ng",
      passwordHash: adminPassword,
      isAdmin: true,
      emailVerifiedAt: new Date(),
    },
  });

  const ada = await prisma.user.upsert({
    where: { email: "ada@example.com" },
    update: { fullName: "Adaeze Okafor", emailVerifiedAt: new Date(), phoneNumber: "08012345678", phoneVerifiedAt: new Date() },
    create: {
      fullName: "Adaeze Okafor",
      email: "ada@example.com",
      passwordHash: password,
      emailVerifiedAt: new Date(),
      phoneNumber: "08012345678",
      phoneVerifiedAt: new Date(),
    },
  });

  const tunde = await prisma.user.upsert({
    where: { email: "tunde@example.com" },
    update: { fullName: "Tunde Balogun", emailVerifiedAt: new Date() },
    create: {
      fullName: "Tunde Balogun",
      email: "tunde@example.com",
      passwordHash: password,
      emailVerifiedAt: new Date(),
    },
  });

  return { admin, ada, tunde };
}


async function seedDemoInvitation() {
  const deal = await prisma.deal.findUnique({
    where: { reference: reference("DR-2026-DEMO01") },
    include: { parties: true },
  });
  if (!deal) return null;
  const party = deal.parties.find((item) => !item.isCreator);
  if (!party) return null;

  const tokenHash = sha256("demo-invite-2026");
  const existing = await prisma.invitation.findUnique({ where: { tokenHash } });
  const expiresAt = new Date(Date.now() + 14 * 86_400_000);
  if (existing) {
    await prisma.invitation.update({
      where: { id: existing.id },
      data: { revokedAt: null, expiresAt, status: "SENT" },
    });
  } else {
    await prisma.invitation.create({
      data: {
        dealId: deal.id,
        partyId: party.id,
        tokenHash,
        status: "SENT",
        expiresAt,
      },
    });
  }
  await prisma.dealParty.update({
    where: { id: party.id },
    data: { invitationStatus: "SENT" },
  });
  return deal.reference;
}

async function seedOpenDeal(ada, tunde) {
  const existing = await prisma.deal.findUnique({ where: { reference: reference("DR-2026-DEMO01") } });
  if (existing) return { id: existing.id, created: false };

  const values = {
    principal: "300000",
    repaymentDate: "2026-12-15",
    interest: "Interest-free",
    repaymentSchedule: "NGN 150,000 on 15 November 2026\nNGN 150,000 on 15 December 2026",
    paymentMethod: "Bank transfer to the lender's account",
    defaultSteps: "The borrower will be contacted and given 7 days to pay. Either party may seek independent legal advice.",
  };

  const deal = await prisma.deal.create({
    data: {
      reference: reference("DR-2026-DEMO01"),
      title: "Loan for market stock",
      dealType: "personal-loan",
      creatorId: ada.id,
      status: "AWAITING_COUNTERPARTY",
      currency: "NGN",
      totalAmount: 300000,
      termsJson: JSON.stringify(values),
      templateSlug: "personal-loan",
      templateVersion: "1.0",
      currentVersion: 1,
      parties: {
        create: [
          {
            userId: ada.id,
            fullName: ada.fullName,
            email: ada.email,
            role: "Lender",
            isCreator: true,
            signatureRequired: true,
            invitationStatus: "ACCEPTED",
            authenticationLevel: "ACCOUNT_SESSION",
            joinedAt: new Date(),
          },
          {
            userId: tunde.id,
            fullName: tunde.fullName,
            email: tunde.email,
            role: "Borrower",
            isCreator: false,
            signatureRequired: true,
            invitationStatus: "SENT",
            authenticationLevel: "NONE",
          },
        ],
      },
    },
    include: { parties: true },
  });

  const pdfBytes = await makePdf(
    "Personal loan - Loan for market stock",
    [
      "Reference: DR-2026-DEMO01",
      "Version: 1",
      "",
      "Lender: Adaeze Okafor",
      "Borrower: Tunde Balogun",
      "",
      "Principal: NGN 300,000",
      "Repayment date: 15 December 2026",
      "Interest: Interest-free",
      "Payment method: Bank transfer",
      "",
      "Repayment schedule:",
      "NGN 150,000 on 15 November 2026",
      "NGN 150,000 on 15 December 2026",
    ],
    "DRAFT - NOT YET SIGNED",
  );
  const hash = sha256(pdfBytes);
  const key = `deals/${deal.id}/v1/draft-${hash.slice(0, 12)}.pdf`;
  await saveFile(key, pdfBytes);

  const document = await prisma.dealDocument.create({
    data: {
      dealId: deal.id,
      versionNumber: 1,
      documentType: "draft",
      storageKey: key,
      originalName: "personal-loan-demo.pdf",
      mimeType: "application/pdf",
      fileSize: pdfBytes.length,
      sha256: hash,
      createdBy: ada.id,
    },
  });

  const creatorParty = deal.parties.find((party) => party.isCreator);
  const otherParty = deal.parties.find((party) => !party.isCreator);

  await appendEvent(deal.id, "DEAL_CREATED", "Deal created from Personal loan.", creatorParty?.id, {
    reference: deal.reference,
    templateSlug: "personal-loan",
  });
  await appendEvent(deal.id, "DOCUMENT_VERSION_CREATED", "Document version 1 generated.", creatorParty?.id, {
    version: 1,
    sha256: hash,
    documentType: "draft",
  });
  await appendEvent(deal.id, "PARTY_INVITED", "Invitation link created for the other party.", creatorParty?.id, {
    expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
  });

  await prisma.obligation.create({
    data: {
      dealId: deal.id,
      responsiblePartyId: otherParty?.id,
      title: "First repayment instalment",
      description: "Borrower to pay the first NGN 150,000 instalment.",
      amount: 150000,
      kind: "PAYMENT",
      dueAt: new Date("2026-11-15T12:00:00.000Z"),
    },
  });

  return { id: deal.id, created: true, documentId: document.id };
}

async function seedExecutedDeal(ada, tunde) {
  const existing = await prisma.deal.findUnique({ where: { reference: reference("DR-2026-DEMO02") } });
  if (existing) return { id: existing.id, created: false };

  const values = {
    scope: "Design a six-page brand brochure and prepare print-ready files.",
    deliverables: "One six-page brochure design, source files and a print-ready PDF.",
    milestones: "First draft by 20 October 2026\nFinal files by 5 November 2026",
    deadline: "2026-11-05",
    fee: "150000",
    revisions: "Two rounds of revisions included.",
    acceptance: "The client confirms acceptance in writing within 5 working days of delivery.",
  };

  const deal = await prisma.deal.create({
    data: {
      reference: reference("DR-2026-DEMO02"),
      title: "Brand brochure design",
      dealType: "service-agreement",
      creatorId: ada.id,
      status: "EXECUTED",
      currency: "NGN",
      totalAmount: 150000,
      termsJson: JSON.stringify(values),
      templateSlug: "service-agreement",
      templateVersion: "1.0",
      currentVersion: 1,
      executedAt: new Date(Date.now() - 2 * 86_400_000),
      parties: {
        create: [
          {
            userId: ada.id,
            fullName: ada.fullName,
            email: ada.email,
            role: "Service provider",
            isCreator: true,
            signatureRequired: true,
            invitationStatus: "SIGNED",
            authenticationLevel: "ACCOUNT_SESSION",
            joinedAt: new Date(Date.now() - 8 * 86_400_000),
          },
          {
            userId: tunde.id,
            fullName: tunde.fullName,
            email: tunde.email,
            role: "Client",
            isCreator: false,
            signatureRequired: true,
            invitationStatus: "SIGNED",
            authenticationLevel: "EMAIL_VERIFIED",
            joinedAt: new Date(Date.now() - 6 * 86_400_000),
          },
        ],
      },
    },
    include: { parties: true },
  });

  const creatorParty = deal.parties.find((party) => party.isCreator);
  const otherParty = deal.parties.find((party) => !party.isCreator);

  const draftBytes = await makePdf(
    "Service agreement - Brand brochure design",
    [
      "Reference: DR-2026-DEMO02",
      "Version: 1",
      "",
      "Service provider: Adaeze Okafor",
      "Client: Tunde Balogun",
      "",
      "Scope: Six-page brand brochure design and print-ready files.",
      "Fee: NGN 150,000",
      "Deadline: 5 November 2026",
      "Revisions: Two rounds included.",
    ],
    "EXECUTED",
  );
  const draftHash = sha256(draftBytes);
  const draftKey = `deals/${deal.id}/v1/draft-${draftHash.slice(0, 12)}.pdf`;
  await saveFile(draftKey, draftBytes);
  const draft = await prisma.dealDocument.create({
    data: {
      dealId: deal.id,
      versionNumber: 1,
      documentType: "draft",
      storageKey: draftKey,
      originalName: "service-agreement-demo.pdf",
      mimeType: "application/pdf",
      fileSize: draftBytes.length,
      sha256: draftHash,
      createdBy: ada.id,
    },
  });

  const executedBytes = await makePdf(
    "Executed service agreement - Brand brochure design",
    [
      "Reference: DR-2026-DEMO02",
      "Version: 1",
      "",
      "Signed by Adaeze Okafor (Service provider)",
      "Signed by Tunde Balogun (Client)",
      "",
      "Document SHA-256: " + draftHash,
    ],
    "EXECUTED",
  );
  const executedHash = sha256(executedBytes);
  const executedKey = `deals/${deal.id}/v1/executed-${executedHash.slice(0, 12)}.pdf`;
  await saveFile(executedKey, executedBytes);
  const executedDoc = await prisma.dealDocument.create({
    data: {
      dealId: deal.id,
      versionNumber: 1,
      documentType: "execution_copy",
      storageKey: executedKey,
      originalName: "executed-DR-2026-DEMO02.pdf",
      mimeType: "application/pdf",
      fileSize: executedBytes.length,
      sha256: executedHash,
      createdBy: ada.id,
      isFinal: true,
    },
  });

  const certificateBytes = await makePdf(
    "Verification certificate - Brand brochure design",
    [
      "Reference: DR-2026-DEMO02",
      "Seal serial: DRS-2026-DEMO00002",
      "Executed version: 1",
      "Executed document SHA-256:",
      executedHash,
      "",
      "Verification: /verify/demo-verify-2026",
      "",
      "This certificate confirms the platform record. It is not an NBA,",
      "notarial or government certificate.",
    ],
    "PLATFORM RECORD",
  );
  const certificateHash = sha256(certificateBytes);
  const certificateKey = `deals/${deal.id}/v1/certificate-${certificateHash.slice(0, 12)}.pdf`;
  await saveFile(certificateKey, certificateBytes);
  await prisma.dealDocument.create({
    data: {
      dealId: deal.id,
      versionNumber: 1,
      documentType: "certificate",
      storageKey: certificateKey,
      originalName: "certificate-DR-2026-DEMO02.pdf",
      mimeType: "application/pdf",
      fileSize: certificateBytes.length,
      sha256: certificateHash,
      createdBy: ada.id,
      isFinal: true,
    },
  });

  const signedAt = new Date(Date.now() - 3 * 86_400_000);
  await prisma.signature.createMany({
    data: [
      {
        dealId: deal.id,
        documentId: draft.id,
        partyId: creatorParty.id,
        signatureType: "typed",
        signerName: creatorParty.fullName,
        authenticationMethod: "ACCOUNT_SESSION",
        signedAt,
        consentTextVersion: CONSENT_TEXT_VERSION,
        documentSha256: draftHash,
      },
      {
        dealId: deal.id,
        documentId: draft.id,
        partyId: otherParty.id,
        signatureType: "typed",
        signerName: otherParty.fullName,
        authenticationMethod: "EMAIL_VERIFIED",
        signedAt: new Date(signedAt.getTime() + 3600_000),
        consentTextVersion: CONSENT_TEXT_VERSION,
        documentSha256: draftHash,
      },
    ],
  });

  await prisma.dealSeal.create({
    data: {
      dealId: deal.id,
      documentId: executedDoc.id,
      serialNumber: "DRS-2026-DEMO00002",
      verificationToken: "demo-verify-2026",
      status: "ACTIVE",
      issuedAt: new Date(Date.now() - 2 * 86_400_000),
    },
  });

  await appendEvent(deal.id, "DEAL_CREATED", "Deal created from Service agreement.", creatorParty?.id, {
    reference: deal.reference,
    templateSlug: "service-agreement",
  });
  await appendEvent(deal.id, "DOCUMENT_VERSION_CREATED", "Document version 1 generated.", creatorParty?.id, {
    version: 1,
    sha256: draftHash,
    documentType: "draft",
  });
  await appendEvent(deal.id, "PARTY_INVITED", "Invitation link created for the other party.", creatorParty?.id);
  await appendEvent(deal.id, "CONTACT_VERIFIED", "Email control was verified with a one-time code.", otherParty?.id, {
    method: "email",
  });
  await appendEvent(deal.id, "PARTY_SIGNED", `${creatorParty?.fullName} signed version 1.`, creatorParty?.id, {
    documentId: draft.id,
    documentSha256: draftHash,
    authenticationMethod: "ACCOUNT_SESSION",
    signatureType: "typed",
  });
  await appendEvent(deal.id, "PARTY_SIGNED", `${otherParty?.fullName} signed version 1.`, otherParty?.id, {
    documentId: draft.id,
    documentSha256: draftHash,
    authenticationMethod: "EMAIL_VERIFIED",
    signatureType: "typed",
  });
  await appendEvent(deal.id, "DEAL_EXECUTED", "All required parties signed the same document version. The executed record is locked.", null, {
    executedSha256: executedHash,
    certificateSha256: certificateHash,
    sealSerial: "DRS-2026-DEMO00002",
    verificationToken: "demo-verify-2026",
    version: 1,
  });

  await prisma.paymentRecord.create({
    data: {
      dealId: deal.id,
      recordedByPartyId: otherParty.id,
      amount: 75000,
      currency: "NGN",
      paymentDate: new Date(Date.now() - 86_400_000),
      paymentMethod: "Bank transfer",
      reference: "DEMO-TRF-001",
      verificationStatus: "UNVERIFIED",
      notes: "First half paid. Demo data only.",
    },
  });
  await appendEvent(deal.id, "PAYMENT_RECORDED", "Payment of 75,000 NGN recorded by Tunde Balogun.", otherParty?.id, {
    amount: 75000,
    method: "Bank transfer",
    reference: "DEMO-TRF-001",
  });

  return { id: deal.id, created: true, documentId: draft.id };
}

async function main() {
  const templateCount = await seedTemplates();
  const { admin, ada, tunde } = await seedUsers();
  const open = await seedOpenDeal(ada, tunde);
  const executed = await seedExecutedDeal(ada, tunde);
  const invited = await seedDemoInvitation();

  console.log(`Seeded ${templateCount} templates.`);
  console.log(`Admin: ${admin.email} / DealrecAdmin123!`);
  console.log(`Demo user: ${ada.email} / Dealrec123!`);
  console.log(`Demo user: ${tunde.email} / Dealrec123!`);
  console.log(`Deal ${reference("DR-2026-DEMO01")}: ${open.created ? "created" : "already exists"}`);
  console.log(`Deal ${reference("DR-2026-DEMO02")}: ${executed.created ? "created" : "already exists"}`);
  console.log(`Public verification demo: /verify/demo-verify-2026`);
  if (invited) console.log(`Invitation demo: /invite/demo-invite-2026`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
