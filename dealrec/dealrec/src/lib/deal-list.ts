import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { CLOSED_STATUSES, DEAL_STATUS, OBLIGATION_STATUS } from "./constants";

export const dealListInclude = {
  creator: true,
  parties: true,
  payments: true,
  obligations: true,
  seals: true,
} satisfies Prisma.DealInclude;

export type DealListItem = Prisma.DealGetPayload<{ include: typeof dealListInclude }>;

export async function getUserDeals(userId: string, limit?: number) {
  return db.deal.findMany({
    where: {
      OR: [{ creatorId: userId }, { parties: { some: { userId } } }],
    },
    include: dealListInclude,
    orderBy: { updatedAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });
}

export function listPaymentSummary(deal: DealListItem) {
  const paid = deal.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const total = deal.totalAmount && deal.totalAmount > 0 ? deal.totalAmount : null;
  const outstanding = total === null ? null : Math.max(total - paid, 0);
  const now = Date.now();
  const pending = deal.obligations.filter(
    (item) => item.status === OBLIGATION_STATUS.PENDING && item.dueAt,
  );
  const overdue = pending.filter((item) => item.dueAt!.getTime() < now).length;
  const nextDue =
    pending
      .map((item) => item.dueAt!)
      .filter((date) => date.getTime() >= now)
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  return { paid, total, outstanding, overdue, nextDue };
}

export function isOpen(deal: DealListItem) {
  return !CLOSED_STATUSES.includes(deal.status as never) && deal.status !== DEAL_STATUS.EXECUTED;
}

export function needsAction(deal: DealListItem, userId: string) {
  if (!isOpen(deal)) return false;
  if (deal.status === DEAL_STATUS.CHANGE_REQUESTED) return true;
  if (deal.status === DEAL_STATUS.DRAFT) return deal.creatorId === userId;
  if (deal.status === DEAL_STATUS.AWAITING_COUNTERPARTY) return deal.creatorId === userId;
  if (deal.status === DEAL_STATUS.AWAITING_CREATOR_SIGNATURE) return deal.creatorId === userId;
  if (deal.status === DEAL_STATUS.AWAITING_OTHER_SIGNATURES) return deal.creatorId !== userId;
  return deal.status === DEAL_STATUS.UNDER_REVIEW;
}
