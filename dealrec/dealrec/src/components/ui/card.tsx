import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag className={cn("rounded-card bg-surface-raised shadow-[var(--shadow-soft)]", className)}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[16px] font-bold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[13px] leading-5 text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="sm:shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)}>{children}</div>;
}
