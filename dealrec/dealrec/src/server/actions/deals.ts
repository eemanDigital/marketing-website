"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DEAL_STATUS, DOCUMENT_TYPE, EVENT, OBLIGATION_STATUS } from "@/lib/constants";
import {
  createDealRecord,
  createInvitation,
  createVersion,
  executeDealIfReady,
  getDealAccess,
  getFullDeal,
  paymentSummary,
  safeValues,
} from "@/lib/deals";
import {
  changedFields,
  getTemplate,
  templateAmount,
  validateTemplateValues,
} from "@/lib/templates";
import { appendEvent } from "@/lib/events";
import { parseDateInput, normalizeString } from "@/lib/utils";
import { notifyDealParties } from "@/lib/notifications";
import { putFile, safeFileName, validateUpload } from "@/lib/storage";
import { enforceRateLimit } from "@/lib/rate-limit";
import { parseOptionalMoney, requireText, validateContact } from "@/lib/validation";
import { type ActionState, errorMessage } from "../action-state";

async function requireDealParty(dealId: string) {
  const access = await getDealAccess(dealId);
  if (!access) throw new Error("You do not have access to this deal.");
  return access;
}

function revalidateDeal(dealId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
}

async function finishDealSetup(dealId: string, creatorPartyId: string, counterpartyPartyId: string) {
  const invitation = await createInvitation({
    dealId,
    partyId: counterpartyPartyId,
    actorPartyId: creatorPartyId,
  });
  return invitation;
}

export async function createTemplateDealAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect("/verify-account");

  const templateSlug = String(formData.get("templateSlug") ?? "");
  const template = getTemplate(templateSlug);
  if (!template) return { error: "Choose a valid deal template." };

  let dealId = "";
  try {
    enforceRateLimit(`create-deal:${user.id}`, 20, 60 * 60 * 1000);
    const title = requireText(formData.get("title"), "Deal title", { min: 3, max: 160 });
    const counterpartyName = requireText(formData.get("counterpartyName"), "The other party's name", {
      min: 2,
      max: 120,
    });
    const contact = validateContact(
      normalizeString(formData.get("counterpartyEmail"), 200),
      normalizeString(formData.get("counterpartyPhone"), 30),
    );

    const values = validateTemplateValues(templateSlug, {
      ...Object.fromEntries(formData.entries()),
    });

    const deal = await createDealRecord({
      userId: user.id,
      userFullName: user.fullName,
      userEmail: user.email,
      title,
      dealType: template.slug,
      templateSlug: template.slug,
      templateVersion: template.version,
      values,
      totalAmount: templateAmount(template.slug, values),
      counterpartyName,
      counterpartyEmail: contact.email,
      counterpartyPhone: contact.phone,
      creatorRole: template.creatorRole,
      counterpartyRole: template.counterpartyRole,
    });

    dealId = deal.id;
    const full = await getFullDeal(deal.id);
    if (!full) throw new Error("Deal could not be loaded after creation.");
    const creatorParty = full.parties.find((party) => party.isCreator);
    const counterparty = full.parties.find((party) => !party.isCreator);
    if (!creatorParty || !counterparty) throw new Error("Deal parties were not created.");

    await createVersion({
      deal: full,
      actorUserId: user.id,
      actorPartyId: creatorParty.id,
      values,
    });

    await finishDealSetup(deal.id, creatorParty.id, counterparty.id);
  } catch (error) {
    const fieldErrors = (error as { fieldErrors?: Record<string, string> }).fieldErrors;
    return { error: errorMessage(error), fieldErrors };
  }

  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}?tab=invite&created=1`);
}

export async function createUploadedDealAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user.emailVerifiedAt) redirect("/verify-account");

  let dealId = "";
  try {
    enforceRateLimit(`create-deal:${user.id}`, 20, 60 * 60 * 1000);
    const title = requireText(formData.get("title"), "Deal title", { min: 3, max: 160 });
    const counterpartyName = requireText(formData.get("counterpartyName"), "The other party's name", {
      min: 2,
      max: 120,
    });
    const contact = validateContact(
      normalizeString(formData.get("counterpartyEmail"), 200),
      normalizeString(formData.get("counterpartyPhone"), 30),
    );
    const creatorRole = normalizeString(formData.get("creatorRole"), 80) || "Party A";
    const counterpartyRole = normalizeString(formData.get("counterpartyRole"), 80) || "Party B";
    const amount = parseOptionalMoney(formData.get("totalAmount"));

    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("Choose a PDF agreement to upload.");
    const upload = await validateUpload(file);
    if (upload.mimeType !== "application/pdf") {
      throw new Error("Upload the agreement as a PDF file.");
    }

    const deal = await createDealRecord({
      userId: user.id,
      userFullName: user.fullName,
      userEmail: user.email,
      title,
      dealType: "uploaded",
      templateSlug: null,
      templateVersion: null,
      values: {},
      totalAmount: amount,
      counterpartyName,
      counterpartyEmail: contact.email,
      counterpartyPhone: contact.phone,
      creatorRole,
      counterpartyRole,
      uploaded: { bytes: upload.bytes, mimeType: upload.mimeType, fileName: upload.fileName },
    });

    dealId = deal.id;
    const full = await getFullDeal(deal.id);
    if (!full) throw new Error("Deal could not be loaded after creation.");
    const creatorParty = full.parties.find((party) => party.isCreator);
    const counterparty = full.parties.find((party) => !party.isCreator);
    if (!creatorParty || !counterparty) throw new Error("Deal parties were not created.");

    await createVersion({
      deal: full,
      actorUserId: user.id,
      actorPartyId: creatorParty.id,
      values: {},
      uploadedBytes: upload.bytes,
      uploadedMime: upload.mimeType,
      uploadedName: safeFileName(upload.fileName),
    });

    await finishDealSetup(deal.id, creatorParty.id, counterparty.id);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}?tab=invite&created=1`);
}

