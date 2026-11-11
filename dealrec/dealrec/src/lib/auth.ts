import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { db } from "./db";
import { randomToken, sha256 } from "./crypto";
import { SESSION_COOKIE, SESSION_DAYS } from "./constants";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getRequestMeta() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || null;
  const userAgent = headerList.get("user-agent")?.slice(0, 500) ?? null;
  return { ipAddress, userAgent };
}

export async function createSession(userId: string) {
  const token = randomToken(32);
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const meta = await getRequestMeta();

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  store.delete(SESSION_COOKIE);
}

export type SessionUser = Pick<
  User,
  | "id"
  | "fullName"
  | "email"
  | "emailVerifiedAt"
  | "phoneNumber"
  | "phoneVerifiedAt"
  | "isAdmin"
  | "suspendedAt"
  | "createdAt"
>;

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const session = await db.session.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: true },
    });

    if (!session || session.expiresAt.getTime() < Date.now()) {
      if (session) {
        await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
      }
      return null;
    }

    if (session.user.suspendedAt) return null;

    const { user } = session;
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneNumber: user.phoneNumber,
      phoneVerifiedAt: user.phoneVerifiedAt,
      isAdmin: user.isAdmin,
      suspendedAt: user.suspendedAt,
      createdAt: user.createdAt,
    };
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect("/verify-account");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/dashboard");
  return user;
}

export async function requireUserOrThrow() {
  const user = await getSessionUser();
  if (!user) throw new Error("You must be signed in to continue.");
  return user;
}

export async function getSessionsForUser(userId: string) {
  return db.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeOtherSessions(userId: string, keepTokenHash?: string) {
  return db.session.deleteMany({
    where: {
      userId,
      ...(keepTokenHash ? { tokenHash: { not: keepTokenHash } } : {}),
    },
  });
}
