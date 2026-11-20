import { db } from "./db";
import { sha256 } from "./crypto";
import { getFile } from "./storage";
import {
  AUTH_LEVEL_LABEL,
  DOCUMENT_TYPE,
  EVENT,
  EVENT_LABEL,
  OBLIGATION_STATUS,
  WITNESS_STATUS,
} from "./constants";
import {
  executedDocument,
  certificateDocument,
  getFullDeal,
  verificationUrl,
} from "./deals";
import { createZip, type ZipEntry } from "./zip";
import { appendEvent } from "./events";
import { formatDateTime, formatNaira } from "./utils";
import { buildEvidenceRecordPdf, type EvidenceRecordSection } from "./pdf";

export async function buildEvidencePack(dealId: string) {
  const deal = await getFullDeal(dealId);
  if (!deal) throw new Error("Deal not found.");

  const executed = executedDocument(deal);
  const certificate = certificateDocument(deal);
  const seal = deal.seals[0];
  if (!executed || !certificate || !seal) {
    throw new Error("The executed agreement, certificate or seal is not ready.");
  }

  const files: ZipEntry[] = [];
  const manifestRows: string[] = [];
  const manifestFiles: { name: string; sha256: string; bytes: number }[] = [];

  async function addFile(name: string, data: Buffer) {
    const hash = sha256(data);
    files.push({ name, data });
    manifestFiles.push({ name, sha256: hash, bytes: data.length });
    manifestRows.push(`${hash}  ${String(data.length).padStart(8, " ")}  ${name}`);
  }

  const agreementBytes = await getFile(executed.storageKey);
  const certificateBytes = await getFile(certificate.storageKey);
  await addFile("agreement.pdf", agreementBytes);
  await addFile("certificate.pdf", certificateBytes);

  const partyName = (partyId: string | null | undefined) =>
    deal.parties.find((party) => party.id === partyId)?.fullName ?? "";

  const commentItems = deal.comments.map((comment) => ({
    title: `Comment by ${comment.authorParty.fullName} · ${comment.createdAt.toISOString()}`,
    fields: [
      {
        label: "Record state",
        value: comment.retractedAt
          ? "RETRACTED (text preserved)"
          : comment.editedAt
            ? "EDITED"
            : "ORIGINAL",
      },
      { label: "Author", value: comment.authorParty.fullName },
      { label: "Kind", value: comment.kind },
      { label: "Created (UTC)", value: comment.createdAt.toISOString() },
      { label: "Message", value: comment.message },
      { label: "Attachment", value: comment.attachment?.originalName ?? "" },
      { label: "Revision", value: String(comment.revision) },
      { label: "Edited (UTC)", value: comment.editedAt?.toISOString() ?? "" },
      { label: "Edited by", value: partyName(comment.editedByPartyId) },
      { label: "Retracted (UTC)", value: comment.retractedAt?.toISOString() ?? "" },
      { label: "Retracted by", value: partyName(comment.retractedByPartyId) },
      { label: "Retraction reason", value: comment.retractionReason ?? "" },
    ],
  }));

  const paymentItems = deal.payments.map((payment) => ({
    title: `Payment · ${formatNaira(payment.amount)} · ${payment.paymentDate.toISOString()}`,
    fields: [
      {
        label: "Record state",
        value: payment.voidedAt ? "VOIDED (record preserved)" : payment.lastEditedAt ? "EDITED" : "ORIGINAL",
      },
      { label: "Payment date", value: payment.paymentDate.toISOString() },
      { label: "Amount", value: formatNaira(payment.amount) },
      { label: "Method", value: payment.paymentMethod },
      { label: "Reference", value: payment.reference ?? "" },
      { label: "Recorded by", value: payment.recordedBy.fullName },
      { label: "Verification", value: payment.verificationStatus },
      { label: "Notes", value: payment.notes ?? "" },
      { label: "Receipt", value: payment.receipt?.originalName ?? "" },
      { label: "Revision", value: String(payment.revision) },
      { label: "Edited (UTC)", value: payment.lastEditedAt?.toISOString() ?? "" },
      { label: "Edited by", value: partyName(payment.lastEditedByPartyId) },
      { label: "Voided (UTC)", value: payment.voidedAt?.toISOString() ?? "" },
      { label: "Voided by", value: partyName(payment.voidedByPartyId) },
      { label: "Void reason", value: payment.voidReason ?? "" },
    ],
  }));

  const obligationItems = deal.obligations.map((obligation) => ({
    title: `Obligation · ${obligation.title}`,
    fields: [
      {
        label: "Record state",
        value: obligation.cancelledAt
          ? "CANCELLED (record preserved)"
          : obligation.lastEditedAt
            ? "EDITED"
            : "ORIGINAL",
      },
      { label: "Title", value: obligation.title },
      { label: "Kind", value: obligation.kind },
      { label: "Amount", value: obligation.amount === null ? "" : formatNaira(obligation.amount) },
      { label: "Due date", value: obligation.dueAt?.toISOString() ?? "" },
      { label: "Status", value: obligation.status },
      { label: "Responsible party", value: partyName(obligation.responsiblePartyId) },
      { label: "Created by", value: partyName(obligation.createdByPartyId) },
      { label: "Revision", value: String(obligation.revision) },
      { label: "Completed (UTC)", value: obligation.completedAt?.toISOString() ?? "" },
      { label: "Cancelled (UTC)", value: obligation.cancelledAt?.toISOString() ?? "" },
      { label: "Cancelled by", value: partyName(obligation.cancelledByPartyId) },
      { label: "Cancel reason", value: obligation.cancelReason ?? "" },
    ],
  }));

  const versionWitnesses = deal.witnesses.filter(
    (witness) =>
      deal.documents.find((document) => document.id === witness.documentId)?.versionNumber ===
      executed.versionNumber,
  );

  const witnessItems = versionWitnesses.map((witness) => ({
    title: `Witness for ${partyName(witness.witnessedPartyId) || "party"} · ${witness.fullName}`,
    fields: [
      { label: "Status", value: witness.status },
      { label: "Required", value: witness.required ? "yes" : "no" },
      { label: "Email", value: witness.email ?? "" },
      { label: "Phone", value: witness.phoneNumber ?? "" },
      { label: "Address", value: witness.address ?? "" },
      { label: "Occupation", value: witness.occupation ?? "" },
      { label: "Relationship", value: witness.relationship ?? "" },
      { label: "Invited (UTC)", value: witness.createdAt.toISOString() },
      { label: "Verified (UTC)", value: witness.verifiedAt?.toISOString() ?? "" },
      { label: "Accepted (UTC)", value: witness.acceptedAt?.toISOString() ?? "" },
      { label: "Attested (UTC)", value: witness.attestedAt?.toISOString() ?? "" },
      { label: "Signer name", value: witness.signerName ?? "" },
      { label: "Authentication", value: witness.authenticationMethod ?? "" },
      { label: "Document SHA-256", value: witness.documentSha256 ?? "" },
      { label: "Revoked (UTC)", value: witness.revokedAt?.toISOString() ?? "" },
    ],
  }));

  const eventItems = deal.events.map((event) => ({
    title: `Event ${event.sequence} · ${EVENT_LABEL[event.eventType] ?? event.eventType}`,
    fields: [
      { label: "Time (UTC)", value: event.createdAt.toISOString() },
      { label: "Actor", value: partyName(event.actorPartyId) || "System" },
      { label: "Description", value: event.description },
      {
        label: "Metadata",
        value: event.metadataJson && event.metadataJson !== "{}" ? event.metadataJson : "",
      },
      { label: "Previous event hash", value: event.previousEventHash ?? "" },
      { label: "Event hash", value: event.eventHash },
    ],
  }));

  const sections: EvidenceRecordSection[] = [
    {
      title: "Comments and change requests",
      description:
        "Comments are preserved in creation order. Retracted comments remain visible with the reason for retraction.",
      items: commentItems,
      emptyText: "No comments were recorded.",
    },
    {
      title: "Payments and receipts",
      description:
        "Voided payments remain in the record with the void reason and are excluded from active payment totals.",
      items: paymentItems,
      emptyText: "No payments were recorded.",
    },
    {
      title: "Obligations",
      description: "Cancelled obligations remain in the record with the cancellation reason.",
      items: obligationItems,
      emptyText: "No obligations were recorded.",
    },
    {
      title: "Witnesses",
      description: "Witnesses listed for the executed document version.",
      items: witnessItems,
      emptyText: "No witnesses were recorded for this version.",
    },
    {
      title: "Audit trail",
      description:
        "Hash-chained events in sequence order. Each event hash covers the event details and the previous event hash.",
      items: eventItems,
      emptyText: "No events were recorded.",
    },
  ];

  const generatedAt = new Date();
  const recordPdf = await buildEvidenceRecordPdf({
    reference: deal.reference,
    title: `${deal.title} — evidence record`,
    generatedAt,
    sections,
  });
  await addFile("record.pdf", Buffer.from(recordPdf));

  for (const witness of versionWitnesses) {
    if (!witness.signatureAssetKey) continue;
    try {
      const bytes = await getFile(witness.signatureAssetKey);
      await addFile(`witness-signatures/${witness.id}.png`, bytes);
    } catch {
      // A missing witness signature should not stop the rest of the evidence pack.
    }
  }

  for (const payment of deal.payments) {
    if (!payment.receipt) continue;
    try {
      const bytes = await getFile(payment.receipt.storageKey);
      const safeName = payment.receipt.originalName?.replace(/[^a-zA-Z0-9._-]/g, "-") ?? "receipt";
      await addFile(`receipts/${payment.id}-${safeName}`, bytes);
    } catch {
      // A missing receipt should not stop the rest of the evidence pack.
    }
  }

  // (payment verification events are captured in the audit trail)

  const verificationToken = seal.verificationToken;
  const url = verificationUrl(verificationToken);
  const partiesLines = deal.parties.map((party) => `- ${party.role}: ${party.fullName}`).join("\n");
  const executedVersionDocumentIds = new Set(
    deal.documents
      .filter((document) => document.versionNumber === executed.versionNumber)
      .map((document) => document.id),
  );
  const executedSignatures = deal.signatures.filter((signature) =>
    executedVersionDocumentIds.has(signature.documentId),
  );
  const signerLines = executedSignatures
    .map(
      (signature) =>
        `- ${signature.party.role}: ${signature.signerName} | ${formatDateTime(signature.signedAt)} | ${AUTH_LEVEL_LABEL[signature.authenticationMethod] ?? signature.authenticationMethod} | document hash ${signature.documentSha256}`,
    )
    .join("\n");

  const witnessLines = versionWitnesses
    .map((witness) => {
      const witnessedParty = deal.parties.find((party) => party.id === witness.witnessedPartyId);
      if (witness.status === WITNESS_STATUS.ATTESTED) {
        return `- Witness for ${witnessedParty?.fullName ?? "party"}: ${witness.fullName}${witness.address ? ` | ${witness.address}` : ""} | ${formatDateTime(witness.attestedAt)} | ${AUTH_LEVEL_LABEL[witness.authenticationMethod ?? ""] ?? witness.authenticationMethod ?? "contact verified"} | document hash ${witness.documentSha256 ?? ""}`;
      }
      return `- Witness for ${witnessedParty?.fullName ?? "party"}: ${witness.fullName} | ${witness.status}${witness.acceptedAt ? ` | accepted ${formatDateTime(witness.acceptedAt)}` : ""}${witness.required ? " (required)" : " (optional)"}`;
    })
    .join("\n");

  const summary = `DEALREC EVIDENCE RECORD

Deal reference: ${deal.reference}
Title: ${deal.title}
Status: ${deal.status}
Executed at: ${formatDateTime(deal.executedAt)}
Document version: ${executed.versionNumber}
Executed document SHA-256: ${executed.sha256}
Certificate SHA-256: ${certificate.sha256}
Seal serial: ${seal.serialNumber}
Verification URL: ${url}

PARTIES
${partiesLines}

SIGNATORIES (executed document)
${signerLines || "- No signatures recorded"}

WITNESSES (executed document version)
${witnessLines || "- No witnesses recorded"}

FILES IN THIS PACK
${manifestRows.join("\n")}

RECORD FILES
Comments, payments, obligations, witnesses and the audit trail are recorded in record.pdf,
not spreadsheets. Spreadsheet files can be silently reordered, reformatted, altered by formulas
or used to inject formulas into other systems. The PDF is a sealed presentation of the platform
record and remains readable without spreadsheet software.

INTEGRITY AND HOW TO CHECK THIS PACK
1. Compute the SHA-256 hash of each file and compare it with manifest.txt.
2. Compute the SHA-256 hash of this ZIP file and compare it with an evidence pack fingerprint
   shown on the verification page for this deal.
3. For agreement.pdf, compare its SHA-256 with the executed document SHA-256 above, or upload it
   on the verification page.
4. For the audit trail, compare each event hash with the previous event hash in record.pdf. The
   platform also verifies the full chain internally.

LIMITATIONS
This pack is intended to preserve a clear record of the agreement and events. It is not legal advice and does not guarantee payment, performance, enforceability or admissibility in any court. A hash match shows the file is identical to the file recorded by the platform. A mismatch shows the file differs, but does not by itself prove fraud. The platform seal is not an NBA stamp or seal, notarial seal, government certification or guarantee of legal validity. This certificate is not a Section 84 Evidence Act certificate unless separately prepared through an approved legal process.

Generated: ${generatedAt.toISOString()}
`;

  await addFile("README.txt", Buffer.from(summary, "utf8"));
  await addFile("manifest.txt", Buffer.from(`${manifestRows.join("\n")}\n`, "utf8"));

  const zip = createZip(files);

  try {
    await db.$transaction(async (tx) => {
      await appendEvent(tx, {
        dealId: deal.id,
        eventType: EVENT.EVIDENCE_PACK_GENERATED,
        description: "Evidence pack generated.",
        metadata: { files: manifestFiles, zipSha256: sha256(zip) },
      });
    });
  } catch {
    // Evidence generation still succeeds if the audit write is unavailable.
  }

  return {
    zip,
    fileName: `dealrec-evidence-${deal.reference.replace(/[^a-zA-Z0-9-]/g, "")}.zip`,
    record: {
      reference: deal.reference,
      executedHash: executed.sha256,
      certificateHash: certificate.sha256,
      sealSerial: seal.serialNumber,
      verificationToken,
      status: seal.status,
      executedAt: deal.executedAt,
      signatories: executedSignatures.length,
      witnesses: versionWitnesses.length,
      eventCount: deal.events.length + 1,
      paymentCount: deal.payments.length,
      obligationCount:
        deal.obligations.length +
        deal.payments.filter(
          (p) => p.verificationStatus === "UNVERIFIED" || p.verificationStatus === "DISPUTED",
        ).length,
      obligationStatus: OBLIGATION_STATUS.PENDING,
      documentType: DOCUMENT_TYPE.EXECUTION_COPY,
      events: deal.events,
    },
  };
}
