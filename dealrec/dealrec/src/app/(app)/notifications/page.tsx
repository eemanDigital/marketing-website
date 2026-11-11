import Link from "next/link";
import { Bell, CheckCheck, Circle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/actions/notifications";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Notifications</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {unread > 0 ? `${unread} unread` : "You are all caught up."}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all read
            </button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" aria-hidden />}
          title="No notifications yet"
          description="Invitations, signatures, payments and reminders will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.readAt ? "opacity-80" : "border-brand-200"}
            >
              <CardBody className="flex items-start gap-3">
                <span className="mt-1 text-brand-600">
                  {notification.readAt ? (
                    <Circle className="h-2.5 w-2.5" aria-hidden />
                  ) : (
                    <Circle className="h-2.5 w-2.5 fill-brand-600" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-bold text-ink-900">{notification.title}</p>
                    {!notification.readAt ? <Badge tone="brand">New</Badge> : null}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-5 text-ink-600">{notification.body}</p>
                  <p className="mt-1 text-[10px] text-ink-400">{formatDateTime(notification.createdAt)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {notification.dealId ? (
                      <Link href={`/deals/${notification.dealId}`} className="text-[11px] font-semibold text-brand-700">
                        Open deal
                      </Link>
                    ) : null}
                    {!notification.readAt ? (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="id" value={notification.id} />
                        <button type="submit" className="text-[11px] font-semibold text-ink-500 hover:text-ink-800">
                          Mark read
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
