import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

export function sha256(input: string | Buffer | Uint8Array) {
  return createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function randomHex(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

export function randomCode(digits = 6) {
  return String(randomInt(0, 10 ** digits)).padStart(digits, "0");
}

export function randomReference(prefix = "DR") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = randomBytes(6);
  for (const byte of bytes) {
    suffix += alphabet[byte % alphabet.length];
  }
  return `${prefix}-${new Date().getFullYear()}-${suffix}`;
}

export function randomSerial(prefix = "DRS") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = randomBytes(10);
  for (const byte of bytes) {
    suffix += alphabet[byte % alphabet.length];
  }
  return `${prefix}-${new Date().getFullYear()}-${suffix}`;
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function hashOtp(purpose: string, target: string, code: string) {
  return sha256(`${purpose}:${target.toLowerCase()}:${code}`);
}
