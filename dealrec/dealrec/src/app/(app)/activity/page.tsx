import Link from "next/link";
import { Activity, ArrowLeft, Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { HashBlockArt } from "@/components/illustrations/product-art";

export const metadata = { title: "Activity" };

export default async function ActivityPage() {
  await requireUser();
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-medium text-ink-muted">Updates</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">Activity</h2>
      </div>
      <div className="flex flex-col items-center justify-center rounded-card-lg bg-surface-raised px-6 py-14 text-center shadow-[var(--shadow-soft)]">
        <div className="relative mb-4 h-28 w-28">
          <HashBlockArt className="h-full w-full" />
          <span className="absolute -right-1 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 ring-4 ring-surface-raised">
            <Activity className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </span>
        </div>
        <span className="mb-2 inline-flex rounded-pill bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
          Coming soon
        </span>
        <h3 className="text-[17px] font-extrabold tracking-tight text-ink">A unified timeline is on the way</h3>
        <p className="mt-1.5 max-w-md text-[13px] leading-6 text-ink-muted">
          See agreement updates, signatures, and reminders in one place. Your notifications are available now.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/notifications"
            className="inline-flex items-center gap-2 rounded-pill bg-primary px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Open notifications
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-pill bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink shadow-[var(--shadow-soft)] hover:bg-surface-muted"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}