import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <AppShell user={user} unread={unread}>
      {children}
    </AppShell>
  );
}