export async function sendInvitationAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "");
  const { deal, user } = await requireDealParty(dealId);
  if (deal.creatorId !== user.id) throw new Error("Only the deal creator can send invitations.");
  if (deal.status === DEAL_STATUS.EXECUTED || deal.status === DEAL_STATUS.CANCELLED) {
    throw new Error("This deal can no longer be invited.");
  }
  const counterparty = deal.parties.find((party) => !party.isCreator);
  if (!counterparty) throw new Error("There is no other party to invite.");
  const creatorParty = deal.parties.find((party) => party.isCreator);

  const invitation = await createInvitation({
    dealId,
    partyId: counterparty.id,
    actorPartyId: creatorParty?.id,
  });

  await notifyDealParties(dealId, {
    type: "PARTY_INVITED",
    title: "Agreement shared for review",
    body: `${user.fullName} shared "${deal.title}" for review and signing.`,
    dealId,
    excludePartyId: creatorParty?.id,
    email: true,
  });

  revalidateDeal(dealId);
  redirect(`/deals/${dealId}?tab=invite&sent=1&token=${encodeURIComponent(invitation.token)}`);
}

export async function createNewVersionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dealId = String(formData.get("dealId") ?? "");
  let redirectTo = "";
  try {
    const { deal, user } = await requireDealParty(dealId);
    if (deal.creatorId !== user.id) return { error: "Only the deal creator can create a new version." };
    if (deal.status === DEAL_STATUS.EXECUTED) {
      return { error: "An executed agreement cannot be silently amended. Use a new deal or amendment process." };
    }
    const template = getTemplate(deal.templateSlug);
    if (!template) return { error: "This deal has no editable template." };

    const values = validateTemplateValues(template.slug, {
      ...Object.fromEntries(formData.entries()),
    });
    const previous = safeValues(deal);
    const changes = changedFields(template.slug, previous, values);
    if (changes.length === 0) return { error: "No changes were made." };

    const creatorParty = deal.parties.find((party) => party.isCreator);
    if (!creatorParty) return { error: "Creator party not found." };

    const result = await createVersion({
      deal,
      actorUserId: user.id,
      actorPartyId: creatorParty.id,
      values,
      changeSummary: changes.join("\n"),
    });

    const counterparty = deal.parties.find((party) => !party.isCreator);
    if (counterparty) {
      await createInvitation({
        dealId,
        partyId: counterparty.id,
        actorPartyId: creatorParty.id,
      });
    }

    await db.deal.update({
      where: { id: dealId },
      data: { totalAmount: templateAmount(template.slug, values) },
    });

    await notifyDealParties(dealId, {
      type: "DOCUMENT_VERSION_CREATED",
      title: "Revised agreement available",
      body: `${user.fullName} created version ${result.version} of "${deal.title}". Please review and sign the new version.`,
      dealId,
      excludePartyId: creatorParty.id,
      email: true,
    });

    redirectTo = `/deals/${dealId}?tab=agreement&version=${result.version}`;
  } catch (error) {
    const fieldErrors = (error as { fieldErrors?: Record<string, string> }).fieldErrors;
    return { error: errorMessage(error), fieldErrors };
  }

  revalidateDeal(dealId);
  redirect(redirectTo);
}

