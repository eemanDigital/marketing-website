import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-card bg-surface-raised px-6 py-12 text-center shadow-[var(--shadow-soft)]", className)}>
      {icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[15px] font-bold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-[13px] leading-5 text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
