import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "./ui/logo";
import { Avatar } from "./ui/avatar";
import { DesktopNav, MobileNav } from "./app-nav";
import type { SessionUser } from "@/lib/auth";
import { signOutAction } from "@/server/actions/auth";

export function AppShell({
  user,
  unread = 0,
  children,
}: {
  user: SessionUser;
  unread?: number;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <DesktopNav unread={unread} />
            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-full border border-ink-200 py-1 pl-1 pr-3 md:flex"
            >
              <Avatar name={user.fullName} size="sm" />
              <span className="max-w-28 truncate text-[13px] font-semibold text-ink-800">
                {user.fullName.split(" ")[0]}
              </span>
            </Link>
            <form action={signOutAction} className="md:hidden">
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
            <form action={signOutAction} className="hidden md:block">
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {!user.emailVerifiedAt ? (
        <div className="border-b border-sand-200 bg-sand-100 px-4 py-2 text-center text-[12px] font-medium text-sand-700">
          Your email is not verified.{" "}
          <Link href="/verify-account" className="underline">
            Verify now
          </Link>{" "}
          to create and sign deals.
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-12">{children}</main>
      <MobileNav unread={unread} />
    </div>
  );
}
