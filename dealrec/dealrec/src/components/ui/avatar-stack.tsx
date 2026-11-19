import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";

export function AvatarStack({
  names,
  max = 3,
  size = "sm",
  className,
}: {
  names: string[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className={cn("flex items-center", className)} aria-label={`${names.length} participants`}>
      {shown.map((name, index) => (
        <div key={`${name}-${index}`} className={index === 0 ? "" : "-ml-2.5"}>
          <Avatar name={name} size={size} />
        </div>
      ))}
      {extra > 0 ? (
        <span
          className={cn(
            "-ml-2.5 inline-flex shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white ring-2 ring-surface-raised",
            size === "lg" ? "h-12 w-12" : size === "md" ? "h-10 w-10" : "h-8 w-8",
          )}
          aria-hidden
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}