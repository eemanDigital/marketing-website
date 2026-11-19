import Link from "next/link";
import { FilePlus2, LayoutGrid, List, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserDeals, needsAction } from "@/lib/deal-list";
import { toTargetStatus } from "@/lib/ui-status";
import { DealCard } from "@/components/deal-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export const metadata = { title: "Agreements" };

type FilterKey = "all" | "draft" | "negotiating" | "awaiting_signature" | "sealed" | "disputed";
type SortKey = "updated" | "created" | "amount" | "status";
type ViewKey = "card" | "list";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "negotiating", label: "Negotiating" },
  { key: "awaiting_signature", label: "Awaiting signature" },
  { key: "sealed", label: "Signed" },
  { key: "disputed", label: "Disputed" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "updated", label: "Recently updated" },
  { key: "created", label: "Recently created" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

function buildHref(params: {
  filter?: string;
  q?: string;
  sort?: string;
  view?: string;
}) {
  const sp = new URLSearchParams();
  if (params.filter && params.filter !== "all") sp.set("filter", params.filter);
  if (params.q) sp.set("q", params.q);
  if (params.sort && params.sort !== "updated") sp.set("sort", params.sort);
  if (params.view && params.view !== "card") sp.set("view", params.view);
  const qs = sp.toString();
  return qs ? `/deals?${qs}` : "/deals";
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string; sort?: string; view?: string }>;
}) {
  const user = await requireUser();
  const { filter: rawFilter = "all", q = "", sort: rawSort = "updated", view: rawView = "card" } =
    await searchParams;

  const filter = (FILTERS.some((f) => f.key === rawFilter) ? rawFilter : "all") as FilterKey;
  const sort = (SORTS.some((s) => s.key === rawSort) ? rawSort : "updated") as SortKey;
  const view = (rawView === "list" ? "list" : "card") as ViewKey;

  const deals = await getUserDeals(user.id);
  const counts: Record<FilterKey, number> = {
    all: deals.length,
    draft: 0,
    negotiating: 0,
    awaiting_signature: 0,
    sealed: 0,
    disputed: 0,
  };
  for (const deal of deals) {
    const key = toTargetStatus(deal.status);
    counts[key] += 1;
  }

  const query = q.trim().toLowerCase();
  let filtered = deals.filter((deal) => {
    if (query && !`${deal.title} ${deal.reference}`.toLowerCase().includes(query)) return false;
    if (filter === "all") return true;
    return toTargetStatus(deal.status) === filter;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "amount") return (b.totalAmount ?? -1) - (a.totalAmount ?? -1);
    if (sort === "status") {
      const order = ["draft", "negotiating", "awaiting_signature", "sealed", "disputed"];
      return order.indexOf(toTargetStatus(a.status)) - order.indexOf(toTargetStatus(b.status));
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const visibleFilters = FILTERS.filter((f) => f.key !== "disputed" || counts.disputed > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[13px] font-medium text-ink-muted">Agreements</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Your agreements</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            {deals.length} total · track drafts, signatures, and sealed records.
          </p>
        </div>
        <ButtonLink href="/deals/new" className="shrink-0">
          <FilePlus2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Create agreement
        </ButtonLink>
      </div>

      <div className="flex flex-col gap-3">
        <form action="/deals" className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" strokeWidth={1.5} aria-hidden />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by title or reference"
              className="pl-10"
              aria-label="Search agreements"
            />
          </div>
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          {sort !== "updated" ? <input type="hidden" name="sort" value={sort} /> : null}
          {view !== "card" ? <input type="hidden" name="view" value={view} /> : null}
          <button type="submit" className="sr-only">Search</button>
        </form>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar -mx-1 flex min-w-0 items-center gap-1.5 overflow-x-auto px-1 py-1 lg:flex-1">
            {visibleFilters.map((item) => {
              const active = filter === item.key;
              return (
                <Link
                  key={item.key}
                  href={buildHref({ filter: item.key, q, sort, view })}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-2 text-[12px] font-semibold shadow-[var(--shadow-soft)] transition-colors",
                    active
                      ? "bg-primary text-white"
                      : "bg-surface-raised text-ink-muted hover:text-ink",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : "bg-surface-muted text-ink-subtle",
                    )}
                  >
                    {counts[item.key]}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              Sort
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SORTS.map((s) => (
                <Link
                  key={s.key}
                  href={buildHref({ filter, q, sort: s.key, view })}
                  className={cn(
                    "inline-flex items-center rounded-pill px-3 py-2 text-[12px] font-semibold shadow-[var(--shadow-soft)] transition-colors",
                    sort === s.key
                      ? "bg-violet-100 text-violet-700"
                      : "bg-surface-raised text-ink-muted hover:text-ink",
                  )}
                >
                  {s.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center rounded-pill bg-surface-raised p-1 shadow-[var(--shadow-soft)]">
              <Link
                href={buildHref({ filter, q, sort, view: "card" })}
                aria-label="Card view"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  view === "card" ? "bg-primary text-white" : "text-ink-muted hover:text-ink",
                )}
              >
                <LayoutGrid className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </Link>
              <Link
                href={buildHref({ filter, q, sort, view: "list" })}
                aria-label="List view"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  view === "list" ? "bg-primary text-white" : "text-ink-muted hover:text-ink",
                )}
              >
                <List className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FilePlus2 className="h-5 w-5" strokeWidth={1.5} aria-hidden />}
          title={
            query
              ? "No agreements match your search"
              : deals.length === 0
                ? "No agreements yet"
                : "No agreements in this view"
          }
          description={
            query
              ? "Try a different title or reference."
              : deals.length === 0
                ? "Create your first agreement to put a deal on record with clear terms, signatures, and a verifiable hash."
                : "Try another filter to see more of your agreements."
          }
          action={
            <ButtonLink href="/deals/new" size="sm">
              <FilePlus2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Create agreement
            </ButtonLink>
          }
        />
      ) : (
        <div className={cn(view === "list" ? "space-y-3" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3")}>
          {filtered.map((deal) => (
            <DealCard key={deal.id} deal={deal} action={needsAction(deal, user.id)} view={view} />
          ))}
        </div>
      )}
    </div>
  );
}
