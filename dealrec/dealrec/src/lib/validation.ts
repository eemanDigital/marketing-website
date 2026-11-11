import { z } from "zod";
import { isEmail, isNigerianPhone, normalizePhone } from "./utils";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  code: z.string().trim().length(6, "Enter the 6-digit code."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export function validateContact(email: string, phone: string) {
  if (!email && !phone) {
    throw new Error("Add an email address or phone number for the other party.");
  }
  if (email && !isEmail(email)) {
    throw new Error("Enter a valid email address for the other party.");
  }
  const normalizedPhone = normalizePhone(phone);
  if (phone && !isNigerianPhone(normalizedPhone)) {
    throw new Error("Enter a valid Nigerian phone number, for example 08012345678.");
  }
  return { email: email.trim().toLowerCase(), phone: normalizedPhone };
}

export function parseMoney(value: FormDataEntryValue | null, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a valid amount greater than zero.`);
  }
  return Math.round(parsed);
}

export function parseOptionalMoney(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
}

export function requireText(
  value: FormDataEntryValue | null,
  label: string,
  { min = 1, max = 5000 }: { min?: number; max?: number } = {},
) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length < min) throw new Error(`${label} is required.`);
  return text.slice(0, max);
}

export function optionalText(value: FormDataEntryValue | null, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function requireConsent(value: FormDataEntryValue | null) {
  if (value !== "on" && value !== "true" && value !== "1") {
    throw new Error("Please confirm that you intend to sign.");
  }
}
