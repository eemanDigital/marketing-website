"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRequestMeta, requireUser } from "@/lib/auth";
import {
  AUTH_LEVEL,
  CONSENT_TEXT_VERSION,
  DEAL_STATUS,
  DOCUMENT_TYPE,
  MAX_SIGNATURE_BYTES,
} from "@/lib/constants";
import {
  executeDealIfReady,
  getDealAccess,
  recordSignature,
} from "@/lib/deals";
import { isPng, putFile, safeFileName } from "@/lib/storage";
import { notifyDealParties } from "@/lib/notifications";
import { requireConsent, requireText } from "@/lib/validation";
import { type ActionState, errorMessage } from "../action-state";

function decodeSignature(dataUrl: string) {
  const match = /^data:image\/png;base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  const buffer = Buffer.from(match[1], "base64");
  if (buffer.length === 0) return null;
  if (buffer.length > MAX_SIGNATURE_BYTES) throw new Error("The signature image is too large.");
  if (!isPng(buffer)) throw new Error("The signature image could not be read.");
  return buffer;
}

export async function signAsCreatorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dealId = String(formData.get("dealId") ?? "");
  let destination = "";
  try {
    const user = await requireUser();
    if (!user.emailVerifiedAt) {
      return { error: "Verify your email address before signing deals." };
    }
    const access = await getDealAccess(dealId);
    if (!access || access.deal.creatorId !== user.id) {
      return { error: "Only the deal creator can sign from this page." };
    }
    const { deal } = access;
    if (deal.status === DEAL_STATUS.EXECUTED) return { error: "This deal is already executed." };
    const party = deal.parties.find((item) => item.isCreator);
    if (!party) return { error: "Creator party not found." };
    const document = deal.documents.find(
      (item) =>
        item.versionNumber === deal.currentVersion &&
        (item.documentType === DOCUMENT_TYPE.DRAFT ||
          item.documentType === DOCUMENT_TYPE.UPLOADED_ORIGINAL),
    );
    if (!document) return { error: "The current agreement version could not be found." };
    if (deal.signatures.some((sig) => sig.documentId === document.id && sig.partyId === party.id)) {
      return { error: "You have already signed this version." };
    }

    const signerName = requireText(formData.get("signerName"), "Your full name", {
      min: 2,
      max: 120,
    });
    requireConsent(formData.get("consent"));
    const signatureType = String(formData.get("signatureType") ?? "drawn");
    const signatureData = String(formData.get("signatureData") ?? "");
    const png = signatureType === "drawn" ? decodeSignature(signatureData) : null;
    if (signatureType === "drawn" && !png) {
      return { error: "Please draw your signature or choose typed signature." };
    }

    let signatureKey: string | null = null;
    if (png) {
      signatureKey = `deals/${deal.id}/signatures/${party.id}-${Date.now()}-${safeFileName(signerName)}.png`;
      await putFile(signatureKey, png);
    }

    const meta = await getRequestMeta();
    const result = await recordSignature({
      dealId,
      partyId: party.id,
      documentId: document.id,
      signerName,
      signatureType,
      authenticationMethod: AUTH_LEVEL.ACCOUNT_SESSION,
      consentTextVersion: CONSENT_TEXT_VERSION,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      signatureAssetKey: signatureKey,
    });

    if (result.allSigned) await executeDealIfReady(dealId);

    await notifyDealParties(dealId, {
      type: result.allSigned ? "DEAL_EXECUTED" : "PARTY_SIGNED",
      title: result.allSigned ? "Deal fully signed" : "Agreement signed",
      body: result.allSigned
        ? `All parties signed "${deal.title}". The executed record is available.`
        : `${user.fullName} signed "${deal.title}".`,
      dealId,
      excludePartyId: party.id,
      email: true,
    });

    destination = `/deals/${dealId}?tab=agreement&signed=1`;
  } catch (error) {
    return { error: errorMessage(error) };
  }

  revalidatePath(`/deals/${dealId}`);
  redirect(destination);
}
