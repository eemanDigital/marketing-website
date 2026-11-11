import { db } from "./db";
import { sha256 } from "./crypto";
import { getFile } from "./storage";
import {
  AUTH_LEVEL_LABEL,
  DOCUMENT_TYPE,
  EVENT,
  EVENT_LABEL,
  OBLIGATION_STATUS,
} from "./constants";
import {
  executedDocument,
  certificateDocument,
  getFullDeal,
  verificationUrl,
} from "./deals";
import { createZip, type ZipEntry } from "./zip";
import { appendEvent } from "./events";
import { formatDateTime } from "./utils";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function csv(rows: unknown[][]) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

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

  async function addFile(name: string, data: Buffer) {
    files.push({ name, data });
    manifestRows.push(`${sha256(data)}  ${String(data.length).padStart(8, " ")}  ${name}`);
  }

  const agreementBytes = await getFile(executed.storageKey);
  const certificateBytes = await getFile(certificate.storageKey);
  await addFile("agreement.pdf", agreementBytes);
  await addFile("certificate.pdf", certificateBytes);

  const eventsCsv = csv([
    ["sequence", "created_at_utc", "event_type", "actor_party", "description", "previous_hash", "event_hash"],
    ...deal.events.map((event) => [
      event.sequence,
      event.createdAt.toISOString(),
      event.eventType,
      deal.parties.find((party) => party.id === event.actorPartyId)?.fullName ?? "System",
      EVENT_LABEL[event.eventType] ?? event.eventType,
      event.previousEventHash ?? "",
      event.eventHash,
    ]),
  ]);
  await addFile("events.csv", Buffer.from(eventsCsv, "utf8"));

  const commentsCsv = csv([
    ["created_at_utc", "author", "kind", "message", "attachment"],
    ...deal.comments.map((comment) => [
      comment.createdAt.toISOString(),
      comment.authorParty.fullName,
      comment.kind,
      comment.message,
      comment.attachment?.originalName ?? "",
    ]),
  ]);
  await addFile("comments.csv", Buffer.from(commentsCsv, "utf8"));

  const paymentsCsv = csv([
    ["payment_date", "amount_ngn", "method", "reference", "recorded_by", "verification", "notes", "receipt"],
    ...deal.payments.map((payment) => [
      payment.paymentDate.toISOString(),
      payment.amount,
      payment.paymentMethod,
      payment.reference ?? "",
      payment.recordedBy.fullName,
      payment.verificationStatus,
      payment.notes ?? "",
      payment.receipt?.originalName ?? "",
    ]),
  ]);
  await addFile("payments.csv", Buffer.from(paymentsCsv, "utf8"));

  const obligationsCsv = csv([
    ["title", "kind", "amount_ngn", "due_date", "status", "completed_at"],
    ...deal.obligations.map((obligation) => [
      obligation.title,
      obligation.kind,
      obligation.amount ?? "",
      obligation.dueAt?.toISOString() ?? "",
      obligation.status,
      obligation.completedAt?.toISOString() ?? "",
    ]),
  ]);
  await addFile("obligations.csv", Buffer.from(obligationsCsv, "utf8"));

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

  const verificationToken = seal.verificationToken;
  const url = verificationUrl(verificationToken);
  const partiesLines = deal.parties.map((party) => `- ${party.role}: ${party.fullName}`).join("\n");
  const signerLines = deal.signatures
    .filter((signature) => signature.documentId === executed.id)
    .map(
      (signature) =>
        `- ${signature.party.role}: ${signature.signerName} | ${formatDateTime(signature.signedAt)} | ${AUTH_LEVEL_LABEL[signature.authenticationMethod] ?? signature.authenticationMethod} | document hash ${signature.documentSha256}`,
    )
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

FILES IN THIS PACK
${manifestRows.join("\n")}

HOW TO CHECK THE AGREEMENT FILE
1. Compute the SHA-256 hash of agreement.pdf.
2. Compare it with the executed document SHA-256 above.
3. Visit the verification URL, or scan the QR code on the certificate page.
4. You may upload the PDF on the verification page to compare its hash with the platform record.

LIMITATIONS
This pack is intended to preserve a clear record of the agreement and events. It is not legal advice and does not guarantee payment, performance, enforceability or admissibility in any court. A hash match shows the file is identical to the file recorded by the platform. A mismatch shows the file differs, but does not by itself prove fraud. The platform seal is not an NBA stamp or seal, notarial seal, government certification or guarantee of legal validity. This certificate is not a Section 84 Evidence Act certificate unless separately prepared through an approved legal process.

Generated: ${new Date().toISOString()}
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
        metadata: { files: files.length, zipSha256: sha256(zip) },
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
      signatories: deal.signatures.filter((signature) => signature.documentId === executed.id).length,
      eventCount: deal.events.length + 1,
      paymentCount: deal.payments.length,
      obligationCount: deal.obligations.length + deal.payments.filter((p) => p.verificationStatus === "UNVERIFIED").length,
      obligationStatus: OBLIGATION_STATUS.PENDING,
      documentType: DOCUMENT_TYPE.EXECUTION_COPY,
      events: deal.events,
    },
  };
}
