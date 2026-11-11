import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CircleAlert,
  FileCheck2,
  FilePlus2,
  Handshake,
  ShieldCheck,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { DEAL_STATUS } from "@/lib/constants";
import { getUserDeals, needsAction } from "@/lib/deal-list";
import { formatNaira } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DealCard } from "@/components/deal-card";
import { Alert } from "@/components/ui/alert";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const deals = await getUserDeals(user.id);

  const actionDeals = deals.filter((deal) => needsAction(deal, user.id));
  const executed = deals.filter((deal) =>
    [DEAL_STATUS.EXECUTED, DEAL_STATUS.ACTIVE, DEAL_STATUS.COMPLETED].includes(deal.status as never),
  );
  const outstanding = deals
    .filter((deal) =>
      [DEAL_STATUS.EXECUTED, DEAL_STATUS.ACTIVE, DEAL_STATUS.OVERDUE].includes(deal.status as never),
    )
    .reduce((sum, deal) => {
      const paid = deal.payments.reduce((acc, payment) => acc + payment.amount, 0);
      return sum + Math.max((deal.totalAmount ?? 0) - paid, 0);
    }, 0);
  const overdue = deals.reduce(
    (sum, deal) =>
      sum +
      deal.obligations.filter(
        (item) => item.status === "PENDING" && item.dueAt && item.dueAt.getTime() < Date.now(),
      ).length,
    0,
  );

  const firstName = user.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[13px] font-medium text-ink-500">Welcome back</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            {firstName}
          </h1>
        </div>
        <ButtonLink href="/deals/new">
          <FilePlus2 className="h-4 w-4" aria-hidden />
          Create a Deal
        </ButtonLink>
      </div>

      {!user.emailVerifiedAt ? (
        <Alert tone="warning" title="Verify your email to create deals">
          Check your inbox for the 6-digit code, or{" "}
          <Link href="/verify-account" className="font-semibold underline">
            request a new one
          </Link>
          .
        </Alert>
      ) : null}

      {actionDeals.length > 0 ? (
        <Card className="border-sand-200 bg-sand-100">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-sand-700" aria-hidden />
              <div>
                <p className="text-[14px] font-bold text-sand-700">
                  {actionDeals.length} deal{actionDeals.length > 1 ? "s" : ""} need your attention
                </p>
                <p className="mt-0.5 text-[12px] text-sand-700/80">
                  Review terms, sign an agreement or respond to a change request.
                </p>
              </div>
            </div>
            <ButtonLink href="/deals?filter=action" variant="sand" size="sm">
              Review now
            </ButtonLink>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total deals", value: String(deals.length), icon: Handshake, tone: "text-brand-700 bg-brand-50" },
          { label: "Executed", value: String(executed.length), icon: FileCheck2, tone: "text-emerald-700 bg-emerald-50" },
          { label: "Outstanding", value: formatNaira(outstanding), icon: Banknote, tone: "text-sky-700 bg-sky-50" },
          { label: "Overdue", value: String(overdue), icon: CircleAlert, tone: "text-red-700 bg-red-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone}`}>
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <p className="mt-3 truncate text-lg font-extrabold text-ink-900">{stat.value}</p>
              <p className="text-[11px] font-medium text-ink-500">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink-900">Needs your attention</h2>
            <Link href="/deals" className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700">
              All deals <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {actionDeals.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
              title="Nothing needs you right now"
              description="New deals, signatures and change requests will appear here."
              action={
                <ButtonLink href="/deals/new" size="sm" variant="outline">
                  Start a deal
                </ButtonLink>
              }
            />
          ) : (
            <div className="space-y-3">
              {actionDeals.slice(0, 4).map((deal) => (
                <DealCard key={deal.id} deal={deal} action />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink-900">Recent deals</h2>
          </div>
          {deals.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-[13px] leading-6 text-ink-500">
                  No deals yet. Create your first agreement and share it with the other party in
                  minutes.
                </p>
                <ButtonLink href="/deals/new" className="mt-3 w-full" size="sm">
                  Create a Deal
                </ButtonLink>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Latest activity" description="Your most recently updated deals" />
              <CardBody className="space-y-3">
                {deals.slice(0, 5).map((deal) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink-800">{deal.title}</p>
                      <p className="text-[11px] text-ink-500">{deal.reference}</p>
                    </div>
                    <Badge
                      tone={
                        ["EXECUTED", "ACTIVE", "COMPLETED"].includes(deal.status)
                          ? "success"
                          : ["CANCELLED", "VOIDED"].includes(deal.status)
                            ? "danger"
                            : "warning"
                      }
                    >
                      {deal.status.replaceAll("_", " ")}
                    </Badge>
                  </Link>
                ))}
              </CardBody>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
