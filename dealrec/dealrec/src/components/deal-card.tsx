import Link from "next/link";
import { CalendarClock, ChevronRight, FileWarning, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar } from "./ui/avatar";
import { DEAL_STATUS_LABEL } from "@/lib/constants";
import { statusTone } from "@/lib/deals";
import { formatDate, formatNaira, truncate } from "@/lib/utils";
import { listPaymentSummary, type DealListItem } from "@/lib/deal-list";

export function DealCard({ deal, action }: { deal: DealListItem; action?: boolean }) {
  const summary = listPaymentSummary(deal);
  const other = deal.parties.find((party) => !party.isCreator);
  const tone = statusTone(deal.status) as "success" | "warning" | "danger" | "neutral";

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="group block rounded-2xl border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={tone}>{DEAL_STATUS_LABEL[deal.status] ?? deal.status}</Badge>
            {action ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sand-700">
                <FileWarning className="h-3 w-3" aria-hidden />
                Needs you
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-[15px] font-bold text-ink-900 group-hover:text-brand-800">
            {deal.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-500">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {truncate(other?.fullName ?? deal.creator.fullName ?? "You", 40)}
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 group-hover:text-brand-600" aria-hidden />
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-ink-100 pt-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Deal value</p>
          <p className="text-[15px] font-bold text-ink-900">
            {deal.totalAmount ? formatNaira(deal.totalAmount) : "Not set"}
          </p>
        </div>
        {summary.outstanding !== null ? (
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Outstanding</p>
            <p className="text-[13px] font-semibold text-ink-800">{formatNaira(summary.outstanding)}</p>
          </div>
        ) : null}
        <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
          <Avatar name={other?.fullName ?? deal.creator.fullName} size="sm" />
          <span>{formatDate(deal.updatedAt)}</span>
        </div>
      </div>

      {summary.nextDue || summary.overdue > 0 ? (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-sand-100 px-2.5 py-1.5 text-[11px] font-medium text-sand-700">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {summary.overdue > 0
            ? `${summary.overdue} overdue obligation${summary.overdue > 1 ? "s" : ""}`
            : `Next due ${formatDate(summary.nextDue)}`}
        </div>
      ) : null}
    </Link>
  );
}
