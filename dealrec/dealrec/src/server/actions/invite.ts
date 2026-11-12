"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getRequestMeta } from "@/lib/auth";
import {
  AUTH_LEVEL,
  CONSENT_TEXT_VERSION,
  DEAL_STATUS,
  DOCUMENT_TYPE,
  EVENT,
  INVITATION_STATUS,
  MAX_SIGNATURE_BYTES,
  OTP_PURPOSE,
} from "@/lib/constants";
import { createOtp, verifyOtp } from "@/lib/otp";
import { findInvitation, recordSignature, executeDealIfReady } from "@/lib/deals";
import { appendEvent } from "@/lib/events";
import { sendEmail, sendSms, otpEmailHtml } from "@/lib/mail";
import { notifyDealParties } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isPng, putFile, safeFileName } from "@/lib/storage";
import { normalizeString } from "@/lib/utils";
import { requireConsent, requireText } from "@/lib/validation";
import { type ActionState, errorMessage } from "../action-state";

function devCode(code: string) {
  return process.env.NODE_ENV === "production" ? undefined : code;
}

function channelFor(party: { email: string | null; phoneNumber: string | null }) {
  if (party.email) return { channel: "email" as const, target: party.email };
  if (party.phoneNumber) return { channel: "phone" as const, target: party.phoneNumber };
  return null;
}

function invitationProblem(invitation: NonNullable<Awaited<ReturnType<typeof findInvitation>>>) {
  if (invitation.revokedAt) return "This invitation link has been revoked.";
  if (invitation.expiresAt.getTime() < Date.now()) return "This invitation link has expired.";
  if ([DEAL_STATUS.CANCELLED, DEAL_STATUS.VOIDED].includes(invitation.deal.status as never)) {
    return "This deal is no longer open.";
  }
  return null;
}

