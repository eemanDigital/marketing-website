import type { Prisma } from "@prisma/client";
import { db } from "./db";
import {
  AUTH_LEVEL_LABEL,
  DEAL_STATUS,
  DOCUMENT_TYPE,
  EVENT,
  INVITATION_DAYS,
  INVITATION_STATUS,
  OBLIGATION_STATUS,
  SEAL_STATUS,
} from "./constants";
import { appendEvent } from "./events";
import { getFile, putFile } from "./storage";
import { randomReference, randomSerial, randomToken, sha256 } from "./crypto";
import { buildAgreementContent } from "./agreement";
import {
  buildAgreementPdf,
  buildCertificatePdf,
  buildUploadedExecutionPdf,
  type PartyForPdf,
} from "./pdf";
import { formatDate, formatNaira, safeJsonParse } from "./utils";
import { getTemplate } from "./templates";

const dealInclude = {
  creator: true,
  parties: true,
  documents: { orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }] },
  signatures: { include: { party: true }, orderBy: { signedAt: "asc" } },
  events: { orderBy: { sequence: "asc" } },
  comments: {
    include: { authorParty: true, attachment: true },
    orderBy: { createdAt: "asc" },
  },
  payments: {
    include: { recordedBy: true, receipt: true },
    orderBy: { paymentDate: "desc" },
  },
  obligations: { orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }] },
  invitations: { orderBy: { createdAt: "desc" } },
  seals: { orderBy: { issuedAt: "desc" } },
} satisfies Prisma.DealInclude;

export type FullDeal = Prisma.DealGetPayload<{ include: typeof dealInclude }>;

export const CLOSED = [DEAL_STATUS.COMPLETED, DEAL_STATUS.CANCELLED, DEAL_STATUS.VOIDED, DEAL_STATUS.SUPERSEDED];

export async function getFullDeal(dealId: string) {
  return db.deal.findUnique({ where: { id: dealId }, include: dealInclude });
}

export async function getDealAccess(dealId: string) {
  const { getSessionUser } = await import("./auth");
  const user = await getSessionUser();
  if (!user) return null;
  const deal = await getFullDeal(dealId);
  if (!deal) return null;
  const party = deal.parties.find((item) => item.userId === user.id);
  if (!party && deal.creatorId !== user.id && !user.isAdmin) return null;
  return { user, deal, party: party ?? null, isCreator: deal.creatorId === user.id };
}

export function currentDocument(deal: FullDeal) {
  return (
    deal.documents.find(
      (document) =>
        document.versionNumber === deal.currentVersion &&
        (document.documentType === DOCUMENT_TYPE.DRAFT ||
          document.documentType === DOCUMENT_TYPE.UPLOADED_ORIGINAL),
    ) ?? null
  );
}

export function executedDocument(deal: FullDeal) {
  return deal.documents.find((document) => document.documentType === DOCUMENT_TYPE.EXECUTION_COPY) ?? null;
}

export function certificateDocument(deal: FullDeal) {
  return deal.documents.find((document) => document.documentType === DOCUMENT_TYPE.CERTIFICATE) ?? null;
}

export function currentSignatures(deal: FullDeal) {
  const document = currentDocument(deal);
  if (!document) return [];
  return deal.signatures.filter((signature) => signature.documentId === document.id);
}

export function requiredParties(deal: FullDeal) {
  return deal.parties.filter((party) => party.signatureRequired);
}

export function signedPartyIds(deal: FullDeal) {
  return new Set(currentSignatures(deal).map((signature) => signature.partyId));
}

export function allRequiredSigned(deal: FullDeal) {
  const signed = signedPartyIds(deal);
  return requiredParties(deal).every((party) => signed.has(party.id));
}

export function partyHasSigned(deal: FullDeal, partyId: string) {
  return signedPartyIds(deal).has(partyId);
}

export function canSign(deal: FullDeal) {
  return !CLOSED.includes(deal.status as never) && deal.status !== DEAL_STATUS.EXECUTED;
}

export async function uniqueReference() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const reference = randomReference();
    const exists = await db.deal.findUnique({ where: { reference }, select: { id: true } });
    if (!exists) return reference;
  }
  throw new Error("Could not allocate a reference. Please try again.");
}

