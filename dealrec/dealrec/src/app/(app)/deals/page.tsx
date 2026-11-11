import Link from "next/link";
import { FilePlus2, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { DEAL_STATUS } from "@/lib/constants";
import { getUserDeals, needsAction } from "@/lib/deal-list";
import { DealCard } from "@/components/deal-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Deals" };

const tabs = [
  { key: "all", label: "All" },
  { key: "action", label: "Needs action" },
  { key: "signing", label: "Signing" },
  { key: "executed", label: "Executed" },
  { key: "closed", label: "Closed" },
];

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { filter = "all", q = "" } = await searchParams;
  const deals = await getUserDeals(user.id);

  const query = q.trim().toLowerCase();
  const filtered = deals.filter((deal) => {
    if (query && !`${deal.title} ${deal.reference}`.toLowerCase().includes(query)) return false;
    if (filter === "action") return needsAction(deal, user.id);
    if (filter === "signing") {
      return [
        DEAL_STATUS.AWAITING_COUNTERPARTY,
        DEAL_STATUS.UNDER_REVIEW,
        DEAL_STATUS.AWAITING_CREATOR_SIGNATURE,
        DEAL_STATUS.AWAITING_OTHER_SIGNATURES,
        DEAL_STATUS.CHANGE_REQUESTED,
      ].includes(deal.status as never);
    }
    if (filter === "executed") {
      return [DEAL_STATUS.EXECUTED, DEAL_STATUS.ACTIVE].includes(deal.status as never);
    }
    if (filter === "closed") {
      return [DEAL_STATUS.COMPLETED, DEAL_STATUS.CANCELLED, DEAL_STATUS.VOIDED, DEAL_STATUS.SUPERSEDED].includes(
        deal.status as never,
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">My Deals</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Agreements you created or were invited to. {deals.length} total.
          </p>
        </div>
        <ButtonLink href="/deals/new">
          <FilePlus2 className="h-4 w-4" aria-hidden />
          Create a Deal
        </ButtonLink>
      </div>

      <form className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by title or reference"
          className="pl-9"
          aria-label="Search deals"
        />
        {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
      </form>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/deals?filter=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold",
              filter === tab.key
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FilePlus2 className="h-5 w-5" aria-hidden />}
          title={query ? "No deals match your search" : "No deals here yet"}
          description={
            query
              ? "Try a different title or reference."
              : "Create a deal from a template or upload your own PDF agreement."
          }
          action={
            <ButtonLink href="/deals/new" size="sm">
              Create a Deal
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((deal) => (
            <DealCard key={deal.id} deal={deal} action={needsAction(deal, user.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
