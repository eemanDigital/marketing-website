import { GitCompareArrows } from "lucide-react";
import { parseChangeSummary, type ParsedChange } from "@/lib/change-summary";
import { cn } from "@/lib/utils";

export function ChangeSummaryBlock({
  summary,
  className,
  compact = false,
}: {
  summary: string | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  const changes = parseChangeSummary(summary);
  if (changes.length === 0) return null;

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      {changes.map((change, index) => (
        <ChangeRow key={`${change.label}-${index}`} change={change} compact={compact} />
      ))}
    </div>
  );
}

function valueText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : "—";
}

function ChangeRow({ change, compact }: { change: ParsedChange; compact?: boolean }) {
  return (
    <div className={cn("w-full min-w-0 rounded-[16px] border border-amber-200/70 bg-amber-50/40 p-3", compact && "p-2.5")}>
      <p className="break-words text-[12px] font-semibold text-ink [overflow-wrap:anywhere]">{change.label}</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-[14px] bg-surface-raised/80 px-3 py-2 ring-1 ring-inset ring-ink-100">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Previous</p>
          <p className="mt-0.5 whitespace-pre-line break-words text-[12px] leading-5 text-ink-muted line-through decoration-ink-subtle/50 [overflow-wrap:anywhere]">
            {valueText(change.before)}
          </p>
        </div>
        <div className="min-w-0 rounded-[14px] bg-sky-50 px-3 py-2 ring-1 ring-inset ring-sky-200/70">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">Updated</p>
          <p className="mt-0.5 whitespace-pre-line break-words text-[12px] leading-5 font-medium text-ink [overflow-wrap:anywhere]">
            {valueText(change.after)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function RevisedVersionNotice({
  versionNumber,
  summary,
  className,
}: {
  versionNumber: number;
  summary: string | null | undefined;
  className?: string;
}) {
  const changes = parseChangeSummary(summary);
  if (versionNumber <= 1 || changes.length === 0) return null;
  return (
    <div className={cn("w-full min-w-0 rounded-card bg-amber-50 p-4 shadow-[var(--shadow-soft)] ring-1 ring-inset ring-amber-200/70 sm:p-5", className)}>
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 sm:h-10 sm:w-10">
          <GitCompareArrows className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold leading-tight text-ink sm:text-[15px]">Revised terms · version {versionNumber}</p>
          <p className="mt-1 text-[12px] leading-5 text-ink-muted sm:text-[13px]">
            The creator updated {changes.length} part{changes.length === 1 ? "" : "s"} of this agreement. Review the marked changes below before signing.
          </p>
          <ChangeSummaryBlock summary={summary} className="mt-3 sm:mt-4" />
        </div>
      </div>
    </div>
  );
}
