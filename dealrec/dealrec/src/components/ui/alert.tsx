import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const styles = {
  info: { wrapper: "bg-sky-50 text-sky-700", icon: Info, iconClass: "text-sky-600" },
  success: { wrapper: "bg-success-50 text-success-700", icon: CheckCircle2, iconClass: "text-success-600" },
  warning: { wrapper: "bg-amber-100 text-amber-700", icon: AlertTriangle, iconClass: "text-amber-600" },
  error: { wrapper: "bg-danger-50 text-danger-700", icon: XCircle, iconClass: "text-danger-600" },
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
    <div className={cn("flex gap-3 rounded-card px-4 py-3 text-[13px] leading-5", style.wrapper, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconClass)} strokeWidth={1.5} aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div> : null}
      </div>
    </div>
  );
}
