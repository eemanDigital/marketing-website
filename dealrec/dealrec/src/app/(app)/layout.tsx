import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Bell, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [unread, notifications] = await Promise.all([
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const rightPanel = (
    <div className="rounded-card bg-surface-raised p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-bold text-ink">Recent activity</h2>
        <Link href="/notifications" className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700">
          View all <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        </Link>
      </div>
      {notifications.length === 0 ? (
        <div className="rounded-[20px] bg-surface-muted px-3 py-4 text-center">
          <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </span>
          <p className="text-[12px] font-medium text-ink">No recent activity yet</p>
          <p className="mt-0.5 text-[11px] leading-5 text-ink-muted">
            Updates from agreements and signatures will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {notifications.map((item) => (
            <li key={item.id}>
              <Link
                href={item.dealId ? `/deals/${item.dealId}` : "/notifications"}
                className="flex gap-2.5 rounded-[18px] p-2 transition-colors hover:bg-surface-muted"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <FileText className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-ink">{item.title}</span>
                  <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-ink-muted">{item.body}</span>
                  <span className="mt-0.5 block text-[10px] text-ink-subtle">{formatDateTime(item.createdAt)}</span>
                </span>
                {!item.readAt ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" aria-label="Unread" /> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <AppShell user={user} unread={unread} rightPanel={rightPanel}>
      {children}
    </AppShell>
  );
}
