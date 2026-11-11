import { Resend } from "resend";
import { APP_NAME } from "./constants";

type MailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(input: MailInput) {
  if (!emailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dealrec email:dev] to=${input.to} subject=${input.subject}`);
    }
    return { ok: true, simulated: true };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM as string,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) {
      console.error("[dealrec email] failed", result.error.message);
      return { ok: false, simulated: false };
    }
    return { ok: true, simulated: false };
  } catch (error) {
    console.error("[dealrec email] failed", error instanceof Error ? error.message : error);
    return { ok: false, simulated: false };
  }
}

export async function sendSms(to: string, message: string) {
  if (!process.env.SMS_API_KEY || !process.env.SMS_SENDER_ID) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[dealrec sms:dev] to=${to} message=${message.slice(0, 60)}`);
    }
    return { ok: true, simulated: true };
  }

  try {
    const response = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        from: process.env.SMS_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: process.env.SMS_API_KEY,
      }),
    });
    return { ok: response.ok, simulated: false };
  } catch (error) {
    console.error("[dealrec sms] failed", error instanceof Error ? error.message : error);
    return { ok: false, simulated: false };
  }
}

export function otpEmailHtml(code: string, purpose: string) {
  return `<!doctype html>
<html><body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:24px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb">
<h2 style="margin:0 0 8px;color:#0f172a">${APP_NAME}</h2>
<p style="color:#334155">Your one-time code for ${purpose} is:</p>
<p style="font-size:30px;letter-spacing:8px;font-weight:700;color:#0f172a;margin:16px 0">${code}</p>
<p style="color:#64748b;font-size:14px">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
<p style="color:#94a3b8;font-size:12px;margin-top:24px">${APP_NAME} records agreements and evidence. A one-time code confirms control of a contact channel; it does not prove civil identity.</p>
</div></body></html>`;
}