export function verificationUrl(verificationToken: string) {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/verify/${verificationToken}`;
}

export type PaymentSummary = {
  total: number | null;
  paid: number;
  outstanding: number | null;
  status: "NOT_SET" | "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID";
  nextDue: Date | null;
  overdue: number;
  dueSoon: number;
};

export function activeInvitation(deal: FullDeal) {
  const now = Date.now();
  return deal.invitations.find((item) => !item.revokedAt && item.expiresAt.getTime() > now) ?? null;
}

export function isObligationOverdue(obligation: { status: string; dueAt: Date | null }) {
  return obligation.status === OBLIGATION_STATUS.PENDING && Boolean(obligation.dueAt && obligation.dueAt.getTime() < Date.now());
}

export function invitationProblem(invitation: {
  revokedAt: Date | null;
  expiresAt: Date;
  deal: { status: string };
}) {
  if (invitation.revokedAt) return "This invitation link has been revoked.";
  if (invitation.expiresAt.getTime() < Date.now()) return "This invitation link has expired.";
  if ([DEAL_STATUS.CANCELLED, DEAL_STATUS.VOIDED].includes(invitation.deal.status as never)) {
    return "This deal is no longer open.";
  }
  return null;
}

export function paymentSummary(deal: FullDeal): PaymentSummary {
  const paid = deal.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const total = deal.totalAmount && deal.totalAmount > 0 ? deal.totalAmount : null;
  const outstanding = total === null ? null : Math.max(total - paid, 0);
  const status =
    total === null
      ? "NOT_SET"
      : paid === 0
        ? "UNPAID"
        : outstanding === 0
          ? "PAID"
          : paid > total
            ? "OVERPAID"
            : "PARTIALLY_PAID";

  const pending = deal.obligations.filter(
    (obligation) => obligation.status === OBLIGATION_STATUS.PENDING && obligation.dueAt,
  );
  const now = Date.now();
  const sevenDays = now + 7 * 86_400_000;
  const overdue = pending.filter((item) => item.dueAt!.getTime() < now).length;
  const dueSoon = pending.filter((item) => {
    const time = item.dueAt!.getTime();
    return time >= now && time <= sevenDays;
  }).length;
  const nextDue =
    pending
      .map((item) => item.dueAt!)
      .filter((date) => date.getTime() >= now)
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

  return { total, paid, outstanding, status, nextDue, overdue, dueSoon };
}

export function statusTone(status: string) {
  switch (status) {
    case DEAL_STATUS.EXECUTED:
    case DEAL_STATUS.ACTIVE:
    case DEAL_STATUS.COMPLETED:
      return "success";
    case DEAL_STATUS.OVERDUE:
    case DEAL_STATUS.CHANGE_REQUESTED:
    case DEAL_STATUS.VOIDED:
    case DEAL_STATUS.CANCELLED:
      return "danger";
    case DEAL_STATUS.AWAITING_CREATOR_SIGNATURE:
    case DEAL_STATUS.AWAITING_OTHER_SIGNATURES:
    case DEAL_STATUS.AWAITING_COUNTERPARTY:
    case DEAL_STATUS.UNDER_REVIEW:
      return "warning";
    default:
      return "neutral";
  }
}

export async function createInvitation(input: {
  dealId: string;
  partyId: string;
  actorPartyId?: string;
}) {
  const token = randomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + INVITATION_DAYS * 86_400_000);

  await db.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: { partyId: input.partyId, revokedAt: null },
      data: { revokedAt: new Date(), status: "REVOKED" },
    });
    const invitation = await tx.invitation.create({
      data: {
        dealId: input.dealId,
        partyId: input.partyId,
        tokenHash,
        status: INVITATION_STATUS.SENT,
        expiresAt,
      },
    });
    await tx.dealParty.update({
      where: { id: input.partyId },
      data: { invitationStatus: INVITATION_STATUS.SENT },
    });
    await tx.deal.update({
      where: { id: input.dealId },
      data: {
        status: DEAL_STATUS.AWAITING_COUNTERPARTY,
        updatedAt: new Date(),
      },
    });
    await appendEvent(tx, {
      dealId: input.dealId,
      eventType: EVENT.PARTY_INVITED,
      description: "Invitation link created for the other party.",
      actorPartyId: input.actorPartyId,
      metadata: { invitationId: invitation.id, expiresAt: expiresAt.toISOString() },
    });
  });

  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return { token, url: `${base}/invite/${token}`, expiresAt };
}

export async function findInvitation(token: string) {
  if (!token) return null;
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      party: true,
      deal: {
        include: {
          creator: true,
          parties: true,
          documents: { orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }] },
          signatures: { include: { party: true } },
          obligations: true,
          payments: true,
        },
      },
    },
  });
  if (!invitation) return null;
  return invitation;
}

export async function createVersion(input: {
  deal: FullDeal;
  actorUserId: string;
  actorPartyId: string;
  values?: Record<string, string>;
  uploadedBytes?: Buffer;
  uploadedMime?: string;
  uploadedName?: string;
  changeSummary?: string;
}) {
  const { deal } = input;
  const nextVersion = deal.currentVersion + 1;
  const values = input.values ?? safeJsonParse<Record<string, string>>(deal.termsJson, {});

  let bytes: Uint8Array;
  let mimeType = "application/pdf";
  let originalName = `agreement-v${nextVersion}.pdf`;
  let documentType: string = DOCUMENT_TYPE.DRAFT;

  if (input.uploadedBytes) {
    bytes = input.uploadedBytes;
    mimeType = input.uploadedMime ?? "application/pdf";
    originalName = input.uploadedName ?? originalName;
    documentType = DOCUMENT_TYPE.UPLOADED_ORIGINAL;
  } else {
    const content = buildAgreementContent(
      { ...deal, termsJson: JSON.stringify(values), templateSlug: deal.templateSlug },
      deal.parties,
    );
    bytes = await buildAgreementPdf({
      reference: deal.reference,
      title: deal.title,
      versionNumber: nextVersion,
      content,
      parties: deal.parties.map((party) => ({ role: party.role, name: party.fullName })),
      watermark: "DRAFT - NOT YET SIGNED",
      executed: false,
    });
  }

  const buffer = Buffer.from(bytes);
  const hash = sha256(buffer);
  const storageKey = `deals/${deal.id}/v${nextVersion}/${documentType}-${hash.slice(0, 12)}.pdf`;
  await putFile(storageKey, buffer);

  const document = await db.$transaction(async (tx) => {
    const created = await tx.dealDocument.create({
      data: {
        dealId: deal.id,
        versionNumber: nextVersion,
        documentType,
        storageKey,
        originalName,
        mimeType,
        fileSize: buffer.length,
        sha256: hash,
        createdBy: input.actorUserId,
        changeSummary: input.changeSummary ?? null,
      },
    });
    await tx.deal.update({
      where: { id: deal.id },
      data: {
        currentVersion: nextVersion,
        termsJson: JSON.stringify(values),
        status: DEAL_STATUS.AWAITING_COUNTERPARTY,
        updatedAt: new Date(),
      },
    });
    await tx.dealParty.updateMany({
      where: { dealId: deal.id, isCreator: false },
      data: {
        invitationStatus: INVITATION_STATUS.SENT,
        authenticationLevel: "NONE",
      },
    });
    await appendEvent(tx, {
      dealId: deal.id,
      eventType: EVENT.DOCUMENT_VERSION_CREATED,
      description: `Document version ${nextVersion} generated.`,
      actorPartyId: input.actorPartyId,
      metadata: { version: nextVersion, sha256: hash, documentType, changeSummary: input.changeSummary },
    });
    return created;
  });

  return { document, bytes: buffer, hash, version: nextVersion, values };
}

export async function createDealRecord(input: {
  userId: string;
  userFullName: string;
  userEmail: string;
  title: string;
  dealType: string;
  templateSlug?: string | null;
  templateVersion?: string | null;
  values: Record<string, string>;
  totalAmount: number | null;
  counterpartyName: string;
  counterpartyEmail: string;
  counterpartyPhone: string;
  creatorRole: string;
  counterpartyRole: string;
  uploaded?: { bytes: Buffer; mimeType: string; fileName: string };
}) {
  const reference = await uniqueReference();
  const template = getTemplate(input.templateSlug);

  return db.$transaction(async (tx) => {
    const deal = await tx.deal.create({
      data: {
        reference,
        title: input.title,
        dealType: input.dealType,
        creatorId: input.userId,
        status: DEAL_STATUS.DRAFT,
        totalAmount: input.totalAmount,
        termsJson: JSON.stringify(input.values),
        templateSlug: input.templateSlug ?? null,
        templateVersion: input.templateVersion ?? template?.version ?? null,
        parties: {
          create: [
            {
              userId: input.userId,
              fullName: input.userFullName,
              email: input.userEmail,
              role: input.creatorRole,
              isCreator: true,
              signatureRequired: true,
              invitationStatus: INVITATION_STATUS.ACCEPTED,
              authenticationLevel: "ACCOUNT_SESSION",
              joinedAt: new Date(),
            },
            {
              fullName: input.counterpartyName,
              email: input.counterpartyEmail || null,
              phoneNumber: input.counterpartyPhone || null,
              role: input.counterpartyRole,
              isCreator: false,
              signatureRequired: true,
              invitationStatus: INVITATION_STATUS.PENDING,
              authenticationLevel: "NONE",
            },
          ],
        },
      },
      include: { parties: true },
    });

    await appendEvent(tx, {
      dealId: deal.id,
      eventType: EVENT.DEAL_CREATED,
      description: `Deal created from ${template?.name ?? "uploaded document"}.`,
      actorPartyId: deal.parties.find((party) => party.isCreator)?.id,
      metadata: { reference, templateSlug: input.templateSlug ?? null },
    });

    return deal;
  });
}

export async function generateExecutionArtifacts(dealId: string) {
  const deal = await getFullDeal(dealId);
  if (!deal) return null;

  const versionDocument = currentDocument(deal);
  if (!versionDocument) return null;

  const existingExecution = executedDocument(deal);
  const existingSeal = deal.seals[0] ?? null;
  const existingCertificate = certificateDocument(deal);
  if (existingExecution && existingSeal && existingCertificate) {
    return { document: existingExecution, certificate: existingCertificate, seal: existingSeal };
  }

  const sealSerial = existingSeal?.serialNumber ?? randomSerial();
  const verificationToken = existingSeal?.verificationToken ?? randomToken(24);
  const url = verificationUrl(verificationToken);
  const executedAt = deal.executedAt ?? new Date();
  const sigs = deal.signatures.filter((signature) => signature.documentId === versionDocument.id);

  let executedBuffer: Buffer;
  let executedHash: string;
  let executedKey: string;

  if (existingExecution) {
    executedBuffer = await getFile(existingExecution.storageKey);
    executedHash = existingExecution.sha256;
    executedKey = existingExecution.storageKey;
  } else {
    const partiesByPdf: PartyForPdf[] = [];
    for (const party of deal.parties) {
      const signature = sigs.find((item) => item.partyId === party.id);
      let signaturePng: Buffer | null = null;
      if (signature?.signatureAssetKey) {
        try {
          signaturePng = await getFile(signature.signatureAssetKey);
        } catch {
          signaturePng = null;
        }
      }
      partiesByPdf.push({
        role: party.role,
        name: party.fullName,
        signerName: signature?.signerName,
        signedAt: signature?.signedAt ?? null,
        authLabel: signature ? AUTH_LEVEL_LABEL[signature.authenticationMethod] ?? signature.authenticationMethod : undefined,
        signaturePng,
      });
    }

    let executedBytes: Uint8Array;
    if (versionDocument.documentType === DOCUMENT_TYPE.UPLOADED_ORIGINAL) {
      const original = await getFile(versionDocument.storageKey);
      executedBytes = await buildUploadedExecutionPdf({
        originalBytes: original,
        reference: deal.reference,
        title: deal.title,
        versionNumber: versionDocument.versionNumber,
        parties: partiesByPdf,
        watermark: "EXECUTED",
        executed: true,
      });
    } else {
      const content = buildAgreementContent(deal, deal.parties);
      executedBytes = await buildAgreementPdf({
        reference: deal.reference,
        title: deal.title,
        versionNumber: versionDocument.versionNumber,
        content,
        parties: partiesByPdf,
        watermark: "EXECUTED",
        executed: true,
        generatedAt: new Date(),
      });
    }

    executedBuffer = Buffer.from(executedBytes);
    executedHash = sha256(executedBuffer);
    executedKey = `deals/${deal.id}/v${versionDocument.versionNumber}/executed-${executedHash.slice(0, 12)}.pdf`;
    await putFile(executedKey, executedBuffer);
  }

  const certificateBytes = await buildCertificatePdf({
    reference: deal.reference,
    title: deal.title,
    sealSerial,
    verificationUrl: url,
    documentHash: executedHash,
    documentVersion: versionDocument.versionNumber,
    executedAt,
    issuedAt: new Date(),
    parties: deal.parties.map((party) => ({ role: party.role, name: party.fullName })),
    signers: sigs.map((signature) => ({
      role: signature.party.role,
      name: signature.party.fullName,
      signerName: signature.signerName,
      authLabel: AUTH_LEVEL_LABEL[signature.authenticationMethod] ?? signature.authenticationMethod,
      signedAt: signature.signedAt,
    })),
  });
  const certificateBuffer = Buffer.from(certificateBytes);
  const certificateHash = sha256(certificateBuffer);
  const certificateKey = `deals/${deal.id}/v${versionDocument.versionNumber}/certificate-${certificateHash.slice(0, 12)}.pdf`;
  await putFile(certificateKey, certificateBuffer);

  const result = await db.$transaction(async (tx) => {
    const executionDocument =
      existingExecution ??
      (await tx.dealDocument.create({
        data: {
          dealId: deal.id,
          versionNumber: versionDocument.versionNumber,
          documentType: DOCUMENT_TYPE.EXECUTION_COPY,
          storageKey: executedKey,
          originalName: `executed-${deal.reference}.pdf`,
          mimeType: "application/pdf",
          fileSize: executedBuffer.length,
          sha256: executedHash,
          createdBy: deal.creatorId,
          isFinal: true,
        },
      }));

    const certificate = existingCertificate
      ? await tx.dealDocument.update({
          where: { id: existingCertificate.id },
          data: {
            versionNumber: versionDocument.versionNumber,
            storageKey: certificateKey,
            originalName: `certificate-${deal.reference}.pdf`,
            fileSize: certificateBuffer.length,
            sha256: certificateHash,
            isFinal: true,
          },
        })
      : await tx.dealDocument.create({
          data: {
            dealId: deal.id,
            versionNumber: versionDocument.versionNumber,
            documentType: DOCUMENT_TYPE.CERTIFICATE,
            storageKey: certificateKey,
            originalName: `certificate-${deal.reference}.pdf`,
            mimeType: "application/pdf",
            fileSize: certificateBuffer.length,
            sha256: certificateHash,
            createdBy: deal.creatorId,
            isFinal: true,
          },
        });

    const seal = existingSeal
      ? await tx.dealSeal.update({
          where: { id: existingSeal.id },
          data: { documentId: executionDocument.id, status: SEAL_STATUS.ACTIVE },
        })
      : await tx.dealSeal.create({
          data: {
            dealId: deal.id,
            documentId: executionDocument.id,
            serialNumber: sealSerial,
            verificationToken,
            status: SEAL_STATUS.ACTIVE,
          },
        });

    if (deal.status !== DEAL_STATUS.EXECUTED) {
      await tx.deal.update({
        where: { id: deal.id },
        data: { status: DEAL_STATUS.EXECUTED, executedAt: new Date() },
      });
    }

    let insertedExecutionEvent = false;
    if (!deal.events.some((event) => event.eventType === EVENT.DEAL_EXECUTED)) {
      await appendEvent(tx, {
        dealId: deal.id,
        eventType: EVENT.DEAL_EXECUTED,
        description: "All required parties signed the same document version. The executed record is locked.",
        metadata: {
          executedSha256: executedHash,
          certificateSha256: certificateHash,
          sealSerial,
          verificationToken,
          version: versionDocument.versionNumber,
        },
      });
      insertedExecutionEvent = true;
    }

    return { document: executionDocument, certificate, seal, executedHash, insertedExecutionEvent };
  });

  if (result.insertedExecutionEvent) {
    const { notifyDealParties } = await import("./notifications");
    await notifyDealParties(deal.id, {
      type: "DEAL_EXECUTED",
      title: "Deal fully signed",
      body: `All parties signed "${deal.title}". The executed record and verification certificate are available.`,
      dealId: deal.id,
      email: true,
    });
  }

  return {
    document: result.document,
    certificate: result.certificate,
    seal: result.seal,
    executedHash: result.executedHash,
  };
}

export async function executeDealIfReady(dealId: string) {
  const deal = await getFullDeal(dealId);
  if (!deal) return null;
  if (!allRequiredSigned(deal)) return null;
  if (deal.status === DEAL_STATUS.VOIDED || deal.status === DEAL_STATUS.CANCELLED) return null;

  const claim = await db.deal.updateMany({
    where: {
      id: dealId,
      status: { notIn: [DEAL_STATUS.EXECUTED, DEAL_STATUS.VOIDED, DEAL_STATUS.CANCELLED, DEAL_STATUS.SUPERSEDED] },
    },
    data: { status: DEAL_STATUS.EXECUTED, executedAt: new Date() },
  });

  if (claim.count === 0 && deal.seals.length > 0 && executedDocument(deal)) {
    return null;
  }

  try {
    return await generateExecutionArtifacts(dealId);
  } catch (error) {
    console.error("[dealrec] execution artifact generation failed", error);
    return null;
  }
}

export function dealSummaryLine(deal: FullDeal) {
  const summary = paymentSummary(deal);
  const amount = deal.totalAmount ? formatNaira(deal.totalAmount) : "Amount not set";
  const due = summary.nextDue ? `Next due ${formatDate(summary.nextDue)}` : "No upcoming due date";
  return { amount, due, outstanding: summary.outstanding };
}

export function workspaceProgress(deal: FullDeal) {
  const signed = signedPartyIds(deal);
  const required = requiredParties(deal);
  return {
    signed: required.filter((party) => signed.has(party.id)).length,
    required: required.length,
  };
}

export function safeValues(deal: FullDeal) {
  return safeJsonParse<Record<string, string>>(deal.termsJson, {});
}

export async function recordSignature(input: {
  dealId: string;
  partyId: string;
  documentId: string;
  signerName: string;
  signatureType: string;
  authenticationMethod: string;
  consentTextVersion: string;
  ipAddress: string | null;
  userAgent: string | null;
  signatureAssetKey?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const deal = await tx.deal.findUnique({
      where: { id: input.dealId },
      include: { parties: true, documents: true, signatures: true },
    });
    if (!deal) throw new Error("Deal not found.");
    if (CLOSED.includes(deal.status as (typeof CLOSED)[number]) || deal.status === DEAL_STATUS.EXECUTED) {
      throw new Error("This deal is no longer open for signing.");
    }

    const document = deal.documents.find((item) => item.id === input.documentId);
    if (!document) throw new Error("The document version was not found.");
    if (document.versionNumber !== deal.currentVersion) {
      throw new Error("A newer version exists. Please review the latest version before signing.");
    }

    const party = deal.parties.find((item) => item.id === input.partyId);
    if (!party) throw new Error("Party not found.");
    if (!party.signatureRequired) throw new Error("This party is not required to sign.");

    const existing = await tx.signature.findUnique({
      where: { documentId_partyId: { documentId: document.id, partyId: party.id } },
    });
    if (existing) throw new Error("You have already signed this document version.");

    const signature = await tx.signature.create({
      data: {
        dealId: deal.id,
        documentId: document.id,
        partyId: party.id,
        signatureType: input.signatureType,
        signerName: input.signerName,
        authenticationMethod: input.authenticationMethod,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        consentTextVersion: input.consentTextVersion,
        signatureAssetKey: input.signatureAssetKey ?? null,
        documentSha256: document.sha256,
      },
    });

    await tx.dealParty.update({
      where: { id: party.id },
      data: {
        invitationStatus: party.isCreator ? INVITATION_STATUS.ACCEPTED : INVITATION_STATUS.SIGNED,
        joinedAt: party.joinedAt ?? new Date(),
      },
    });

    const signatures = [...deal.signatures, signature];
    const required = deal.parties.filter((item) => item.signatureRequired);
    const unsigned = required.filter(
      (item) => !signatures.some((sig) => sig.partyId === item.id && sig.documentId === document.id),
    );
    const nextStatus =
      unsigned.length === 0
        ? DEAL_STATUS.EXECUTED
        : unsigned.some((item) => item.isCreator)
          ? DEAL_STATUS.AWAITING_CREATOR_SIGNATURE
          : DEAL_STATUS.AWAITING_OTHER_SIGNATURES;

    await tx.deal.update({
      where: { id: deal.id },
      data: { status: nextStatus, updatedAt: new Date() },
    });

    await appendEvent(tx, {
      dealId: deal.id,
      eventType: EVENT.SIGNATURE_INTENT_CONFIRMED,
      description: `${party.fullName} confirmed intent to sign version ${document.versionNumber}.`,
      actorPartyId: party.id,
      metadata: {
        documentId: document.id,
        documentSha256: document.sha256,
        consentTextVersion: input.consentTextVersion,
      },
    });

    await appendEvent(tx, {
      dealId: deal.id,
      eventType: EVENT.PARTY_SIGNED,
      description: `${party.fullName} signed version ${document.versionNumber}.`,
      actorPartyId: party.id,
      metadata: {
        signatureId: signature.id,
        documentId: document.id,
        documentSha256: document.sha256,
        authenticationMethod: input.authenticationMethod,
        signatureType: input.signatureType,
      },
    });

    return { allSigned: unsigned.length === 0, signature, status: nextStatus, party };
  });
}