export async function addCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dealId = String(formData.get("dealId") ?? "");
  try {
    const { deal, party, user } = await requireDealParty(dealId);
    const message = requireText(formData.get("message"), "Comment", { min: 1, max: 3000 });
    const author = party ?? deal.parties.find((item) => item.userId === user.id);
    if (!author) return { error: "Only deal parties can comment." };

    let attachmentId: string | null = null;
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      const upload = await validateUpload(file);
      const key = `deals/${dealId}/attachments/${Date.now()}-${safeFileName(upload.fileName)}`;
      await putFile(key, upload.bytes);
      const document = await db.dealDocument.create({
        data: {
          dealId,
          versionNumber: deal.currentVersion,
          documentType: "attachment",
          storageKey: key,
          originalName: safeFileName(upload.fileName),
          mimeType: upload.mimeType,
          fileSize: upload.size,
          sha256: upload.sha256,
          createdBy: user.id,
        },
      });
      attachmentId = document.id;
    }

    await db.$transaction(async (tx) => {
      const created = await tx.dealComment.create({
        data: {
          dealId,
          authorPartyId: author.id,
          message,
          attachmentDocumentId: attachmentId,
        },
      });
      await appendEvent(tx, {
        dealId,
        eventType: EVENT.COMMENT_ADDED,
        description: "Comment added to the deal.",
        actorPartyId: author.id,
        metadata: { commentId: created.id, attachment: Boolean(attachmentId) },
      });
      return created;
    });

    await notifyDealParties(dealId, {
      type: "COMMENT_ADDED",
      title: "New comment on your deal",
      body: `${author.fullName} added a comment to "${deal.title}".`,
      dealId,
      excludePartyId: author.id,
    });

    revalidateDeal(dealId);
    return { ok: true, success: "Comment added." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function addObligationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dealId = String(formData.get("dealId") ?? "");
  try {
    const { deal, party, user } = await requireDealParty(dealId);
    const author = party ?? deal.parties.find((item) => item.userId === user.id);
    const title = requireText(formData.get("title"), "Obligation title", { min: 2, max: 160 });
    const description = normalizeString(formData.get("description"), 2000) || null;
    const amount = parseOptionalMoney(formData.get("amount"));
    const dueAt = parseDateInput(formData.get("dueAt"));
    const responsiblePartyId = normalizeString(formData.get("responsiblePartyId"), 60) || null;
    if (responsiblePartyId && !deal.parties.some((item) => item.id === responsiblePartyId)) {
      return { error: "Choose a valid responsible party." };
    }

    await db.$transaction(async (tx) => {
      const created = await tx.obligation.create({
        data: {
          dealId,
          title,
          description,
          amount,
          dueAt,
          responsiblePartyId,
          kind: amount ? "PAYMENT" : "TASK",
        },
      });
      await appendEvent(tx, {
        dealId,
        eventType: EVENT.OBLIGATION_CREATED,
        description: `Obligation added: ${title}.`,
        actorPartyId: author?.id,
        metadata: { obligationId: created.id, amount, dueAt: dueAt?.toISOString() },
      });
    });

    await notifyDealParties(dealId, {
      type: "OBLIGATION_CREATED",
      title: "New obligation recorded",
      body: `${author?.fullName ?? "A party"} added "${title}" to "${deal.title}".`,
      dealId,
      excludePartyId: author?.id,
    });

    revalidateDeal(dealId);
    return { ok: true, success: "Obligation added." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function updateObligationAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "");
  const obligationId = String(formData.get("obligationId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (![OBLIGATION_STATUS.PENDING, OBLIGATION_STATUS.COMPLETED, OBLIGATION_STATUS.DISPUTED].includes(status as never)) {
    throw new Error("Invalid obligation status.");
  }
  const { deal, party, user } = await requireDealParty(dealId);
  const obligation = deal.obligations.find((item) => item.id === obligationId);
  if (!obligation) throw new Error("Obligation not found.");
  const actor = party ?? deal.parties.find((item) => item.userId === user.id);

  await db.$transaction(async (tx) => {
    await tx.obligation.update({
      where: { id: obligationId },
      data: {
        status,
        completedAt: status === OBLIGATION_STATUS.COMPLETED ? new Date() : null,
      },
    });
    await appendEvent(tx, {
      dealId,
      eventType:
        status === OBLIGATION_STATUS.COMPLETED
          ? EVENT.OBLIGATION_COMPLETED
          : status === OBLIGATION_STATUS.DISPUTED
            ? EVENT.OBLIGATION_DISPUTED
            : EVENT.OBLIGATION_CREATED,
      description: `Obligation "${obligation.title}" marked ${status.toLowerCase()}.`,
      actorPartyId: actor?.id,
      metadata: { obligationId },
    });
  });

  revalidateDeal(dealId);
}

export async function recordPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dealId = String(formData.get("dealId") ?? "");
  try {
    const { deal, party, user } = await requireDealParty(dealId);
    const recorder = party ?? deal.parties.find((item) => item.userId === user.id);
    if (!recorder) return { error: "Only deal parties can record payments." };

    const amount = Number(String(formData.get("amount") ?? "").replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid payment amount." };
    const paymentDate = parseDateInput(formData.get("paymentDate")) ?? new Date();
    const paymentMethod = requireText(formData.get("paymentMethod"), "Payment method", { max: 80 });
    const reference = normalizeString(formData.get("reference"), 120) || null;
    const notes = normalizeString(formData.get("notes"), 2000) || null;

    let receiptId: string | null = null;
    const file = formData.get("receipt");
    if (file instanceof File && file.size > 0) {
      const upload = await validateUpload(file);
      const key = `deals/${dealId}/receipts/${Date.now()}-${safeFileName(upload.fileName)}`;
      await putFile(key, upload.bytes);
      const document = await db.dealDocument.create({
        data: {
          dealId,
          versionNumber: deal.currentVersion,
          documentType: DOCUMENT_TYPE.RECEIPT,
          storageKey: key,
          originalName: safeFileName(upload.fileName),
          mimeType: upload.mimeType,
          fileSize: upload.size,
          sha256: upload.sha256,
          createdBy: user.id,
        },
      });
      receiptId = document.id;
    }

    await db.$transaction(async (tx) => {
      await tx.paymentRecord.create({
        data: {
          dealId,
          recordedByPartyId: recorder.id,
          amount: Math.round(amount),
          currency: deal.currency,
          paymentDate,
          paymentMethod,
          reference,
          notes,
          receiptDocumentId: receiptId,
          verificationStatus: "UNVERIFIED",
        },
      });
      await appendEvent(tx, {
        dealId,
        eventType: EVENT.PAYMENT_RECORDED,
        description: `Payment of ${amount.toLocaleString("en-NG")} NGN recorded by ${recorder.fullName}.`,
        actorPartyId: recorder.id,
        metadata: { amount: Math.round(amount), method: paymentMethod, reference, receipt: Boolean(receiptId) },
      });
      if (receiptId) {
        await appendEvent(tx, {
          dealId,
          eventType: EVENT.RECEIPT_ATTACHED,
          description: "Payment evidence attached.",
          actorPartyId: recorder.id,
          metadata: { receiptId },
        });
      }
    });

    await notifyDealParties(dealId, {
      type: "PAYMENT_RECORDED",
      title: "Payment recorded",
      body: `${recorder.fullName} recorded a payment on "${deal.title}". The payment is marked as recorded by a party, not independently verified.`,
      dealId,
      excludePartyId: recorder.id,
    });

    const refreshed = await getFullDeal(dealId);
    const summary = refreshed ? paymentSummary(refreshed) : null;
    revalidateDeal(dealId);
    return {
      ok: true,
      success: `Payment recorded.${summary?.outstanding !== null && summary ? ` Outstanding: ${summary.outstanding.toLocaleString("en-NG")} NGN.` : ""}`,
    };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function cancelDealAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "");
  const reason = normalizeString(formData.get("reason"), 1000);
  const { deal, user, party } = await requireDealParty(dealId);
  if (deal.creatorId !== user.id) throw new Error("Only the creator can cancel this deal.");
  if (deal.status === DEAL_STATUS.EXECUTED) {
    throw new Error("An executed deal must be voided, not cancelled.");
  }

  await db.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: dealId },
      data: {
        status: DEAL_STATUS.CANCELLED,
        cancelledAt: new Date(),
        closedReason: reason || "Cancelled by creator",
      },
    });
    await tx.invitation.updateMany({
      where: { dealId, revokedAt: null },
      data: { revokedAt: new Date(), status: "REVOKED" },
    });
    await appendEvent(tx, {
      dealId,
      eventType: EVENT.DEAL_CANCELLED,
      description: `Deal cancelled by the creator.${reason ? ` Reason: ${reason}` : ""}`,
      actorPartyId: party?.id,
      metadata: { reason },
    });
  });

  await notifyDealParties(dealId, {
    type: "DEAL_CANCELLED",
    title: "Deal cancelled",
    body: `"${deal.title}" was cancelled by the creator.${reason ? ` Reason: ${reason}` : ""}`,
    dealId,
  });
  revalidateDeal(dealId);
  redirect(`/deals/${dealId}?tab=overview&cancelled=1`);
}

