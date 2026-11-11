import { mkdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import path from "node:path";
import { MAX_UPLOAD_BYTES } from "./constants";

function storageRoot() {
  const configured = process.env.STORAGE_DIR ?? ".storage";
  return path.isAbsolute(configured)
    ? configured
    : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

function resolveKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.includes("\0") ||
    path.isAbsolute(normalized)
  ) {
    throw new Error("Invalid storage key.");
  }
  const full = path.join(storageRoot(), normalized);
  const root = storageRoot();
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new Error("Invalid storage key.");
  }
  return full;
}

export async function putFile(key: string, data: Buffer | Uint8Array) {
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return key;
}

export async function getFile(key: string) {
  return readFile(resolveKey(key));
}

export async function fileExists(key: string) {
  try {
    await stat(resolveKey(key));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(key: string) {
  try {
    await unlink(resolveKey(key));
  } catch {
    // Missing files are already gone.
  }
}

export type ValidatedUpload = {
  bytes: Buffer;
  mimeType: string;
  fileName: string;
  size: number;
  sha256: string;
};

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function isPdf(bytes: Buffer) {
  return bytes.subarray(0, 5).toString("latin1") === "%PDF-";
}

export function isPng(bytes: Buffer) {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

export function isJpeg(bytes: Buffer) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export async function validateUpload(file: File): Promise<ValidatedUpload> {
  if (!file || file.size === 0) throw new Error("Please choose a file to upload.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("The file is too large. Maximum size is 10MB.");
  }
  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("Only PDF and image files are allowed.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (mimeType === "application/pdf" && !isPdf(bytes)) {
    throw new Error("That file does not look like a valid PDF.");
  }
  if (mimeType === "image/png" && !isPng(bytes)) {
    throw new Error("That file does not look like a valid PNG image.");
  }
  if (mimeType === "image/jpeg" && !isJpeg(bytes)) {
    throw new Error("That file does not look like a valid JPEG image.");
  }
  const { sha256 } = await import("./crypto");
  return {
    bytes,
    mimeType,
    fileName: file.name || "upload",
    size: file.size,
    sha256: sha256(bytes),
  };
}

export function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "file";
}
