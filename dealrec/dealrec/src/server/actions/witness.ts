"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDealAccess, executeDealIfReady, getFullDeal, currentDocument } from "@/lib/deals";
import { appendEvent } from "@/lib/events";
import { getRequestMeta } from "@/lib/auth";
import {
  AUTH_LEVEL,
  CONSENT_TEXT_VERSION,
  DEAL_STATUS,
  EVENT,
  MAX_SIGNATURE_BYTES,
  OTP_PURPOSE,
  WITNESS_DAYS,
  WITNESS_STATUS,
} from "@/lib/constants";
import { randomToken, sha256 } from "@/lib/crypto";
import { createOtp, verifyOtp } from "@/lib/otp";
import { sendEmail, sendSms, otpEmailHtml } from "@/lib/mail";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isPng, putFile, safeFileName } from "@/lib/storage";
import { normalizeString } from "@/lib/utils";
import { requireConsent, requireText } from "@/lib/validation";
import { findWitness, witnessCanAttest, witnessChannel, witnessProblem } from "@/lib/witness";
import { type ActionState, errorMessage } from "../action-state";

const CLOSED_FOR_WITNESS = [
  DEAL_STATUS.EXECUTED,
  DEAL_STATUS.COMPLETED,
  DEAL_STATUS.CANCELLED,
  DEAL_STATUS.VOIDED,
  DEAL_STATUS.SUPERSEDED,
];

