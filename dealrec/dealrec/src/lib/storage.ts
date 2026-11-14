import { mkdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { MAX_UPLOAD_BYTES } from "./constants";

function storageRoot() {
  const configured = process.env.STORAGE_DIR ?? ".storage";
  return path.isAbsolute(configured)
    ? configured
    : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

function normalizeKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.includes("\0") ||
    path.isAbsolute(normalized)
  ) {
    throw new Error("Invalid storage key.");
  }
  return normalized;
}

function resolveKey(key: string) {
  const normalized = normalizeKey(key);
  const full = path.join(storageRoot(), normalized);
  const root = storageRoot();
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new Error("Invalid storage key.");
  }
  return full;
}

function s3Bucket() {
  return process.env.S3_BUCKET?.trim() || null;
}

let s3Client: S3Client | null = null;

function getS3Client() {
  if (s3Client) return s3Client;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3_BUCKET is set but S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are missing.",
    );
  }
  s3Client = new S3Client({
    region: process.env.S3_REGION ?? process.env.AWS_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId,
      secretAccessKey,
      sessionToken: process.env.S3_SESSION_TOKEN ?? process.env.AWS_SESSION_TOKEN,
    },
  });
  return s3Client;
}

function contentTypeFor(key: string) {
  const extension = path.extname(key).toLowerCase();
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "application/octet-stream";
}

export async function putFile(key: string, data: Buffer | Uint8Array) {
  const normalized = normalizeKey(key);
  const bucket = s3Bucket();
  if (bucket) {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: normalized,
        Body: data,
        ContentType: contentTypeFor(normalized),
      }),
    );
    return normalized;
  }
  const full = resolveKey(normalized);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return normalized;
}

export async function getFile(key: string) {
  const normalized = normalizeKey(key);
  const bucket = s3Bucket();
  if (bucket) {
    const response = await getS3Client().send(
      new GetObjectCommand({ Bucket: bucket, Key: normalized }),
    );
    if (!response.Body) throw new Error("Stored file has no body.");
    return Buffer.from(await response.Body.transformToByteArray());
  }
  return readFile(resolveKey(normalized));
}

export async function fileExists(key: string) {
  const normalized = normalizeKey(key);
  const bucket = s3Bucket();
  if (bucket) {
    try {
      await getS3Client().send(new HeadObjectCommand({ Bucket: bucket, Key: normalized }));
      return true;
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if ((error as { name?: string }).name === "NotFound" || status === 404) return false;
      throw error;
    }
  }
  try {
    await stat(resolveKey(normalized));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(key: string) {
  const normalized = normalizeKey(key);
  const bucket = s3Bucket();
  if (bucket) {
    try {
      await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: normalized }));
    } catch {
      // Missing files are already gone.
    }
    return;
  }
  try {
    await unlink(resolveKey(normalized));
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
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

export function isJpeg(bytes: Buffer) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export async function validateUpload(file: File): Promise<ValidatedUpload> {
  if (!file || file.size === 0) throw new Error("Please choose a file to upload.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("The file is too large. Maximum size is 4MB.");
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
