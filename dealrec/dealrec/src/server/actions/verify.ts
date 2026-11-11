"use server";

import { db } from "@/lib/db";
import { getRequestMeta } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/crypto";
import { validateUpload } from "@/lib/storage";

export type VerifyFileResult =
  | {
      ok: true;
      match: boolean;
      status: string;
      expectedFingerprint: string;
      uploadedFingerprint: string;
      reference: string;
    }
  | { ok: false; error: string }
  | null;

export async function checkFileAction(
  _prev: VerifyFileResult,
  formData: FormData,
): Promise<VerifyFileResult> {
  try {
    const meta = await getRequestMeta();
    enforceRateLimit(`verify-file:${meta.ipAddress ?? "unknown"}`, 20, 10 * 60 * 1000);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Choose a PDF file to compare." };

    const seal = await db.dealSeal.findFirst({
      where: {
        OR: [{ verificationToken: identifier }, { deal: { reference: identifier } }],
      },
      include: { deal: true, document: true },
    });
    if (!seal) return { ok: false, error: "No verification record matches that reference." };

    const upload = await validateUpload(file);
    if (upload.mimeType !== "application/pdf") {
      return { ok: false, error: "Upload the executed agreement as a PDF file." };
    }

    return {
      ok: true,
      match: upload.sha256 === seal.document.sha256,
      status: seal.status,
      expectedFingerprint: seal.document.sha256.slice(0, 16),
      uploadedFingerprint: upload.sha256.slice(0, 16),
      reference: seal.deal.reference,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not check that file.",
    };
  }
}

export async function hashUploadedFileAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Choose a file.");
  const upload = await validateUpload(file);
  return { sha256: sha256(upload.bytes) };
}
