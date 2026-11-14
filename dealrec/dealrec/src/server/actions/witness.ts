"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  currentDocument,
  executeDealIfReady,
  findInvitation,
  getDealAccess,
  getFullDeal,
  invitationProblem,
} from "@/lib/deals";
import { appendEvent } from "@/lib/events";
import { getRequestMeta } from "@/lib/auth";
import {
  AUTH_LEVEL,
  CONSENT_TEXT_VERSION,
  DEAL_STATUS,
  DOCUMENT_TYPE,
  EVENT,
  OTP_PURPOSE,
  WITNESS_DAYS,
  WITNESS_STATUS,
} from "@/lib/constants";
import { randomToken, sha256 } from "@/lib/crypto";
import { createOtp, verifyOtp } from "@/lib/otp";
import { sendEmail, sendSms, otpEmailHtml } from "@/lib/mail";
import { notifyDealParties } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";
import { putFile, safeFileName } from "@/lib/storage";
import { decodeSignature, parseSignatureType } from "@/lib/signature";
import { normalizeString } from "@/lib/utils";
import { requireConsent, requireText, validateContact } from "@/lib/validation";
import {
  findWitness,
  witnessCanAttest,
  witnessChannel,
  witnessExecutionClosed,
  witnessProblem,
} from "@/lib/witness";
import { type ActionState, errorMessage } from "../action-state";

const CLOSED_FOR_WITNESS = [
  DEAL_STATUS.EXECUTED,
  DEAL_STATUS.ACTIVE,
  DEAL_STATUS.OVERDUE,
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
    const contact = validateContact(
      normalizeString(formData.get("email")),
      normalizeString(formData.get("phoneNumber")),
    );
    const email = contact.email || null;
    const phoneNumber = contact.phone || null;
    const address = normalizeString(formData.get("address"));
    const occupation = normalizeString(formData.get("occupation"));
    const relationship = normalizeString(formData.get("relationship"));
    const required = String(formData.get("required") ?? "") === "1";

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
          email,
          phoneNumber,
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
    revalidatePath(`/deals/${dealId}`);
    return { error: errorMessage(error) };
  }
}

