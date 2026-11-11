import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  Handshake,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEAL_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import {
  adminRevokeInvitationAction,
  revokeSealAction,
  suspendUserAction,
} from "@/server/actions/admin";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();

  const [users, deals, executed, activeSeals, suspended, audits, recentDeals] = await Promise.all([
    db.user.count(),
    db.deal.count(),
    db.deal.count({ where: { status: "EXECUTED" } }),
    db.dealSeal.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { suspendedAt: { not: null } } }),
    db.adminAudit.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.deal.findMany({
      include: { creator: true, seals: true },
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),
  ]);

  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Admin</h1>
          <p className="mt-1 text-[13px] text-ink-500">Operational overview and trust actions.</p>
        </div>
        <Link href="/dashboard" className={buttonStyles({ variant: "outline", size: "sm" })}>
          Back to app
        </Link>
      </div>

      <Alert tone="warning" title="Restricted area">
        Administrative actions are audited with the acting user. Use revocation only where the record is
        compromised or a legitimate complaint has been verified through an appropriate process.
      </Alert>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Users", value: users, icon: Users },
          { label: "Deals", value: deals, icon: Handshake },
          { label: "Executed", value: executed, icon: CheckCircle2 },
          { label: "Active seals", value: activeSeals, icon: ShieldCheck },
          { label: "Suspended", value: suspended, icon: Ban },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <Icon className="h-4 w-4 text-ink-400" aria-hidden />
              <p className="mt-2 text-lg font-extrabold text-ink-900">{stat.value}</p>
              <p className="text-[11px] font-medium text-ink-500">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent users" description="Suspend accounts that abuse the platform." />
          <CardBody className="space-y-2">
            {recentUsers.map((user) => (
              <div key={user.id} className="rounded-xl border border-ink-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-3">
                    <Avatar name={user.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-ink-900">
                        {user.fullName} {user.isAdmin ? "(admin)" : ""}
                      </p>
                      <p className="truncate text-[11px] text-ink-500">{user.email}</p>
                      <p className="text-[10px] text-ink-400">
                        Joined {formatDateTime(user.createdAt)} · {user.emailVerifiedAt ? "email verified" : "email unverified"}
                      </p>
                    </div>
                  </div>
                  {user.suspendedAt ? <Badge tone="danger">Suspended</Badge> : <Badge tone="success">Active</Badge>}
                </div>
                <form action={suspendUserAction} className="mt-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="suspend" value={user.suspendedAt ? "0" : "1"} />
                  <button type="submit" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                    {user.suspendedAt ? "Unsuspend account" : "Suspend account"}
                  </button>
                </form>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent deals" description="Revoke seals or active invitation links where needed." />
          <CardBody className="space-y-2">
            {recentDeals.map((deal) => {
              const seal = deal.seals[0];
              return (
                <div key={deal.id} className="rounded-xl border border-ink-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/deals/${deal.id}`} className="truncate text-[12px] font-semibold text-brand-700">
                        {deal.title}
                      </Link>
                      <p className="font-mono text-[10px] text-ink-500">{deal.reference}</p>
                      <p className="text-[10px] text-ink-400">
                        {deal.creator.fullName} · {formatDateTime(deal.updatedAt)}
                      </p>
                    </div>
                    <Badge tone={deal.status === "EXECUTED" ? "success" : "neutral"}>
                      {DEAL_STATUS_LABEL[deal.status] ?? deal.status}
                    </Badge>
                  </div>

                  {seal ? (
                    <div className="mt-2 rounded-lg bg-ink-50 p-2">
                      <p className="font-mono text-[10px] text-ink-600">
                        Seal {seal.serialNumber} · {seal.status}
                      </p>
                      {seal.status === "ACTIVE" ? (
                        <form action={revokeSealAction} className="mt-1.5 flex flex-wrap gap-1.5">
                          <input type="hidden" name="sealId" value={seal.id} />
                          <input
                            name="reason"
                            placeholder="Revocation reason"
                            required
                            className="min-w-0 flex-1 rounded-md border border-ink-200 px-2 py-1 text-[11px]"
                          />
                          <button type="submit" className={buttonStyles({ variant: "danger", size: "sm" })}>
                            <ShieldAlert className="h-3 w-3" aria-hidden />
                            Revoke seal
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent admin audit" description="Who did what, and when." />
        <CardBody className="space-y-2">
          {audits.length === 0 ? (
            <p className="text-[12px] text-ink-500">No admin actions recorded.</p>
          ) : (
            audits.map((audit) => (
              <div key={audit.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 px-3 py-2 text-[11px]">
                <span className="font-semibold text-ink-800">{audit.action}</span>
                <span className="text-ink-500">
                  {audit.actor.fullName} · {audit.targetType} {audit.targetId.slice(0, 8)}
                </span>
                <span className="text-ink-400">{formatDateTime(audit.createdAt)}</span>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Invitation administration" description="Paste an invitation id from a support report to revoke it." />
        <CardBody>
          <form action={adminRevokeInvitationAction} className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 text-[12px] font-semibold text-ink-700">
              Invitation ID
              <input
                name="invitationId"
                required
                placeholder="cuid..."
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-[12px]"
              />
            </label>
            <button type="submit" className={buttonStyles({ variant: "danger", size: "sm" })}>
              Revoke invitation
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
