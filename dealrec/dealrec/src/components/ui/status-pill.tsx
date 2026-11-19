import { Badge } from "./badge";
import { presentStatus } from "@/lib/ui-status";
import { cn } from "@/lib/utils";

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const p = presentStatus(status);
  return (
    <Badge tone={p.tone} className={cn(className)}>
      {p.label}
    </Badge>
  );
}