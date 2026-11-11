import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const styles = {
  info: { wrapper: "border-sky-200 bg-sky-50 text-sky-900", icon: Info, iconClass: "text-sky-600" },
  success: { wrapper: "border-brand-200 bg-brand-50 text-brand-900", icon: CheckCircle2, iconClass: "text-brand-600" },
  warning: { wrapper: "border-sand-200 bg-sand-100 text-sand-700", icon: AlertTriangle, iconClass: "text-sand-700" },
  error: { wrapper: "border-red-200 bg-red-50 text-red-900", icon: XCircle, iconClass: "text-red-600" },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof styles;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const style = styles[tone];
  const Icon = style.icon;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5 text-[13px] leading-5", style.wrapper, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconClass)} aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div> : null}
      </div>
    </div>
  );
}