export async function voidDealAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "");
  const reason = requireText(formData.get("reason"), "Reason for voiding", { min: 3, max: 1000 });
  const { deal, user, party } = await requireDealParty(dealId);
  if (deal.creatorId !== user.id) throw new Error("Only the creator can void this deal.");
  if (deal.status !== DEAL_STATUS.EXECUTED && deal.status !== DEAL_STATUS.ACTIVE) {
    throw new Error("Only an executed deal can be voided.");
  }

  await db.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: dealId },
      data: { status: DEAL_STATUS.VOIDED, closedReason: reason },
    });
    await tx.dealSeal.updateMany({
      where: { dealId },
      data: { status: "VOIDED", revokedAt: new Date(), revocationReason: reason },
    });
    await appendEvent(tx, {
      dealId,
      eventType: EVENT.DEAL_VOIDED,
      description: `Deal voided. Reason: ${reason}`,
      actorPartyId: party?.id,
      metadata: { reason },
    });
  });

  await notifyDealParties(dealId, {
    type: "DEAL_VOIDED",
    title: "Deal voided",
    body: `"${deal.title}" was voided by the creator. Reason: ${reason}`,
    dealId,
  });
  revalidateDeal(dealId);
  redirect(`/deals/${dealId}?tab=overview&voided=1`);
}

