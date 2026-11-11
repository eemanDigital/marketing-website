import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { DEAL_STATUS, OBLIGATION_STATUS } from "@/lib/constants";
import { notifyDealParties } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ ok: false, error: "CRON_SECRET is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 86_400_000);

  const deals = await db.deal.findMany({
    where: {
      status: {
        notIn: [DEAL_STATUS.COMPLETED, DEAL_STATUS.CANCELLED, DEAL_STATUS.VOIDED, DEAL_STATUS.SUPERSEDED],
      },
      obligations: {
        some: {
          status: OBLIGATION_STATUS.PENDING,
          dueAt: { lte: soon },
        },
      },
    },
    include: { obligations: true },
  });

  let created = 0;
  for (const deal of deals) {
    const due = deal.obligations.filter(
      (obligation) =>
        obligation.status === OBLIGATION_STATUS.PENDING &&
        obligation.dueAt &&
        obligation.dueAt.getTime() <= soon.getTime(),
    );
    if (due.length === 0) continue;

    const overdue = due.filter((item) => item.dueAt!.getTime() < now.getTime());
    const recent = await db.notification.findFirst({
      where: {
        dealId: deal.id,
        type: overdue.length > 0 ? "OBLIGATION_OVERDUE" : "OBLIGATION_DUE_SOON",
        createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recent) continue;

    await notifyDealParties(deal.id, {
      type: overdue.length > 0 ? "OBLIGATION_OVERDUE" : "OBLIGATION_DUE_SOON",
      title: overdue.length > 0 ? "Overdue obligation" : "Payment or obligation due soon",
      body:
        overdue.length > 0
          ? `"${deal.title}" has ${overdue.length} overdue obligation(s).`
          : `"${deal.title}" has an obligation due within 3 days.`,
      dealId: deal.id,
      email: true,
    });
    created += 1;
  }

  return Response.json({ ok: true, dealsChecked: deals.length, remindersCreated: created });
}
