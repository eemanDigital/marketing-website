"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { EVENT } from "@/lib/constants";
import { appendEvent } from "@/lib/events";
import { normalizeString } from "@/lib/utils";

async function audit(actorUserId: string, action: string, targetType: string, targetId: string, metadata: Record<string, unknown> = {}) {
  await db.adminAudit.create({
    data: {
      actorUserId,
      action,
      targetType,
      targetId,
      metadataJson: JSON.stringify(metadata),
    },
  });
}

export async function suspendUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const suspend = String(formData.get("suspend") ?? "1") === "1";
  if (userId === admin.id) throw new Error("You cannot suspend your own account.");

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { suspendedAt: suspend ? new Date() : null },
    });
    if (suspend) await tx.session.deleteMany({ where: { userId } });
  });
  await audit(admin.id, suspend ? "USER_SUSPENDED" : "USER_UNSUSPENDED", "User", userId);
  revalidatePath("/admin");
}

export async function revokeSealAction(formData: FormData) {
  const admin = await requireAdmin();
  const sealId = String(formData.get("sealId") ?? "");
  const reason = normalizeString(formData.get("reason"), 500) || "Revoked by administrator";
  const seal = await db.dealSeal.findUnique({ where: { id: sealId } });
  if (!seal) throw new Error("Seal not found.");

  await db.$transaction(async (tx) => {
    await tx.dealSeal.update({
      where: { id: sealId },
      data: { status: "REVOKED", revokedAt: new Date(), revocationReason: reason },
    });
    await appendEvent(tx, {
      dealId: seal.dealId,
      eventType: EVENT.SEAL_REVOKED,
      description: `Verification seal revoked. Reason: ${reason}`,
    });
  });
  await audit(admin.id, "SEAL_REVOKED", "DealSeal", sealId, { reason });
  revalidatePath("/admin");
  revalidatePath(`/verify/${seal.verificationToken}`);
}

export async function adminRevokeInvitationAction(formData: FormData) {
  const admin = await requireAdmin();
  const invitationId = String(formData.get("invitationId") ?? "");
  await db.invitation.update({
    where: { id: invitationId },
    data: { revokedAt: new Date(), status: "REVOKED" },
  });
  await audit(admin.id, "INVITATION_REVOKED", "Invitation", invitationId);
  revalidatePath("/admin");
  redirect("/admin?revoked=1");
}