export async function trackInvitationOpenAction(token: string) {
  try {
    const invitation = await findInvitation(token);
    if (!invitation || invitationProblem(invitation)) return { ok: false };
    enforceRateLimit(`invite-open:${invitation.id}`, 10, 60 * 1000);

    const firstOpen = invitation.openCount === 0;
    await db.invitation.update({
      where: { id: invitation.id },
      data: { openCount: { increment: 1 }, lastOpenedAt: new Date() },
    });

    if (firstOpen) {
      await db.$transaction(async (tx) => {
        if (invitation.party.invitationStatus === INVITATION_STATUS.SENT) {
          await tx.dealParty.update({
            where: { id: invitation.partyId },
            data: { invitationStatus: INVITATION_STATUS.OPENED },
          });
        }
        if (invitation.deal.status === DEAL_STATUS.AWAITING_COUNTERPARTY) {
          await tx.deal.update({
            where: { id: invitation.dealId },
            data: { status: DEAL_STATUS.UNDER_REVIEW },
          });
        }
        await appendEvent(tx, {
          dealId: invitation.dealId,
          eventType: EVENT.INVITATION_OPENED,
          description: "The invitation link was opened.",
          actorPartyId: invitation.partyId,
          metadata: { invitationId: invitation.id },
        });
        await appendEvent(tx, {
          dealId: invitation.dealId,
          eventType: EVENT.DOCUMENT_VIEWED,
          description: "The deal page was viewed through the invitation link.",
          actorPartyId: invitation.partyId,
          metadata: { invitationId: invitation.id },
        });
      });
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function sendInviteOtpAction(token: string): Promise<ActionState> {
  try {
    const invitation = await findInvitation(token);
    if (!invitation) return { error: "Invitation not found." };
    const problem = invitationProblem(invitation);
    if (problem) return { error: problem };
    if (invitation.verifiedAt) return { ok: true, success: "This contact is already verified." };

    const channel = channelFor(invitation.party);
    if (!channel) return { error: "This invitation has no email or phone number for verification." };

    enforceRateLimit(`invite-otp:${invitation.partyId}`, 5, 15 * 60 * 1000);
    enforceRateLimit(`invite-otp-target:${channel.target}`, 5, 15 * 60 * 1000);

    const { code } = await createOtp({
      purpose: OTP_PURPOSE.INVITE_VERIFY,
      channel: channel.channel,
      target: channel.target,
    });

    if (channel.channel === "email") {
      await sendEmail({
        to: channel.target,
        subject: `Review "${invitation.deal.title}" on dealrec`,
        html: otpEmailHtml(code, "the invitation to review and sign"),
        text: `Your dealrec verification code is ${code}. It expires in 10 minutes.`,
      });
    } else {
      await sendSms(channel.target, `Your dealrec verification code is ${code}. It expires in 10 minutes.`);
    }

    return {
      ok: true,
      success:
        channel.channel === "email"
          ? `A code was sent to ${channel.target}.`
          : `A code was sent by SMS to ${channel.target}.`,
      devCode: devCode(code),
    };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function verifyInviteOtpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  try {
    const invitation = await findInvitation(token);
    if (!invitation) return { error: "Invitation not found." };
    const problem = invitationProblem(invitation);
    if (problem) return { error: problem };
    const channel = channelFor(invitation.party);
    if (!channel) return { error: "This invitation has no contact channel to verify." };

    enforceRateLimit(`invite-verify:${invitation.partyId}`, 10, 15 * 60 * 1000);
    await verifyOtp({
      purpose: OTP_PURPOSE.INVITE_VERIFY,
      channel: channel.channel,
      target: channel.target,
      code: String(formData.get("code") ?? ""),
    });

    const authLevel =
      channel.channel === "email" ? AUTH_LEVEL.EMAIL_VERIFIED : AUTH_LEVEL.PHONE_OTP_VERIFIED;

    await db.$transaction(async (tx) => {
      await tx.dealParty.update({
        where: { id: invitation.partyId },
        data: { authenticationLevel: authLevel, joinedAt: invitation.party.joinedAt ?? new Date() },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          verifiedAt: new Date(),
          verifyMethod: channel.channel === "email" ? "EMAIL_OTP" : "PHONE_OTP",
          status: INVITATION_STATUS.VERIFIED,
        },
      });
      await appendEvent(tx, {
        dealId: invitation.dealId,
        eventType: EVENT.CONTACT_VERIFIED,
        description: `${channel.channel === "email" ? "Email" : "Phone"} control was verified with a one-time code.`,
        actorPartyId: invitation.partyId,
        metadata: { method: channel.channel, invitationId: invitation.id },
      });
    });

    revalidatePath(`/invite/${token}`);
    return { ok: true, success: "Contact verified. You can now review and sign." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function respondInvitationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const decision = String(formData.get("decision") ?? "");
  try {
    const invitation = await findInvitation(token);
    if (!invitation) return { error: "Invitation not found." };
    const problem = invitationProblem(invitation);
    if (problem) return { error: problem };
    if (!invitation.verifiedAt) return { error: "Verify your email or phone first." };
    if (invitation.party.invitationStatus === INVITATION_STATUS.SIGNED) {
      return { error: "You have already signed this deal." };
    }

    if (decision === "accept") {
      await db.$transaction(async (tx) => {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: INVITATION_STATUS.ACCEPTED },
        });
        await tx.dealParty.update({
          where: { id: invitation.partyId },
          data: { invitationStatus: INVITATION_STATUS.ACCEPTED },
        });
        await appendEvent(tx, {
          dealId: invitation.dealId,
          eventType: EVENT.INVITATION_ACCEPTED,
          description: "The other party accepted the invitation and agreed to review the terms.",
          actorPartyId: invitation.partyId,
          metadata: { invitationId: invitation.id },
        });
      });
      revalidatePath(`/invite/${token}`);
      return { ok: true, success: "Invitation accepted. Please sign the agreement." };
    }

    if (decision === "change") {
      const message = requireText(formData.get("message"), "What would you like changed?", {
        min: 2,
        max: 2000,
      });
      await db.$transaction(async (tx) => {
        await tx.dealComment.create({
          data: {
            dealId: invitation.dealId,
            authorPartyId: invitation.partyId,
            message,
            kind: "CHANGE_REQUESTED",
          },
        });
        await tx.deal.update({
          where: { id: invitation.dealId },
          data: { status: DEAL_STATUS.CHANGE_REQUESTED },
        });
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: INVITATION_STATUS.CHANGE_REQUESTED },
        });
        await tx.dealParty.update({
          where: { id: invitation.partyId },
          data: { invitationStatus: INVITATION_STATUS.CHANGE_REQUESTED },
        });
        await appendEvent(tx, {
          dealId: invitation.dealId,
          eventType: EVENT.CHANGE_REQUESTED,
          description: "The other party requested a change to the agreement.",
          actorPartyId: invitation.partyId,
          metadata: { invitationId: invitation.id, message },
        });
      });
      await notifyDealParties(invitation.dealId, {
        type: "CHANGE_REQUESTED",
        title: "Change requested",
        body: `${invitation.party.fullName} requested a change to "${invitation.deal.title}". Review the comment and create a revised version.`,
        dealId: invitation.dealId,
        excludePartyId: invitation.partyId,
        email: true,
      });
      revalidatePath(`/invite/${token}`);
      return { ok: true, success: "Change request sent to the creator." };
    }

    if (decision === "decline") {
      const reason = normalizeString(formData.get("message"), 1000);
      await db.$transaction(async (tx) => {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: INVITATION_STATUS.DECLINED },
        });
        await tx.dealParty.update({
          where: { id: invitation.partyId },
          data: { invitationStatus: INVITATION_STATUS.DECLINED },
        });
        await tx.deal.update({
          where: { id: invitation.dealId },
          data: {
            status: DEAL_STATUS.CANCELLED,
            cancelledAt: new Date(),
            closedReason: reason || "Declined by the other party",
          },
        });
        await tx.invitation.updateMany({
          where: { dealId: invitation.dealId, revokedAt: null },
          data: { revokedAt: new Date(), status: "REVOKED" },
        });
        await appendEvent(tx, {
          dealId: invitation.dealId,
          eventType: EVENT.INVITATION_DECLINED,
          description: `The other party declined the deal.${reason ? ` Reason: ${reason}` : ""}`,
          actorPartyId: invitation.partyId,
          metadata: { reason },
        });
      });
      await notifyDealParties(invitation.dealId, {
        type: "INVITATION_DECLINED",
        title: "Deal declined",
        body: `${invitation.party.fullName} declined "${invitation.deal.title}".${reason ? ` Reason: ${reason}` : ""}`,
        dealId: invitation.dealId,
        excludePartyId: invitation.partyId,
        email: true,
      });
      revalidatePath(`/invite/${token}`);
      return { ok: true, success: "The deal has been declined and closed." };
    }

    return { error: "Choose an action." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
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

export async function signInvitationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  let destination = "";
  try {
    const invitation = await findInvitation(token);
    if (!invitation) return { error: "Invitation not found." };
    const problem = invitationProblem(invitation);
    if (problem) return { error: problem };
    if (!invitation.verifiedAt) return { error: "Verify your email or phone first." };

    const deal = invitation.deal;
    const document = deal.documents.find(
      (item) =>
        item.versionNumber === deal.currentVersion &&
        (item.documentType === DOCUMENT_TYPE.DRAFT ||
          item.documentType === DOCUMENT_TYPE.UPLOADED_ORIGINAL),
    );
    if (!document) return { error: "The current agreement version could not be found." };

    enforceRateLimit(`invite-sign:${invitation.partyId}`, 5, 10 * 60 * 1000);
    const signerName = requireText(formData.get("signerName"), "Your full name", {
      min: 2,
      max: 120,
    });
    requireConsent(formData.get("consent"));
    const signatureType = String(formData.get("signatureType") ?? "drawn");
    const signatureData = String(formData.get("signatureData") ?? "");

    let signatureKey: string | null = null;
    const png = signatureType === "drawn" ? decodeSignature(signatureData) : null;
    if (signatureType === "drawn" && !png) {
      return { error: "Please draw your signature or choose typed signature." };
    }
    if (png) {
      signatureKey = `deals/${deal.id}/signatures/${invitation.partyId}-${Date.now()}-${safeFileName(signerName)}.png`;
      await putFile(signatureKey, png);
    }

    const meta = await getRequestMeta();
    const result = await recordSignature({
      dealId: deal.id,
      partyId: invitation.partyId,
      documentId: document.id,
      signerName,
      signatureType,
      authenticationMethod: invitation.party.authenticationLevel,
      consentTextVersion: CONSENT_TEXT_VERSION,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      signatureAssetKey: signatureKey,
    });

    const fullyExecuted = result.allSigned && !result.witnessesPending;
    if (fullyExecuted) {
      await executeDealIfReady(deal.id);
    }

    await notifyDealParties(deal.id, {
      type: fullyExecuted ? "DEAL_EXECUTED" : "PARTY_SIGNED",
      title: fullyExecuted ? "Deal fully signed" : "Agreement signed by the other party",
      body: fullyExecuted
        ? `All parties and required witnesses completed "${deal.title}". The executed record is available.`
        : result.witnessesPending
          ? `All parties signed "${deal.title}". Required witnesses must attest before execution.`
          : `${invitation.party.fullName} signed "${deal.title}".`,
      dealId: deal.id,
      excludePartyId: invitation.partyId,
      email: true,
    });

    destination = `/invite/${token}?signed=1`;
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath(`/invite/${token}`);
  redirect(destination);
}
