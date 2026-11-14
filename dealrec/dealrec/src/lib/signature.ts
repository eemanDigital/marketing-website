import { PDFDocument } from "pdf-lib";
import { MAX_SIGNATURE_BYTES } from "./constants";
import { isPng } from "./storage";

export type SignatureType = "drawn" | "typed" | "uploaded";

export function parseSignatureType(value: string): SignatureType | null {
  return value === "drawn" || value === "typed" || value === "uploaded" ? value : null;
}

export async function decodeSignature(dataUrl: string) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
  if (!match || match[1].length % 4 !== 0) return null;
  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length < 24 || !isPng(buffer)) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (
    buffer.length === 0 ||
    buffer.length > MAX_SIGNATURE_BYTES ||
    buffer.toString("base64") !== match[1] ||
    width === 0 ||
    height === 0 ||
    width > 1600 ||
    height > 800 ||
    width * height > 1_280_000
  ) {
    return null;
  }
  try {
    const doc = await PDFDocument.create();
    await doc.embedPng(buffer);
  } catch {
    return null;
  }
  return buffer;
}
