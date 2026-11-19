"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  FileText,
  FolderLock,
  Home,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "./ui/avatar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
};

const railItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/deals", label: "Agreements", icon: FileText },
  { href: "/evidence", label: "Evidence", icon: FolderLock },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const mobileItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/deals", label: "Agreements", icon: FileText },
  { href: "/deals/new", label: "Create", icon: Plus },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/deals") {
    return (
      pathname === "/deals" ||
      (pathname.startsWith("/deals/") && !pathname.startsWith("/deals/new"))
    );
  }
  if (href === "/deals/new") return pathname.startsWith("/deals/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopRail({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-4 lg:z-40 lg:flex lg:w-[84px] lg:flex-col lg:justify-center">
      <nav
        aria-label="Main navigation"
        className="flex flex-col items-center gap-2 rounded-pill bg-primary px-2 py-3 text-ink-inverse shadow-[var(--shadow-nav)]"
      >
        {railItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          const badge = item.href === "/activity" ? unread : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                active
                  ? "bg-surface-raised text-ink"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              {badge > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileBottomNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:hidden">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto flex items-center gap-1 rounded-pill bg-primary/95 px-2 py-2 shadow-[var(--shadow-nav)] backdrop-blur"
      >
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          const primary = item.href === "/deals/new";
          const badge = item.href === "/activity" ? unread : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                primary
                  ? "bg-violet-500 text-white"
                  : active
                    ? "bg-surface-raised text-ink"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              {badge > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function MobileHeader({
  name,
  greeting = "Hello",
  subtitle,
}: {
  name: string;
  greeting?: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-30 bg-canvas/90 px-4 pb-2 pt-4 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/profile" aria-label="Profile">
            <Avatar name={name} className="h-10 w-10" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink-muted">{greeting},</p>
            <p className="truncate text-[17px] font-extrabold tracking-tight text-ink">{name}</p>
            {subtitle ? (
              <p className="truncate text-[11px] text-ink-subtle">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/deals"
            aria-label="Search agreements"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised text-ink shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <Search className="h-4.5 w-4.5" strokeWidth={1.5} aria-hidden />
          </Link>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised text-ink shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <Bell className="h-4.5 w-4.5" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
