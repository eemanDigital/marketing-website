"use client";

import { useState } from "react";
import { Check, Copy, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export function shortHashDisplay(hash: string) {
  if (!hash) return "—";
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function HashChip({
  hash,
  className,
  showIcon = true,
}: {
  hash: string;
  className?: string;
  showIcon?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const label = shortHashDisplay(hash);

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={hash}
      aria-label={`Copy hash ${hash}`}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-pill bg-surface-muted px-2.5 py-1 font-mono text-[11px] font-medium text-ink hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
        className,
      )}
    >
      {showIcon ? <Hash className="h-3 w-3 shrink-0 text-ink-muted" strokeWidth={1.5} aria-hidden /> : null}
      <span className="truncate">{label}</span>
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-success-600" strokeWidth={1.5} aria-hidden />
      ) : (
        <Copy className="h-3 w-3 shrink-0 text-ink-subtle" strokeWidth={1.5} aria-hidden />
      )}
    </button>
  );
}