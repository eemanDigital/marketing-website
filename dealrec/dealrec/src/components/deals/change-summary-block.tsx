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
    <div className={cn("space-y-2.5", className)}>
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
    <div className={cn("rounded-[16px] border border-amber-200/70 bg-amber-50/40 p-3", compact && "p-2.5")}>
      <p className="text-[12px] font-semibold text-ink">{change.label}</p>
      <div className={cn("mt-2 grid gap-2", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
        <div className="min-w-0 rounded-[14px] bg-surface-raised/80 px-3 py-2 ring-1 ring-inset ring-ink-100">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Previous</p>
          <p className="mt-0.5 whitespace-pre-line text-[12px] leading-5 text-ink-muted line-through decoration-ink-subtle/50">
            {valueText(change.before)}
          </p>
        </div>
        <div className="min-w-0 rounded-[14px] bg-sky-50 px-3 py-2 ring-1 ring-inset ring-sky-200/70">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">Updated</p>
          <p className="mt-0.5 whitespace-pre-line text-[12px] leading-5 font-medium text-ink">
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
    <div className={cn("rounded-card bg-amber-50 p-4 shadow-[var(--shadow-soft)] ring-1 ring-inset ring-amber-200/70", className)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <GitCompareArrows className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink">Revised terms · version {versionNumber}</p>
          <p className="mt-1 text-[12px] leading-5 text-ink-muted">
            The creator updated {changes.length} part{changes.length === 1 ? "" : "s"} of this agreement. Review the marked changes below before signing.
          </p>
          <ChangeSummaryBlock summary={summary} className="mt-3" />
        </div>
      </div>
    </div>
  );
}
