"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  getRequestMeta,
  getSessionUser,
  hashPassword,
  requireUser,
  revokeOtherSessions,
  verifyPassword,
} from "@/lib/auth";
import { OTP_PURPOSE, SESSION_COOKIE } from "@/lib/constants";
import { createOtp, verifyOtp } from "@/lib/otp";
import { sendEmail, sendSms, otpEmailHtml } from "@/lib/mail";
import { enforceRateLimit } from "@/lib/rate-limit";
import { linkVerifiedParties } from "@/lib/party-access";
import { signInSchema, signUpSchema } from "@/lib/validation";
import { isNigerianPhone, normalizePhone, safeNextPath } from "@/lib/utils";
import { type ActionState, errorMessage } from "../action-state";
import { cookies } from "next/headers";
import { sha256 } from "@/lib/crypto";

function devCode(code: string) {
  return process.env.NODE_ENV === "production" ? undefined : code;
}

async function sendSignupCode(userId: string, email: string) {
  const { code } = await createOtp({
    purpose: OTP_PURPOSE.SIGNUP_EMAIL,
    channel: "email",
    target: email,
  });
  await sendEmail({
    to: email,
    subject: "Your dealrec verification code",
    html: otpEmailHtml(code, "email verification"),
    text: `Your dealrec verification code is ${code}. It expires in 10 minutes.`,
  });
  return code;
}

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const { fullName, email, password } = parsed.data;
  const next = safeNextPath(formData.get("next"));
  const meta = await getRequestMeta();
  try {
    if (meta.ipAddress) enforceRateLimit(`signup:${meta.ipAddress}`, 5, 60 * 60 * 1000);
    enforceRateLimit(`signup-email:${sha256(email)}`, 5, 60 * 60 * 1000);
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { error: "An account with that email already exists. Sign in instead." };

    const user = await db.user.create({
      data: { fullName, email, passwordHash: await hashPassword(password) },
    });
    await createSession(user.id);
    await sendSignupCode(user.id, email);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  redirect(next ? `/verify-account?next=${encodeURIComponent(next)}` : "/verify-account");
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const next = safeNextPath(formData.get("next"));
  const meta = await getRequestMeta();
  let requiresVerification = false;
  try {
    if (meta.ipAddress) enforceRateLimit(`signin:${meta.ipAddress}`, 10, 15 * 60 * 1000);
    enforceRateLimit(`signin-email:${sha256(parsed.data.email)}`, 10, 15 * 60 * 1000);
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return { error: "Email or password is incorrect." };
    if (user.suspendedAt) return { error: "This account is suspended. Contact support." };
    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) return { error: "Email or password is incorrect." };
    await createSession(user.id);
    requiresVerification = !user.emailVerifiedAt;
    await linkVerifiedParties(user).catch(() => undefined);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  if (requiresVerification && next) {
    redirect(`/verify-account?next=${encodeURIComponent(next)}`);
  }
  redirect(next ?? "/dashboard");
}

export async function signOutAction() {
  await destroySession();
  redirect("/");
}

export async function resendSignupCodeAction(): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  try {
    enforceRateLimit(`signup-otp:${user.id}`, 5, 15 * 60 * 1000);
    const code = await sendSignupCode(user.id, user.email);
    revalidatePath("/verify-account");
    return { ok: true, success: "A new code has been sent.", devCode: devCode(code) };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function verifySignupCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const next = safeNextPath(formData.get("next"));
  try {
    await verifyOtp({
      purpose: OTP_PURPOSE.SIGNUP_EMAIL,
      channel: "email",
      target: user.email,
      code: String(formData.get("code") ?? ""),
    });
    const verifiedAt = new Date();
    await db.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: verifiedAt },
    });
    await linkVerifiedParties({ ...user, emailVerifiedAt: verifiedAt }).catch(() => undefined);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/dashboard");
  revalidatePath("/deals");
  if (next) revalidatePath(next);
  redirect(next ?? "/dashboard");
}

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNextPath(formData.get("next"));
  const meta = await getRequestMeta();
  try {
    if (meta.ipAddress) enforceRateLimit(`reset:${meta.ipAddress}`, 5, 30 * 60 * 1000);
    enforceRateLimit(`reset-email:${sha256(email)}`, 3, 30 * 60 * 1000);
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      const { code } = await createOtp({
        purpose: OTP_PURPOSE.PASSWORD_RESET,
        channel: "email",
        target: email,
      });
      await sendEmail({
        to: email,
        subject: "Reset your dealrec password",
        html: otpEmailHtml(code, "password reset"),
        text: `Your dealrec password reset code is ${code}. It expires in 10 minutes.`,
      });
      return {
        ok: true,
        success: "If an account exists for that email, a reset code has been sent. Check your spam or junk folder if it does not arrive.",
        devCode: devCode(code),
        email,
        next,
      };
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return {
    ok: true,
    success: "If an account exists for that email, a reset code has been sent. Check your spam or junk folder if it does not arrive.",
    email,
    next,
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  try {
    await verifyOtp({
      purpose: OTP_PURPOSE.PASSWORD_RESET,
      channel: "email",
      target: email,
      code,
    });
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return { error: "Account not found." };
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
    await db.session.deleteMany({ where: { userId: user.id } });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  const query = new URLSearchParams({ reset: "1", email });
  if (next) query.set("next", next);
  redirect(`/sign-in?${query.toString()}`);
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = normalizePhone(formData.get("phoneNumber"));
  if (fullName.length < 2) return { error: "Enter your full name." };
  if (phone && !isNigerianPhone(phone)) {
    return { error: "Enter a valid Nigerian phone number, for example 08012345678." };
  }
  if (phone && phone !== user.phoneNumber) {
    await db.user.update({
      where: { id: user.id },
      data: { fullName, phoneNumber: phone, phoneVerifiedAt: null },
    });
  } else {
    await db.user.update({ where: { id: user.id }, data: { fullName, phoneNumber: phone || null } });
  }
  revalidatePath("/profile");
  return { ok: true, success: "Profile updated." };
}

export async function sendPhoneCodeAction(): Promise<ActionState> {
  const user = await requireUser();
  if (!user.phoneNumber) return { error: "Add a phone number to your profile first." };
  try {
    enforceRateLimit(`phone-otp:${user.id}`, 5, 15 * 60 * 1000);
    const { code } = await createOtp({
      purpose: OTP_PURPOSE.PHONE_VERIFY,
      channel: "phone",
      target: user.phoneNumber,
    });
    await sendSms(user.phoneNumber, `Your dealrec verification code is ${code}. It expires in 10 minutes.`);
    return { ok: true, success: "A code has been sent by SMS.", devCode: devCode(code) };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function verifyPhoneCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user.phoneNumber) return { error: "Add a phone number to your profile first." };
  try {
    await verifyOtp({
      purpose: OTP_PURPOSE.PHONE_VERIFY,
      channel: "phone",
      target: user.phoneNumber,
      code: String(formData.get("code") ?? ""),
    });
    const verifiedAt = new Date();
    await db.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: verifiedAt },
    });
    await linkVerifiedParties({ ...user, phoneVerifiedAt: verifiedAt }).catch(() => undefined);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/deals");
  return { ok: true, success: "Phone number verified." };
}

export async function logoutAllAction() {
  const user = await requireUser();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  await revokeOtherSessions(user.id, token ? sha256(token) : undefined);
  revalidatePath("/profile");
  redirect("/profile?loggedOutOthers=1");
}
