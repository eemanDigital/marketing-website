import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TIME_ZONE } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-NG");

export function formatNaira(amount: number | null | undefined) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }
  return nairaFormatter.format(amount);
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormatter.format(value);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
    timeZoneName: "short",
  }).format(date);
}

export function formatRelative(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const day = 86_400_000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < day) return rtf.format(Math.round(diff / 3_600_000), "hour");
  if (abs < day * 30) return rtf.format(Math.round(diff / day), "day");
  if (abs < day * 365) return rtf.format(Math.round(diff / (day * 30)), "month");
  return rtf.format(Math.round(diff / (day * 365)), "year");
}

export function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function parseDateInput(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(`${value.trim()}T00:00:00+01:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseAmount(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount);
}

export function normalizeString(
  value: FormDataEntryValue | string | null | undefined,
  max = 5000,
) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function isEmail(value: string | null | undefined) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function normalizePhone(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") return "";
  let phone = value.replace(/[^\d+]/g, "").trim();
  if (!phone) return "";
  if (phone.startsWith("+234")) phone = `0${phone.slice(4)}`;
  if (phone.startsWith("234") && phone.length === 13) phone = `0${phone.slice(3)}`;
  return phone.slice(0, 20);
}

export function isNigerianPhone(value: string | null | undefined) {
  if (!value) return false;
  return /^0\d{10}$/.test(value);
}

export function maskEmail(email: string | null | undefined) {
  if (!email || !email.includes("@")) return email ?? "—";
  const [name, domain] = email.split("@");
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

export function maskPhone(phone: string | null | undefined) {
  if (!phone) return "—";
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 4)}***${phone.slice(-2)}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function shortHash(hash: string | null | undefined, length = 12) {
  if (!hash) return "—";
  return hash.slice(0, length);
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function truncate(value: string, length = 80) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}…`;
}

export function padNumber(value: number, length = 2) {
  return String(value).padStart(length, "0");
}

export function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
