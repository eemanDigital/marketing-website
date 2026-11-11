"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FileText, Home, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/deals", label: "My Deals", icon: FileText },
  { href: "/deals/new", label: "Create", icon: Plus, primary: true },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/deals") return pathname === "/deals" || (pathname.startsWith("/deals/") && !pathname.startsWith("/deals/new"));
  if (href === "/deals/new") return pathname.startsWith("/deals/new");
  return pathname.startsWith(href);
}

export function MobileNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold",
                active ? "text-brand-700" : "text-ink-500",
              )}
            >
              <span
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full",
                  item.primary
                    ? "bg-brand-600 text-white shadow-sm"
                    : active
                      ? "bg-brand-50"
                      : "",
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                {item.href === "/notifications" && unread > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
      {items
        .filter((item) => !item.primary)
        .map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold",
                active ? "bg-brand-50 text-brand-800" : "text-ink-600 hover:bg-ink-100",
              )}
            >
              <span className="relative">
                <Icon className="h-4 w-4" aria-hidden />
                {item.href === "/notifications" && unread > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-red-600" />
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      <Link
        href="/deals/new"
        className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Create Deal
      </Link>
    </nav>
  );
}