export async function markCompletedAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "");
  const { deal, party, user } = await requireDealParty(dealId);
  if (![DEAL_STATUS.EXECUTED, DEAL_STATUS.ACTIVE, DEAL_STATUS.OVERDUE].includes(deal.status as never)) {
    throw new Error("Only an executed deal can be completed.");
  }
  const actor = party ?? deal.parties.find((item) => item.userId === user.id);
  await db.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: dealId },
      data: { status: DEAL_STATUS.COMPLETED, completedAt: new Date() },
    });
    await appendEvent(tx, {
      dealId,
      eventType: EVENT.DEAL_COMPLETED,
      description: "Deal marked completed by a party.",
      actorPartyId: actor?.id,
    });
  });
  await notifyDealParties(dealId, {
    type: "DEAL_COMPLETED",
    title: "Deal marked completed",
    body: `"${deal.title}" was marked completed.`,
    dealId,
  });
  revalidateDeal(dealId);
}

export async function regenerateEvidenceAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "");
  const { deal, user } = await requireDealParty(dealId);
  if (deal.creatorId !== user.id && !user.isAdmin) {
    throw new Error("Only the creator can regenerate the evidence record.");
  }
  if (!(await getFullDeal(dealId))) throw new Error("Deal not found.");
  await executeDealIfReady(dealId);
  revalidateDeal(dealId);
}

export async function revokeInvitationAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "");
  const { deal, user, party } = await requireDealParty(dealId);
  if (deal.creatorId !== user.id) throw new Error("Only the creator can revoke invitations.");
  await db.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: { dealId, revokedAt: null },
      data: { revokedAt: new Date(), status: "REVOKED" },
    });
    await appendEvent(tx, {
      dealId,
      eventType: "INVITATION_REVOKED",
      description: "Active invitation links were revoked by the creator.",
      actorPartyId: party?.id,
    });
  });
  revalidateDeal(dealId);
  redirect(`/deals/${dealId}?tab=invite&revoked=1`);
}