function appUrl(path: string) {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path}`;
}

function devCode(code: string) {
  return process.env.NODE_ENV === "production" ? undefined : code;
}

function decodeSignature(dataUrl: string) {
  const match = /^data:image\/png;base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length === 0) return null;
  if (buffer.length > MAX_SIGNATURE_BYTES) {
    throw new Error("The signature image is too large.");
  }
  if (!isPng(buffer)) throw new Error("The signature image could not be read.");
  return buffer;
}

export async function addWitnessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const dealId = String(formData.get("dealId") ?? "");
  const partyId = String(formData.get("partyId") ?? "");
  try {
    const access = await getDealAccess(dealId);
    if (!access) return { error: "You do not have access to this deal." };
    const { deal, party, isCreator, user } = access;
    if (CLOSED_FOR_WITNESS.includes(deal.status as never)) {
      return { error: "Witnesses cannot be changed after execution or closing." };
    }
    if (!isCreator && !user.isAdmin && party?.id !== partyId) {
      return { error: "You can only add a witness for yourself." };
    }

    const witnessedParty = deal.parties.find((item) => item.id === partyId);
    if (!witnessedParty) return { error: "The party could not be found." };
    const document = currentDocument(deal);
    if (!document) return { error: "The current document version could not be found." };

    const existing = deal.witnesses.find(
      (witness) =>
        witness.witnessedPartyId === partyId &&
        witness.documentId === document.id &&
        witness.status !== WITNESS_STATUS.REVOKED &&
        witness.status !== WITNESS_STATUS.SUPERSEDED,
    );
    if (existing) return { error: "This party already has a witness for the current version." };

    const fullName = requireText(formData.get("fullName"), "Witness full name", { min: 2, max: 120 });
    const email = normalizeString(formData.get("email"));
    const phoneNumber = normalizeString(formData.get("phoneNumber"));
    if (!email && !phoneNumber) {
      return { error: "Add an email address or phone number so the witness can verify control." };
    }
    const address = normalizeString(formData.get("address"));
    const occupation = normalizeString(formData.get("occupation"));
    const relationship = normalizeString(formData.get("relationship"));
    const required = String(formData.get("required") ?? "1") === "1";

    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + WITNESS_DAYS * 86_400_000);
    await db.$transaction(async (tx) => {
      const created = await tx.dealWitness.create({
        data: {
          dealId,
          witnessedPartyId: partyId,
          addedByPartyId: party?.id ?? null,
          documentId: document.id,
          fullName,
          email: email || null,
          phoneNumber: phoneNumber || null,
          address: address || null,
          occupation: occupation || null,
          relationship: relationship || null,
          tokenHash: sha256(token),
          status: WITNESS_STATUS.INVITED,
          required,
          expiresAt,
          documentSha256: document.sha256,
        },
      });
      await appendEvent(tx, {
        dealId,
        eventType: EVENT.WITNESS_INVITED,
        description: `${fullName} was invited as a witness for ${witnessedParty.fullName}.`,
        actorPartyId: party?.id ?? null,
        metadata: {
          witnessId: created.id,
          witnessedPartyId: partyId,
          documentId: document.id,
          required,
          expiresAt: expiresAt.toISOString(),
        },
      });
      return created;
    });

    revalidatePath(`/deals/${dealId}`);
    return {
      ok: true,
      success: `Witness link created for ${fullName}. Share the link or send the verification code.`,
      url: appUrl(`/witness/${token}`),
    };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function revokeWitnessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const dealId = String(formData.get("dealId") ?? "");
  const witnessId = String(formData.get("witnessId") ?? "");
  try {
    const access = await getDealAccess(dealId);
    if (!access) return { error: "You do not have access to this deal." };
    const { deal, party, isCreator, user } = access;
    const witness = deal.witnesses.find((item) => item.id === witnessId);
    if (!witness) return { error: "Witness not found." };
    if (CLOSED_FOR_WITNESS.includes(deal.status as never)) {
      return { error: "Witnesses cannot be changed after execution or closing." };
    }
    if (!isCreator && !user.isAdmin && party?.id !== witness.addedByPartyId && party?.id !== witness.witnessedPartyId) {
      return { error: "You cannot revoke this witness." };
    }
    if (witness.status === WITNESS_STATUS.REVOKED) return { ok: true, success: "This witness is already revoked." };

    await db.$transaction(async (tx) => {
      await tx.dealWitness.update({
        where: { id: witness.id },
        data: { status: WITNESS_STATUS.REVOKED, revokedAt: new Date() },
      });
      await appendEvent(tx, {
        dealId,
        eventType: EVENT.WITNESS_REVOKED,
        description: `Witness participation for ${witness.fullName} was revoked.`,
        actorPartyId: party?.id ?? null,
        metadata: { witnessId: witness.id, witnessedPartyId: witness.witnessedPartyId },
      });
    });

    const refreshed = await getFullDeal(dealId);
    if (refreshed) await executeDealIfReady(dealId);
    revalidatePath(`/deals/${dealId}`);
    return { ok: true, success: "Witness revoked." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function resendWitnessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const dealId = String(formData.get("dealId") ?? "");
  const witnessId = String(formData.get("witnessId") ?? "");
  try {
    const access = await getDealAccess(dealId);
    if (!access) return { error: "You do not have access to this deal." };
    const { deal, party, isCreator, user } = access;
    const witness = deal.witnesses.find((item) => item.id === witnessId);
    if (!witness) return { error: "Witness not found." };
    if (CLOSED_FOR_WITNESS.includes(deal.status as never)) {
      return { error: "Witnesses cannot be changed after execution or closing." };
    }
    if (!isCreator && !user.isAdmin && party?.id !== witness.addedByPartyId && party?.id !== witness.witnessedPartyId) {
      return { error: "You cannot resend this witness link." };
    }
    if (witness.status === WITNESS_STATUS.ATTESTED || witness.status === WITNESS_STATUS.REVOKED) {
      return { error: "This witness link cannot be resent." };
    }

    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + WITNESS_DAYS * 86_400_000);
    await db.$transaction(async (tx) => {
      await tx.dealWitness.update({
        where: { id: witness.id },
        data: {
          tokenHash: sha256(token),
          expiresAt,
          status: WITNESS_STATUS.INVITED,
          verifiedAt: null,
          verifyMethod: null,
        },
      });
      await appendEvent(tx, {
        dealId,
        eventType: EVENT.WITNESS_INVITED,
        description: `A fresh witness link was issued for ${witness.fullName}.`,
        actorPartyId: party?.id ?? null,
        metadata: { witnessId: witness.id, expiresAt: expiresAt.toISOString() },
      });
    });

    const url = appUrl(`/witness/${token}`);
    const witnessedParty = deal.parties.find((item) => item.id === witness.witnessedPartyId);
    if (witness.email) {
      await sendEmail({
        to: witness.email,
        subject: `Witness attestation requested for "${deal.title}"`,
        html: `<p>You were invited to witness the signature of ${witnessedParty?.fullName ?? "a party"} on "${deal.title}".</p><p><a href="${url}">Open the witness page</a></p>`,
        text: `You were invited to witness "${deal.title}" on dealrec. Open ${url}`,
      });
    } else if (witness.phoneNumber) {
      await sendSms(witness.phoneNumber, `You were invited to witness "${deal.title}" on dealrec. Open ${url}`);
    }

    revalidatePath(`/deals/${dealId}`);
    return { ok: true, success: "A fresh witness link was created and sent.", url };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function trackWitnessOpenAction(token: string) {
  try {
    const witness = await findWitness(token);
    if (!witness || witnessProblem(witness)) return { ok: false };
    enforceRateLimit(`witness-open:${witness.id}`, 10, 60 * 1000);
    const firstOpen = witness.openCount === 0;
    await db.dealWitness.update({
      where: { id: witness.id },
      data: {
        openCount: { increment: 1 },
        lastOpenedAt: new Date(),
        status: witness.status === WITNESS_STATUS.INVITED ? WITNESS_STATUS.OPENED : witness.status,
      },
    });
    if (firstOpen) {
      await appendEvent(db, {
        dealId: witness.dealId,
        eventType: EVENT.WITNESS_OPENED,
        description: `The witness link for ${witness.fullName} was opened.`,
        metadata: { witnessId: witness.id },
      });
      revalidatePath(`/witness/${token}`);
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function sendWitnessOtpAction(token: string): Promise<ActionState> {
  try {
    const witness = await findWitness(token);
    if (!witness) return { error: "Witness link not found." };
    const problem = witnessProblem(witness);
    if (problem) return { error: problem };
    if (witness.status === WITNESS_STATUS.ATTESTED) return { ok: true, success: "This witness record is already attested." };
    const channel = witnessChannel(witness);
    if (!channel) return { error: "This witness has no email or phone number for verification." };
    if (witness.verifiedAt) return { ok: true, success: "This witness contact is already verified." };

    enforceRateLimit(`witness-otp:${witness.id}`, 5, 15 * 60 * 1000);
    enforceRateLimit(`witness-otp-target:${channel.target}`, 5, 15 * 60 * 1000);
    const { code } = await createOtp({
      purpose: OTP_PURPOSE.WITNESS_VERIFY,
      channel: channel.channel,
      target: channel.target,
    });

    if (channel.channel === "email") {
      await sendEmail({
        to: channel.target,
        subject: `Witness verification code for "${witness.deal.title}"`,
        html: otpEmailHtml(code, "your witness attestation"),
        text: `Your dealrec witness verification code is ${code}. It expires in 10 minutes.`,
      });
    } else {
      await sendSms(channel.target, `Your dealrec witness verification code is ${code}. It expires in 10 minutes.`);
    }

    return {
      ok: true,
      success: channel.channel === "email" ? `A code was sent to ${channel.target}.` : `A code was sent by SMS to ${channel.target}.`,
      devCode: devCode(code),
    };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function verifyWitnessOtpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  try {
    const witness = await findWitness(token);
    if (!witness) return { error: "Witness link not found." };
    const problem = witnessProblem(witness);
    if (problem) return { error: problem };
    const channel = witnessChannel(witness);
    if (!channel) return { error: "This witness has no contact channel to verify." };

    enforceRateLimit(`witness-verify:${witness.id}`, 10, 15 * 60 * 1000);
    await verifyOtp({
      purpose: OTP_PURPOSE.WITNESS_VERIFY,
      channel: channel.channel,
      target: channel.target,
      code: String(formData.get("code") ?? ""),
    });

    const authLevel = channel.channel === "email" ? AUTH_LEVEL.EMAIL_VERIFIED : AUTH_LEVEL.PHONE_OTP_VERIFIED;
    await db.$transaction(async (tx) => {
      await tx.dealWitness.update({
        where: { id: witness.id },
        data: {
          verifiedAt: new Date(),
          verifyMethod: channel.channel === "email" ? "EMAIL_OTP" : "PHONE_OTP",
          status: WITNESS_STATUS.VERIFIED,
          authenticationMethod: authLevel,
        },
      });
      await appendEvent(tx, {
        dealId: witness.dealId,
        eventType: EVENT.WITNESS_VERIFIED,
        description: `${witness.fullName}'s ${channel.channel === "email" ? "email" : "phone"} control was verified for witness attestation.`,
        metadata: { witnessId: witness.id, method: channel.channel },
      });
    });

    revalidatePath(`/witness/${token}`);
    return { ok: true, success: "Contact verified. You can now attest." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function attestWitnessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  let destination = "";
  try {
    const witness = await findWitness(token);
    if (!witness) return { error: "Witness link not found." };
    const problem = witnessProblem(witness);
    if (problem) return { error: problem };
    if (!witness.verifiedAt) return { error: "Verify your email or phone first." };
    if (witness.deal.status === DEAL_STATUS.EXECUTED) {
      return { error: "This deal has already been executed. Witness attestations are locked." };
    }
    if (!witnessCanAttest(witness)) {
      return { error: "The party you are witnessing must sign this version before you can attest." };
    }

    enforceRateLimit(`witness-attest:${witness.id}`, 5, 10 * 60 * 1000);
    const signerName = requireText(formData.get("signerName"), "Your full name", { min: 2, max: 120 });
    const address = requireText(formData.get("address"), "Your address", { min: 3, max: 240 });
    const occupation = normalizeString(formData.get("occupation"));
    const relationship = normalizeString(formData.get("relationship"));
    requireConsent(formData.get("consent"));

    const signatureType = String(formData.get("signatureType") ?? "drawn");
    const signatureData = String(formData.get("signatureData") ?? "");
    let signatureKey: string | null = null;
    const png = signatureType === "drawn" ? decodeSignature(signatureData) : null;
    if (signatureType === "drawn" && !png) {
      return { error: "Please draw your signature or choose typed signature." };
    }
    if (png) {
      signatureKey = `deals/${witness.dealId}/witnesses/${witness.id}-${Date.now()}-${safeFileName(signerName)}.png`;
      await putFile(signatureKey, png);
    }

    const meta = await getRequestMeta();
    const now = new Date();
    await db.$transaction(async (tx) => {
      await tx.dealWitness.update({
        where: { id: witness.id },
        data: {
          status: WITNESS_STATUS.ATTESTED,
          attestedAt: now,
          signerName,
          address,
          occupation: occupation || null,
          relationship: relationship || null,
          signatureType,
          signatureAssetKey: signatureKey,
          consentTextVersion: CONSENT_TEXT_VERSION,
          documentSha256: witness.document?.sha256 ?? null,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
      await appendEvent(tx, {
        dealId: witness.dealId,
        eventType: EVENT.WITNESS_ATTESTED,
        description: `${signerName} attested as a witness for ${witness.witnessedParty.fullName} on version ${witness.document?.versionNumber ?? witness.deal.currentVersion}.`,
        metadata: {
          witnessId: witness.id,
          witnessedPartyId: witness.witnessedPartyId,
          documentId: witness.documentId,
          documentSha256: witness.document?.sha256 ?? null,
          authenticationMethod: witness.authenticationMethod,
          signatureType,
        },
      });
    });

    await executeDealIfReady(witness.dealId);
    destination = `/witness/${token}?attested=1`;
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath(`/witness/${token}`);
  redirect(destination);
}
