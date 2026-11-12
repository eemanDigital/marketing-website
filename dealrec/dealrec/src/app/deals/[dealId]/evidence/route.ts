import type { NextRequest } from "next/server";
import { getDealAccess } from "@/lib/deals";
import { findInvitation } from "@/lib/deals";
import { findWitness, witnessProblem } from "@/lib/witness";
import { buildEvidencePack } from "@/lib/evidence";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/deals/[dealId]/evidence">,
) {
  const { dealId } = await ctx.params;
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

  if (!allowed) return new Response("Not found", { status: 404 });

  try {
    const pack = await buildEvidencePack(dealId);
    return new Response(new Uint8Array(pack.zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(pack.zip.length),
        "Content-Disposition": `attachment; filename="${pack.fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Evidence pack is not available.",
      { status: 409 },
    );
  }
}
