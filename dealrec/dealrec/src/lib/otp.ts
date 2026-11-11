import { db } from "./db";
import { hashOtp, randomCode, safeEqual } from "./crypto";
import { OTP_MAX_ATTEMPTS, OTP_TTL_MINUTES } from "./constants";

export function normalizeTarget(channel: "email" | "phone", target: string) {
  return channel === "email" ? target.trim().toLowerCase() : target.trim();
}

export async function createOtp(input: {
  purpose: string;
  channel: "email" | "phone";
  target: string;
}) {
  const target = normalizeTarget(input.channel, input.target);
  const code = randomCode(6);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await db.otp.updateMany({
    where: { purpose: input.purpose, target, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await db.otp.create({
    data: {
      purpose: input.purpose,
      channel: input.channel,
      target,
      codeHash: hashOtp(input.purpose, target, code),
      expiresAt,
    },
  });

  return { code, expiresAt, target };
}

export async function verifyOtp(input: {
  purpose: string;
  channel: "email" | "phone";
  target: string;
  code: string;
}) {
  const target = normalizeTarget(input.channel, input.target);
  const otp = await db.otp.findFirst({
    where: { purpose: input.purpose, target, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) throw new Error("That code is no longer valid. Request a new one.");
  if (otp.expiresAt.getTime() < Date.now()) {
    await db.otp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    throw new Error("That code has expired. Request a new one.");
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error("Too many incorrect attempts. Request a new code.");
  }

  const expected = hashOtp(input.purpose, target, input.code.trim());
  if (!safeEqual(expected, otp.codeHash)) {
    await db.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Incorrect code. Please check and try again.");
  }

  await db.otp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  return { channel: input.channel, target };
}
