import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDealAccess } from "@/lib/deals";
import { findInvitation } from "@/lib/deals";
import { findWitness, witnessProblem } from "@/lib/witness";
import { getFile, safeFileName } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/deals/[dealId]/documents/[documentId]">,
) {
  const { dealId, documentId } = await ctx.params;
  let allowed = Boolean(await getDealAccess(dealId));

  if (!allowed) {
    const token = request.nextUrl.searchParams.get("token");
    if (token) {
      const invitation = await findInvitation(token);
      allowed = Boolean(invitation && invitation.dealId === dealId && !invitation.revokedAt);
    }
    const witnessToken = request.nextUrl.searchParams.get("witnessToken");
    if (!allowed && witnessToken) {
      const witness = await findWitness(witnessToken);
      allowed = Boolean(witness && witness.dealId === dealId && !witnessProblem(witness));
    }
  }

  if (!allowed) {
    return new Response("Not found", { status: 404 });
  }

  const document = await db.dealDocument.findFirst({
    where: { id: documentId, dealId },
  });
  if (!document) return new Response("Not found", { status: 404 });

  try {
    const bytes = await getFile(document.storageKey);
    const fileName = safeFileName(document.originalName ?? `${document.documentType}.pdf`);
    return new Response(bytes, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("File unavailable", { status: 404 });
  }
}
