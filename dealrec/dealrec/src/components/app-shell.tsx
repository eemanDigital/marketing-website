import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { DesktopRail, MobileBottomNav, MobileHeader } from "./app-nav";
import type { SessionUser } from "@/lib/auth";
import { signOutAction } from "@/server/actions/auth";
import { formatDate } from "@/lib/utils";

export function AppShell({
  user,
  unread = 0,
  children,
  rightPanel,
}: {
  user: SessionUser;
  unread?: number;
  children: ReactNode;
  rightPanel?: ReactNode;
}) {
  const firstName = user.fullName.split(" ")[0] || user.fullName;
  const today = formatDate(new Date());

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <DesktopRail unread={unread} />

      <MobileHeader name={firstName} subtitle={today} />

      <div className="mx-auto flex w-full max-w-[1280px] gap-6 px-4 pb-32 pt-2 sm:px-6 lg:px-8 lg:pb-10 lg:pl-[120px] lg:pt-8">
        <div className="min-w-0 flex-1">
          <header className="mb-6 hidden items-start justify-between gap-4 lg:flex">
            <div>
              <p className="text-[13px] font-medium text-ink-muted">Hello, {firstName}</p>
              <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-ink">
                Welcome back
              </h1>
              <p className="mt-0.5 text-[13px] text-ink-muted">{today} · WAT</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/notifications"
                className="relative inline-flex h-11 items-center justify-center rounded-pill bg-surface-raised px-4 text-[13px] font-semibold text-ink shadow-[var(--shadow-soft)] hover:bg-surface"
              >
                Notifications
                {unread > 0 ? (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised text-ink-muted shadow-[var(--shadow-soft)] hover:text-ink"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="h-4.5 w-4.5" strokeWidth={1.5} aria-hidden />
                </button>
              </form>
            </div>
          </header>

          {!user.emailVerifiedAt ? (
            <div className="mb-4 flex items-start gap-3 rounded-card bg-amber-100 px-4 py-3 text-[13px] text-amber-700">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
              <p>
                Your email is not verified.{" "}
                <Link href="/verify-account" className="font-semibold underline underline-offset-2">
                  Verify now
                </Link>{" "}
                to create and sign agreements.
              </p>
            </div>
          ) : null}

          <main className="min-w-0">{children}</main>
        </div>

        {rightPanel ? (
          <aside className="hidden w-[320px] shrink-0 xl:block">
            <div className="sticky top-8 space-y-4">{rightPanel}</div>
          </aside>
        ) : null}
      </div>

      <MobileBottomNav unread={unread} />
    </div>
  );
}
