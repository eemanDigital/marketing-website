import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)} aria-label="dealrec home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M7 3.75h7.5L19 8.25v12H7a1.5 1.5 0 0 1-1.5-1.5V5.25A1.5 1.5 0 0 1 7 3.75Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M14 4v4.5h4.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="m9 14 1.8 1.8L14.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {showWord ? (
        <span className="text-[19px] font-extrabold tracking-tight text-ink-900">
          deal<span className="text-brand-600">rec</span>
        </span>
      ) : null}
    </Link>
  );
}
