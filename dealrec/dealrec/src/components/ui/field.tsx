import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[16px] border border-ink-200 bg-surface-raised px-4 py-3 text-ink placeholder:text-ink-subtle shadow-[var(--shadow-soft)] transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300/40 disabled:bg-surface-muted";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-ink">
        {label}
        {required ? <span className="ml-0.5 text-danger-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] font-medium text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-[13px] leading-5 text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-28 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "appearance-none pr-10", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex items-start gap-3 rounded-[16px] bg-surface-raised p-4 shadow-[var(--shadow-soft)]", className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-violet-600 focus:ring-violet-300"
        {...props}
      />
      <span className="text-[13px] leading-5 text-ink">{label}</span>
    </label>
  );
}
