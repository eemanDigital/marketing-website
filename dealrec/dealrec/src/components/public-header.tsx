import Link from "next/link";
import { Logo } from "./ui/logo";
import { ButtonLink } from "./ui/button";
import type { SessionUser } from "@/lib/auth";

export function PublicHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Link
            href="/verify"
            className="hidden rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-600 hover:bg-ink-100 sm:inline-flex"
          >
            Verify a document
          </Link>
          {user ? (
            <ButtonLink href="/dashboard" size="sm">
              Dashboard
            </ButtonLink>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-700 hover:bg-ink-100"
              >
                Sign in
              </Link>
              <ButtonLink href="/sign-up" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
