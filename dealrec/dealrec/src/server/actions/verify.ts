"use server";

import { db } from "@/lib/db";
import { getRequestMeta } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { safeEqual } from "@/lib/crypto";
import { DOCUMENT_TYPE, EVENT } from "@/lib/constants";

export type VerifyFileResult =
  | {
      ok: true;
      match: boolean;
      status: string;
      label: string;
      expectedFingerprint: string;
      uploadedFingerprint: string;
      reference: string;
    }
  | { ok: false; error: string }
  | null;

type ExpectedFile = { hash: string; label: string };
type EvidenceFile = { name: string; sha256: string };
type LabelDocument = {
  documentType: string;
  originalName: string | null;
  versionNumber: number;
};

const HASH_PATTERN = /^[a-f0-9]{64}$/i;

function isHash(value: unknown): value is string {
  return typeof value === "string" && HASH_PATTERN.test(value);
}

function documentLabel(document: LabelDocument) {
  if (document.documentType === DOCUMENT_TYPE.CERTIFICATE) return "Certificate of execution";
  if (document.documentType === DOCUMENT_TYPE.RECEIPT) {
    return `Receipt${document.originalName ? ` · ${document.originalName}` : ""}`;
  }
  return document.originalName || document.documentType || `Version ${document.versionNumber}`;
}

function parseEvidenceMetadata(raw: string): { zipHash: string | null; files: EvidenceFile[] } | null {
  try {
    const metadata = JSON.parse(raw || "{}") as { zipSha256?: unknown; files?: unknown };
    const files = Array.isArray(metadata.files)
      ? metadata.files.flatMap((item): EvidenceFile[] => {
          if (!item || typeof item !== "object") return [];
          const file = item as Record<string, unknown>;
          if (typeof file.name !== "string" || !isHash(file.sha256)) return [];
          return [{ name: file.name, sha256: file.sha256 }];
        })
      : [];
    return {
      zipHash: isHash(metadata.zipSha256) ? metadata.zipSha256 : null,
      files,
    };
  } catch {
    return null;
  }
}

async function resolveExpectedFile(
  artifactId: string,
  dealId: string,
  agreementHash: string,
): Promise<ExpectedFile | null> {
  if (artifactId === "agreement") {
    return { hash: agreementHash, label: "Executed agreement" };
  }

  if (artifactId.startsWith("document:")) {
    const documentId = artifactId.slice("document:".length);
    if (!documentId) return null;
    const document = await db.dealDocument.findFirst({
      where: { id: documentId, dealId },
      select: { documentType: true, originalName: true, versionNumber: true, sha256: true },
    });
    if (!document || !isHash(document.sha256)) return null;
    return { hash: document.sha256, label: documentLabel(document) };
  }

  const eventPrefix = artifactId.startsWith("evidence-zip:")
    ? "evidence-zip:"
    : artifactId.startsWith("evidence-file:")
      ? "evidence-file:"
      : null;
  if (!eventPrefix) return null;

  const remainder = artifactId.slice(eventPrefix.length);
  const separatorIndex = eventPrefix === "evidence-file:" ? remainder.indexOf(":") : -1;
  const eventId =
    separatorIndex === -1 ? remainder : remainder.slice(0, separatorIndex);
  const indexRaw = separatorIndex === -1 ? "" : remainder.slice(separatorIndex + 1);
  if (!eventId) return null;

  const event = await db.dealEvent.findFirst({
    where: { id: eventId, dealId, eventType: EVENT.EVIDENCE_PACK_GENERATED },
    select: { metadataJson: true },
  });
  if (!event) return null;
  const metadata = parseEvidenceMetadata(event.metadataJson);
  if (!metadata) return null;

  if (eventPrefix === "evidence-zip:") {
    if (!metadata.zipHash) return null;
    return { hash: metadata.zipHash, label: "Evidence pack ZIP" };
  }

  const index = Number(indexRaw);
  if (!Number.isInteger(index) || index < 0 || index >= metadata.files.length) return null;
  const file = metadata.files[index];
  return { hash: file.sha256, label: `Pack file · ${file.name}` };
}

export async function checkFileAction(
  _prev: VerifyFileResult,
  formData: FormData,
): Promise<VerifyFileResult> {
  try {
    const meta = await getRequestMeta();
    enforceRateLimit(`verify-file:${meta.ipAddress ?? "unknown"}`, 20, 10 * 60 * 1000);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const artifactId = String(formData.get("artifactId") ?? "").trim();
    const fileHash = String(formData.get("fileHash") ?? "").trim().toLowerCase();

    if (!artifactId) {
      return { ok: false, error: "Choose the recorded file to compare against." };
    }
    if (!isHash(fileHash)) {
      return { ok: false, error: "Choose a file and wait for its hash to finish." };
    }

    const seal = await db.dealSeal.findFirst({
      where: {
        OR: [{ verificationToken: identifier }, { deal: { reference: identifier } }],
      },
      include: { deal: true, document: true },
    });
    if (!seal) return { ok: false, error: "No verification record matches that reference." };

    const expected = await resolveExpectedFile(artifactId, seal.dealId, seal.document.sha256);
    if (!expected) {
      return { ok: false, error: "That recorded file is no longer available." };
    }

    return {
      ok: true,
      match: safeEqual(fileHash, expected.hash.toLowerCase()),
      status: seal.status,
      label: expected.label,
      expectedFingerprint: expected.hash.slice(0, 16),
      uploadedFingerprint: fileHash.slice(0, 16),
      reference: seal.deal.reference,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not check that file.",
    };
  }
}