export async function addInviteWitnessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  try {
    const invitation = await findInvitation(token);
    if (!invitation) return { error: "Invitation not found." };
    const problem = invitationProblem(invitation);
    if (problem) return { error: problem };
    if (!invitation.verifiedAt) return { error: "Verify your email or phone before adding a witness." };
    if (witnessExecutionClosed(invitation)) {
      return { error: "Witnesses cannot be changed after execution or closing." };
    }

    enforceRateLimit(`invite-witness:${invitation.partyId}`, 5, 15 * 60 * 1000);
    const fullName = requireText(formData.get("fullName"), "Witness full name", {
      min: 2,
      max: 120,
    });
    const contact = validateContact(
      normalizeString(formData.get("email")),
      normalizeString(formData.get("phoneNumber")),
    );
    const required = String(formData.get("required") ?? "") === "1";
    const witnessToken = randomToken(32);
    const expiresAt = new Date(Date.now() + WITNESS_DAYS * 86_400_000);

    await db.$transaction(async (tx) => {
      const currentInvitation = await tx.invitation.findUnique({
        where: { id: invitation.id },
        select: { verifiedAt: true, expiresAt: true, revokedAt: true },
      });
      if (
        !currentInvitation?.verifiedAt ||
        currentInvitation.revokedAt ||
        currentInvitation.expiresAt.getTime() < Date.now()
      ) {
        throw new Error("Verify your current invitation before adding a witness.");
      }

      const deal = await tx.deal.findUnique({
        where: { id: invitation.dealId },
        select: { status: true, currentVersion: true, executedAt: true },
      });
      if (!deal || deal.executedAt || CLOSED_FOR_WITNESS.includes(deal.status as never)) {
        throw new Error("Witnesses cannot be changed after execution or closing.");
      }

      const document = await tx.dealDocument.findFirst({
        where: {
          dealId: invitation.dealId,
          versionNumber: deal.currentVersion,
          documentType: {
            in: [DOCUMENT_TYPE.DRAFT, DOCUMENT_TYPE.UPLOADED_ORIGINAL],
          },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!document) throw new Error("The current document version could not be found.");

      const existing = await tx.dealWitness.findFirst({
        where: {
          dealId: invitation.dealId,
          witnessedPartyId: invitation.partyId,
          documentId: document.id,
          status: { notIn: [WITNESS_STATUS.REVOKED, WITNESS_STATUS.SUPERSEDED] },
        },
        select: { id: true },
      });
      if (existing) throw new Error("You already have a witness for the current version.");

      const witness = await tx.dealWitness.create({
        data: {
          dealId: invitation.dealId,
          witnessedPartyId: invitation.partyId,
          addedByPartyId: invitation.partyId,
          documentId: document.id,
          fullName,
          email: contact.email || null,
          phoneNumber: contact.phone || null,
          tokenHash: sha256(witnessToken),
          status: WITNESS_STATUS.INVITED,
          required,
          expiresAt,
          documentSha256: document.sha256,
        },
      });
      await appendEvent(tx, {
        dealId: invitation.dealId,
        eventType: EVENT.WITNESS_INVITED,
        description: `${fullName} was invited as a witness for ${invitation.party.fullName}.`,
        actorPartyId: invitation.partyId,
        metadata: {
          witnessId: witness.id,
          witnessedPartyId: invitation.partyId,
          documentId: document.id,
          required,
          expiresAt: expiresAt.toISOString(),
        },
      });
    });

    revalidatePath(`/deals/${invitation.dealId}`);
    revalidatePath(`/invite/${token}`);
    return {
      ok: true,
      success: `Witness link created for ${fullName}. Share it with the witness so they can verify their contact.`,
      url: appUrl(`/witness/${witnessToken}`),
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
    revalidatePath(`/deals/${dealId}`);
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
          acceptedAt: null,
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
    if (witnessExecutionClosed(witness)) {
      return { error: "This deal has already been executed or closed." };
    }
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
    if (witnessExecutionClosed(witness)) {
      return { error: "This deal has already been executed or closed." };
    }
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
    revalidatePath(`/deals/${witness.dealId}`);
    return { ok: true, success: "Contact verified. Confirm your intention to witness next." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function acceptWitnessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  try {
    const witness = await findWitness(token);
    if (!witness) return { error: "Witness link not found." };
    const problem = witnessProblem(witness);
    if (problem) return { error: problem };
    if (!witness.verifiedAt) return { error: "Verify your email or phone first." };
    if (witnessExecutionClosed(witness)) {
      return { error: "This deal has already been executed or closed." };
    }
    if (witness.status === WITNESS_STATUS.ACCEPTED || witness.status === WITNESS_STATUS.ATTESTED) {
      return { ok: true, success: "Your intention to witness is already recorded." };
    }
    if (witness.status !== WITNESS_STATUS.VERIFIED) {
      return { error: "Verify your contact before accepting this witness invitation." };
    }
    requireConsent(formData.get("consent"));

    const acceptedAt = new Date();
    const updated = await db.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: witness.dealId },
        select: { status: true, executedAt: true },
      });
      if (!deal || deal.executedAt || CLOSED_FOR_WITNESS.includes(deal.status as never)) {
        return false;
      }
      const result = await tx.dealWitness.updateMany({
        where: { id: witness.id, status: WITNESS_STATUS.VERIFIED },
        data: { status: WITNESS_STATUS.ACCEPTED, acceptedAt },
      });
      if (result.count === 0) return false;
      await appendEvent(tx, {
        dealId: witness.dealId,
        eventType: EVENT.WITNESS_ACCEPTED,
        description: `${witness.fullName} accepted the invitation to witness ${witness.witnessedParty.fullName}.`,
        metadata: {
          witnessId: witness.id,
          witnessedPartyId: witness.witnessedPartyId,
          documentId: witness.documentId,
          documentSha256: witness.document?.sha256 ?? null,
          acceptedAt: acceptedAt.toISOString(),
          acceptanceTextVersion: "witness-accept-v1",
        },
      });
      return true;
    });

    if (!updated) {
      const latest = await findWitness(token);
      if (latest?.status !== WITNESS_STATUS.ACCEPTED && latest?.status !== WITNESS_STATUS.ATTESTED) {
        return { error: "This witness invitation changed. Reload the page and try again." };
      }
    }

    if (updated) {
      await notifyDealParties(witness.dealId, {
        type: "WITNESS_ACCEPTED",
        title: "Witness accepted",
        body: `${witness.fullName} accepted the invitation to witness ${witness.witnessedParty.fullName} on "${witness.deal.title}".`,
        dealId: witness.dealId,
      });
    }

    revalidatePath(`/witness/${token}`);
    revalidatePath(`/deals/${witness.dealId}`);
    revalidatePath("/notifications");
    return {
      ok: true,
      success: "Your intention to witness is recorded. You must still observe the signature and submit a separate attestation.",
    };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function attestWitnessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  let destination = "";
  let dealId = "";
  try {
    const witness = await findWitness(token);
    if (!witness) return { error: "Witness link not found." };
    dealId = witness.dealId;
    const problem = witnessProblem(witness);
    if (problem) return { error: problem };
    if (!witness.verifiedAt) return { error: "Verify your email or phone first." };
    if (witnessExecutionClosed(witness)) {
      return { error: "This deal has already been executed. Witness attestations are locked." };
    }
    if (witness.status !== WITNESS_STATUS.ACCEPTED) {
      return { error: "Accept the witness invitation before submitting an attestation." };
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

    const signatureType = parseSignatureType(String(formData.get("signatureType") ?? "drawn"));
    if (!signatureType) return { error: "Choose a valid signature method." };
    const signatureData = String(formData.get("signatureData") ?? "");
    let signatureKey: string | null = null;
    const png = signatureType === "typed" ? null : await decodeSignature(signatureData);
    if (signatureType !== "typed" && !png) {
      return { error: "Please provide a valid drawn or uploaded signature image." };
    }
    if (png) {
      signatureKey = `deals/${witness.dealId}/witnesses/${witness.id}-${Date.now()}-${safeFileName(signerName)}.png`;
      await putFile(signatureKey, png);
    }

    const meta = await getRequestMeta();
    const now = new Date();
    const updated = await db.$transaction(async (tx) => {
      const deal = await tx.deal.findUnique({
        where: { id: witness.dealId },
        select: { status: true, currentVersion: true, executedAt: true },
      });
      if (
        !deal ||
        deal.executedAt ||
        CLOSED_FOR_WITNESS.includes(deal.status as never) ||
        deal.currentVersion !== witness.document?.versionNumber
      ) {
        return false;
      }
      const witnessedSignature = await tx.signature.findFirst({
        where: {
          documentId: witness.documentId ?? "",
          partyId: witness.witnessedPartyId,
        },
        select: { id: true },
      });
      if (!witnessedSignature) return false;
      const result = await tx.dealWitness.updateMany({
        where: {
          id: witness.id,
          status: WITNESS_STATUS.ACCEPTED,
          attestedAt: null,
        },
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
      if (result.count === 0) return false;
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
      return true;
    });
    if (!updated) {
      return { error: "The deal or witness record changed before this attestation was saved. Reload the page and check its status." };
    }

    await notifyDealParties(witness.dealId, {
      type: "WITNESS_ATTESTED",
      title: "Witness attested",
      body: `${signerName} attested as a witness for ${witness.witnessedParty.fullName} on "${witness.deal.title}".`,
      dealId: witness.dealId,
    });

    await executeDealIfReady(witness.dealId);
    destination = `/witness/${token}?attested=1`;
  } catch (error) {
    revalidatePath(`/witness/${token}`);
    if (dealId) {
      revalidatePath(`/deals/${dealId}`);
      revalidatePath("/dashboard");
    }
    return { error: errorMessage(error) };
  }

  revalidatePath(`/witness/${token}`);
  if (dealId) {
    revalidatePath(`/deals/${dealId}`);
    revalidatePath("/dashboard");
    revalidatePath("/notifications");
  }
  redirect(destination);
}
