import Link from "next/link";
import { ArrowUpRight, CalendarClock, FileWarning } from "lucide-react";
import { StatusPill } from "./ui/status-pill";
import { AvatarStack } from "./ui/avatar-stack";
import { formatDate, formatNaira } from "@/lib/utils";
import { listPaymentSummary, type DealListItem } from "@/lib/deal-list";
import { TIME_ZONE } from "@/lib/constants";
import { presentStatus } from "@/lib/ui-status";
import { cn } from "@/lib/utils";

export function DealCard({
  deal,
  action,
  view = "card",
}: {
  deal: DealListItem;
  action?: boolean;
  view?: "card" | "list";
}) {
  const summary = listPaymentSummary(deal);
  const names = (deal.parties?.map((p) => p.fullName) ?? [deal.creator?.fullName ?? "You"]).filter(
    Boolean,
  ) as string[];
  const p = presentStatus(deal.status);
  const toneBg =
    p.key === "awaiting_signature"
      ? "bg-amber-50"
      : p.key === "sealed"
        ? "bg-sky-50"
        : p.key === "negotiating"
          ? "bg-violet-50"
          : "bg-surface-raised";

  const updated = new Date(deal.updatedAt).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  });

  if (view === "list") {
    return (
      <Link
        href={`/deals/${deal.id}`}
        className={cn(
          "group flex flex-col gap-3 rounded-card p-4 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between",
          toneBg,
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={deal.status} />
            {action ? (
              <span className="inline-flex items-center gap-1 rounded-pill bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                <FileWarning className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                Needs you
              </span>
            ) : null}
            <span className="font-mono text-[11px] text-ink-subtle">{deal.reference}</span>
          </div>
          <p className="mt-2 truncate text-[15px] font-bold text-ink group-hover:text-violet-700">
            {deal.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-muted">
            <span className="font-semibold text-ink">
              {deal.totalAmount ? formatNaira(deal.totalAmount) : "Amount not set"}
            </span>
            <span>Updated {updated}</span>
            {summary.overdue > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-pill bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                {summary.overdue} overdue
              </span>
            ) : summary.nextDue ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                Due {formatDate(summary.nextDue)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <AvatarStack names={names} max={4} size="sm" />
          <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-subtle group-hover:text-ink" strokeWidth={1.5} aria-hidden />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/deals/${deal.id}`}
      className={cn(
        "group block rounded-card p-4 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5",
        toneBg,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={deal.status} />
          {action ? (
            <span className="inline-flex items-center gap-1 rounded-pill bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              <FileWarning className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Needs you
            </span>
          ) : null}
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-subtle transition-colors group-hover:text-ink" strokeWidth={1.5} aria-hidden />
      </div>

      <p className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-ink group-hover:text-violet-700">
        {deal.title}
      </p>
      <p className="mt-1 font-mono text-[11px] text-ink-subtle">{deal.reference}</p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Amount</p>
          <p className="text-[14px] font-bold text-ink">
            {deal.totalAmount ? formatNaira(deal.totalAmount) : "Not set"}
          </p>
        </div>
        {summary.outstanding !== null ? (
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Outstanding</p>
            <p className="text-[12px] font-semibold text-ink">{formatNaira(summary.outstanding)}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/5 pt-3">
        <AvatarStack names={names} max={3} size="sm" />
        <span className="text-[11px] text-ink-muted">Updated {updated}</span>
      </div>

      {summary.overdue > 0 || summary.nextDue ? (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-white/60 px-2.5 py-1 text-[11px] font-medium text-amber-700">
          <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          {summary.overdue > 0
            ? `${summary.overdue} overdue obligation${summary.overdue > 1 ? "s" : ""}`
            : `Next due ${formatDate(summary.nextDue)}`}
        </div>
      ) : null}
    </Link>
  );
}
