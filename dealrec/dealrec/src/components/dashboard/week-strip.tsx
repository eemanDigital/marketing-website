"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TIME_ZONE } from "@/lib/constants";

type DayInfo = {
  key: string; // YYYY-MM-DD (WAT)
  label: string; // Mon
  day: string; // 11
  hasDot: boolean;
};

function lagosKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function startOfWeekLagosKey(base: Date) {
  const key = lagosKey(base);
  const d = new Date(`${key}T12:00:00+01:00`);
  // get weekday in WAT
  const wd = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TIME_ZONE }).format(d);
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const offset = map[wd] ?? 0;
  d.setDate(d.getDate() - offset);
  return d;
}

export function WeekStrip({
  activeKey,
  dotKeys = [],
  hrefBase = "/dashboard",
}: {
  activeKey?: string;
  dotKeys?: string[];
  hrefBase?: string;
}) {
  const todayKey = lagosKey(new Date());
  const active = activeKey ?? todayKey;
  const monday = startOfWeekLagosKey(new Date());
  const dotSet = new Set(dotKeys);

  const days: DayInfo[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = lagosKey(d);
    const label = new Intl.DateTimeFormat("en-NG", { weekday: "short", timeZone: TIME_ZONE }).format(d);
    const day = new Intl.DateTimeFormat("en-NG", { day: "numeric", timeZone: TIME_ZONE }).format(d);
    return { key, label, day, hasDot: dotSet.has(key) };
  });

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="list" aria-label="This week">
      {days.map((d) => {
        const selected = d.key === active;
        return (
          <Link
            key={d.key}
            href={`${hrefBase}?day=${d.key}`}
            role="listitem"
            aria-current={selected ? "date" : undefined}
            className={cn(
              "flex min-w-[56px] shrink-0 flex-col items-center rounded-pill px-3 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
              selected
                ? "bg-primary text-white shadow-[var(--shadow-soft)]"
                : "bg-surface-raised text-ink shadow-[var(--shadow-soft)] hover:bg-surface",
            )}
          >
            <span className={cn("text-[11px] font-medium", selected ? "text-white/70" : "text-ink-muted")}>
              {d.label}
            </span>
            <span className="mt-0.5 text-[15px] font-bold leading-none">{d.day}</span>
            <span
              className={cn(
                "mt-1.5 h-1.5 w-1.5 rounded-full",
                d.hasDot ? (selected ? "bg-white" : "bg-violet-500") : "bg-transparent",
              )}
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}