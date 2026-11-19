import Link from "next/link";
import {
  ArrowRight,
  FilePlus2,
  FileUp,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { DEAL_STATUS, TIME_ZONE } from "@/lib/constants";
import { getUserDeals, needsAction } from "@/lib/deal-list";
import { formatNaira, toDateInputValue } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { WeekStrip } from "@/components/dashboard/week-strip";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { StatusPill } from "@/components/ui/status-pill";
import { ShieldDocumentArt, SealedDocumentArt, QrSealArt } from "@/components/illustrations/product-art";
import { presentStatus } from "@/lib/ui-status";

export const metadata = { title: "Dashboard" };

function lagosDateKey(date: Date | null | undefined) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return toDateInputValue(d);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const deals = await getUserDeals(user.id);

  const actionDeals = deals.filter((deal) => needsAction(deal, user.id));
  const pendingSignatureDeals = deals.filter((deal) =>
    [
      DEAL_STATUS.AWAITING_CREATOR_SIGNATURE,
      DEAL_STATUS.AWAITING_OTHER_SIGNATURES,
      DEAL_STATUS.AWAITING_WITNESSES,
      DEAL_STATUS.AWAITING_COUNTERPARTY,
    ].includes(deal.status as never),
  );
  const sealedDeals = deals.filter((deal) =>
    [DEAL_STATUS.EXECUTED, DEAL_STATUS.ACTIVE, DEAL_STATUS.COMPLETED].includes(
      deal.status as never,
    ),
  );

  // Dots from real data only: agreement activity (updatedAt) and obligation due dates
  const dotKeys = new Set<string>();
  for (const deal of deals) {
    const ex = lagosDateKey(deal.updatedAt as Date);
    if (ex) dotKeys.add(ex);
    const obligations = (deal as { obligations?: { dueAt: Date | null }[] }).obligations ?? [];
    for (const o of obligations) {
      const dk = lagosDateKey(o.dueAt as Date | null);
      if (dk) dotKeys.add(dk);
    }
  }

  const focusDeal = actionDeals[0] ?? pendingSignatureDeals[0] ?? deals[0] ?? null;
  const focusCount = actionDeals.length || pendingSignatureDeals.length;
  const focusTitle =
    focusCount > 0
      ? `${focusCount} agreement${focusCount === 1 ? "" : "s"} need${focusCount === 1 ? "s" : ""} your attention`
      : sealedDeals.length > 0
        ? "Your records are up to date"
        : "Create your first agreement";
  const focusSubtitle =
    focusCount > 0
      ? "Review terms, sign, or respond so nothing holds up your deal."
      : sealedDeals.length > 0
        ? "All signed agreements are sealed and ready to verify or share."
        : "Put a loan, sale, or service on record in minutes.";

  const focusParticipants = focusDeal
    ? Array.from(
        new Set(
          (focusDeal.parties?.map((p) => p.fullName) ??
            [focusDeal.creator?.fullName, "Counterparty"].filter(Boolean)) as string[],
        ),
      )
    : ["Adaeze Okafor (example)", "Tunde Adeyemi (example)"];

  const heroAmount = focusDeal?.totalAmount ? formatNaira(focusDeal.totalAmount) : null;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink-muted">This week</p>
            <h2 className="text-[18px] font-extrabold tracking-tight text-ink">
              Deadlines &amp; activity
            </h2>
          </div>
          <ButtonLink href="/deals/new" size="sm" className="shrink-0 sm:inline-flex">
            <FilePlus2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Create
          </ButtonLink>
        </div>
        <WeekStrip
          activeKey={params.day}
          dotKeys={Array.from(dotKeys)}
          hrefBase="/dashboard"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-card-lg bg-violet-200 p-5 shadow-[var(--shadow-soft)] sm:p-6 lg:col-span-7">
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/70 px-3 py-1 text-[11px] font-semibold text-violet-700">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                Today&apos;s focus
              </span>
              {focusDeal ? <StatusPill status={focusDeal.status} /> : null}
            </div>
            <h3 className="mt-4 max-w-md text-[24px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[30px]">
              {focusTitle}
            </h3>
            <p className="mt-2 max-w-md text-[13px] leading-6 text-ink/80">
              {focusSubtitle}
            </p>
            {focusDeal ? (
              <div className="mt-4 space-y-1">
                <p className="text-[13px] font-semibold text-ink">{focusDeal.title}</p>
                <p className="text-[12px] text-ink/80">
                  {focusDeal.reference}
                  {heroAmount ? ` · ${heroAmount}` : ""}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-[18px] bg-white/50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">Example (illustrative)</p>
                <p className="mt-0.5 text-[12px] text-ink/80">
                  ₦250,000 service agreement · Lagos, {new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric", timeZone: TIME_ZONE })}
                </p>
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <AvatarStack names={focusParticipants} max={3} />
              <span className="text-[12px] font-medium text-ink/80">
                {focusParticipants.length} participant{focusParticipants.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink
                href={focusDeal ? `/deals/${focusDeal.id}` : "/deals/new"}
                variant="primary"
                size="sm"
              >
                {focusDeal ? "Open agreement" : "Create agreement"}
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </ButtonLink>
              <ButtonLink href="/deals" variant="outline" size="sm" className="bg-white/60">
                View all
              </ButtonLink>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-6 -bottom-8 w-[120px] opacity-60 sm:-right-4 sm:-bottom-6 sm:w-[190px] sm:opacity-90 lg:-right-2 lg:w-[230px]">
            <ShieldDocumentArt className="h-auto w-full" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          <div className="relative overflow-hidden rounded-card bg-amber-100 p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-pill bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  Awaiting signature
                </span>
                <h4 className="mt-3 text-[22px] font-extrabold tracking-tight text-ink">
                  {pendingSignatureDeals.length}
                </h4>
                <p className="text-[13px] font-medium text-ink/80">Pending signature</p>
              </div>
              <div className="w-14 shrink-0 opacity-90 sm:w-16">
                <ShieldDocumentArt className="h-auto w-full" />
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-ink/80">
              {pendingSignatureDeals[0]
                ? `${pendingSignatureDeals[0].title}`
                : "No agreements are waiting for a signature right now."}
            </p>
            <Link
              href="/deals?filter=awaiting_signature"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-amber-700 underline-offset-2 hover:underline"
            >
              Review pending <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-card bg-sky-100 p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-pill bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                  Sealed &amp; verified
                </span>
                <h4 className="mt-3 text-[22px] font-extrabold tracking-tight text-ink">
                  {sealedDeals.length}
                </h4>
                <p className="text-[13px] font-medium text-ink/80">Signed agreements</p>
              </div>
              <div className="w-14 shrink-0 opacity-90 sm:w-16">
                <SealedDocumentArt className="h-auto w-full" />
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-ink/80">
              {sealedDeals[0]
                ? `${sealedDeals[0].title}${sealedDeals[0].totalAmount ? ` · ${formatNaira(sealedDeals[0].totalAmount)}` : ""}`
                : "Sealed agreements will appear here with their hash and certificate."}
            </p>
            <Link
              href="/deals?filter=sealed"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-sky-700 underline-offset-2 hover:underline"
            >
              View sealed <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/deals/new"
          className="group relative overflow-hidden rounded-card bg-pink-100 p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-pink-700">
            <FilePlus2 className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <h4 className="mt-4 text-[16px] font-bold tracking-tight text-ink">Create agreement</h4>
          <p className="mt-1 text-[12px] leading-5 text-ink/80">
            Start a loan, sale, or service record with clear terms.
          </p>
          <div className="pointer-events-none absolute -right-3 -bottom-3 w-20 opacity-60">
            <ShieldDocumentArt className="h-auto w-full" />
          </div>
        </Link>

        <Link
          href="/evidence"
          className="group relative overflow-hidden rounded-card bg-pink-50 p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-pink-700">
            <FileUp className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <h4 className="mt-4 text-[16px] font-bold tracking-tight text-ink">Upload evidence</h4>
          <p className="mt-1 text-[12px] leading-5 text-ink/80">
            Keep receipts, chats, and files with a hash at upload.
          </p>
          <div className="pointer-events-none absolute -right-3 -bottom-3 w-20 opacity-60">
            <QrSealArt className="h-auto w-full" />
          </div>
        </Link>

        <Link
          href="/verify"
          className="group relative overflow-hidden rounded-card bg-surface-raised p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-700">
            <QrCode className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <h4 className="mt-4 text-[16px] font-bold tracking-tight text-ink">Verify a record</h4>
          <p className="mt-1 text-[12px] leading-5 text-ink-muted">
            Scan a QR or enter a code to confirm a sealed agreement.
          </p>
          <div className="pointer-events-none absolute -right-3 -bottom-3 w-20 opacity-60">
            <SealedDocumentArt className="h-auto w-full" />
          </div>
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[17px] font-extrabold tracking-tight text-ink">Your agreements</h3>
          <Link href="/deals" className="inline-flex items-center gap-1 text-[12px] font-semibold text-violet-700">
            All agreements <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>

        {deals.length === 0 ? (
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              Examples (illustrative only — no agreements yet)
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-card bg-surface-raised p-5 shadow-[var(--shadow-soft)]">
                <StatusPill status="AWAITING_OTHER_SIGNATURES" />
                <p className="mt-3 text-[15px] font-bold text-ink">₦250,000 Service agreement</p>
                <p className="mt-1 text-[12px] text-ink-muted">Adaeze Okafor · Tunde Adeyemi · Lagos</p>
                <p className="mt-3 text-[12px] leading-5 text-ink-muted">
                  Example: awaiting Tunde&apos;s signature. Create your own to get started.
                </p>
                <ButtonLink href="/deals/new" size="sm" className="mt-4">
                  Create agreement
                </ButtonLink>
              </div>
              <div className="rounded-card bg-sky-50 p-5 shadow-[var(--shadow-soft)]">
                <StatusPill status="EXECUTED" />
                <p className="mt-3 text-[15px] font-bold text-ink">₦1,200,000 Equipment sale</p>
                <p className="mt-1 text-[12px] text-ink-muted">Chinedu Nwosu · Kemi Balogun · Abuja</p>
                <p className="mt-3 text-[12px] leading-5 text-ink-muted">
                  Example: sealed and verified with SHA-256 hash and QR certificate.
                </p>
                <ButtonLink href="/verify" size="sm" variant="outline" className="mt-4">
                  See how verify works
                </ButtonLink>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {deals.slice(0, 6).map((deal) => {
              const names = (deal.parties?.map((p) => p.fullName) ?? [deal.creator?.fullName ?? "You"]).filter(Boolean) as string[];
              const p = presentStatus(deal.status);
              const cardTone =
                p.key === "awaiting_signature"
                  ? "bg-amber-50"
                  : p.key === "sealed"
                    ? "bg-sky-50"
                    : p.key === "negotiating"
                      ? "bg-violet-50"
                      : "bg-surface-raised";
              return (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className={`group rounded-card p-4 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 ${cardTone}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <StatusPill status={deal.status} />
                    <ArrowRight className="h-4 w-4 text-ink-subtle transition-colors group-hover:text-ink" strokeWidth={1.5} aria-hidden />
                  </div>
                  <p className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-ink">
                    {deal.title}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-muted">{deal.reference}</p>
                  {deal.totalAmount ? (
                    <p className="mt-2 text-[13px] font-semibold text-ink">{formatNaira(deal.totalAmount)}</p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <AvatarStack names={names} max={3} size="sm" />
                    <span className="text-[11px] text-ink-muted">
                      {p.key === "sealed" ? "Sealed" : "Updated"}{" "}
                      {new Date(deal.updatedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", timeZone: TIME_ZONE })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="rounded-card bg-surface-raised/70 px-4 py-3 text-[12px] leading-5 text-ink-muted">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <ShieldCheck className="h-4 w-4 text-sky-700" strokeWidth={1.5} aria-hidden />
          Calm, verifiable records
        </span>
        <span className="ml-1">
          — hashes, audit trails, and certificates help show what was agreed in Lagos time (WAT).
        </span>
      </div>
    </div>
  );
}
