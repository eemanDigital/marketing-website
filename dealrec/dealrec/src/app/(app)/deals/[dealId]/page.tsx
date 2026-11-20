import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Link2,
  PackageCheck,
  QrCode,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { activeInvitation as getActiveInvitation, getDealAccess, isObligationOverdue } from "@/lib/deals";
import {
  canSign,
  certificateDocument,
  currentDocument,
  executedDocument,
  partyHasSigned,
  paymentSummary,
  safeValues,
  workspaceProgress,
} from "@/lib/deals";
import { buildAgreementContent } from "@/lib/agreement";
import { getTemplate } from "@/lib/templates";
import {
  AUTH_LEVEL_LABEL,
  DEAL_STATUS,
  EVENT_LABEL,
  OBLIGATION_STATUS,
  TIME_ZONE,
  WITNESS_STATUS,
  WITNESS_STATUS_LABEL,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatNaira, cn, shortHash, toDateInputValue } from "@/lib/utils";
import {
  cancelDealAction,
  markCompletedAction,
  revokeInvitationAction,
  sendInvitationAction,
  voidDealAction,
} from "@/server/actions/deals";
import { StatusPill } from "@/components/ui/status-pill";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonStyles } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { CopyButton } from "@/components/ui/copy-button";
import { SignPanel } from "@/components/deals/sign-panel";
import { VersionForm } from "@/components/deals/version-form";
import { CommentThread } from "@/components/deals/comment-thread";
import { PaymentForm } from "@/components/deals/payment-form";
import { PaymentRecordActions } from "@/components/deals/payment-record-actions";
import { ObligationForm } from "@/components/deals/obligation-form";
import { ObligationRecordActions } from "@/components/deals/obligation-record-actions";
import { WitnessPanel } from "@/components/deals/witness-panel";
import { ExecutionArtifactsButton } from "@/components/deals/execution-artifacts-button";
import { ChangeSummaryBlock, RevisedVersionNotice } from "@/components/deals/change-summary-block";
import { presentStatus } from "@/lib/ui-status";
import { HashChip } from "@/components/ui/hash-chip";

export const metadata = { title: "Agreement" };

const TABS = [
  { key: "terms", label: "Terms" },
  { key: "negotiation", label: "Negotiation" },
  { key: "evidence", label: "Evidence" },
  { key: "audit", label: "Audit trail" },
] as const;

const DOCUMENT_LABEL: Record<string, string> = {
  draft: "Draft agreement",
  uploaded_original: "Uploaded original",
  execution_copy: "Executed copy",
  amendment: "Amendment",
  certificate: "Verification certificate",
  receipt: "Payment receipt",
  signature: "Signature asset",
  attachment: "Attachment",
};

function fmtWAT(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return (
    new Intl.DateTimeFormat("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIME_ZONE,
      hour12: false,
    }).format(date) + " WAT"
  );
}

export default async function DealWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{
    tab?: string;
    token?: string;
    version?: string;
    created?: string;
    sent?: string;
    revoked?: string;
  }>;
}) {
  const user = await getDealAccess((await params).dealId);
  if (!user) notFound();
  const { user: currentUser, deal, party, isCreator } = user;
  const { tab: rawTab, token, created, sent, revoked } = await searchParams;
  const normalizedTab = rawTab === "invite" ? "terms" : rawTab;
  const tab = TABS.some((item) => item.key === normalizedTab)
    ? (normalizedTab as (typeof TABS)[number]["key"])
    : "terms";

  const template = getTemplate(deal.templateSlug);
  const values = safeValues(deal);
  const document = currentDocument(deal);
  const progress = workspaceProgress(deal);
  const executionReady =
    progress.signed === progress.required &&
    progress.witnessesAttested === progress.witnessesRequired &&
    ![DEAL_STATUS.CANCELLED, DEAL_STATUS.VOIDED, DEAL_STATUS.SUPERSEDED].includes(
      deal.status as never,
    );
  const summary = paymentSummary(deal);
  const seal = deal.seals[0] ?? null;
  const executed = executedDocument(deal);
  const certificate = certificateDocument(deal);
  const creatorParty = deal.parties.find((item) => item.isCreator);
  const otherParty = deal.parties.find((item) => !item.isCreator);
  const me =
    party ?? deal.parties.find((item) => item.userId === currentUser.id) ?? creatorParty;
  const mySigned = me ? partyHasSigned(deal, me.id) : false;
  const otherPartySigned = otherParty ? partyHasSigned(deal, otherParty.id) : false;
  const openForSigning = canSign(deal);
  const activeInvitation = getActiveInvitation(deal);
  const baseUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const inviteUrl = token ? `${baseUrl}/invite/${token}` : null;
  const isClosed = [DEAL_STATUS.CANCELLED, DEAL_STATUS.VOIDED, DEAL_STATUS.COMPLETED, DEAL_STATUS.SUPERSEDED].includes(
    deal.status as never,
  );

  const agreement = buildAgreementContent(deal, deal.parties);
  const witnessViews = (document
    ? deal.witnesses.filter((witness) => witness.documentId === document.id)
    : []
  ).map((witness) => ({
    id: witness.id,
    witnessedPartyId: witness.witnessedPartyId,
    witnessedPartyName:
      deal.parties.find((item) => item.id === witness.witnessedPartyId)?.fullName ?? "Party",
    fullName: witness.fullName,
    status: witness.status,
    statusLabel: WITNESS_STATUS_LABEL[witness.status] ?? witness.status,
    required: witness.required,
    expiresLabel: formatDate(witness.expiresAt),
    acceptedLabel: witness.acceptedAt ? formatDateTime(witness.acceptedAt) : null,
    attestedLabel: witness.attestedAt ? formatDateTime(witness.attestedAt) : null,
    openCount: witness.openCount,
    canManage:
      !isClosed &&
      deal.status !== DEAL_STATUS.EXECUTED &&
      !deal.executedAt &&
      (isCreator ||
        currentUser.isAdmin ||
        me?.id === witness.addedByPartyId ||
        me?.id === witness.witnessedPartyId) &&
      witness.status !== WITNESS_STATUS.REVOKED &&
      witness.status !== WITNESS_STATUS.SUPERSEDED,
    canResend:
      !isClosed &&
      deal.status !== DEAL_STATUS.EXECUTED &&
      !deal.executedAt &&
      witness.status !== WITNESS_STATUS.ATTESTED &&
      witness.status !== WITNESS_STATUS.REVOKED &&
      witness.status !== WITNESS_STATUS.SUPERSEDED &&
      (isCreator ||
        currentUser.isAdmin ||
        me?.id === witness.addedByPartyId ||
        me?.id === witness.witnessedPartyId),
  }));

  const partyNames = deal.parties.map((p) => p.fullName);
  const pStatus = presentStatus(deal.status);
  const nextAction = (() => {
    if (deal.status === DEAL_STATUS.AWAITING_CREATOR_SIGNATURE && isCreator)
      return { label: "Sign agreement", href: `/deals/${deal.id}?tab=terms#signing` };
    if (deal.status === DEAL_STATUS.CHANGE_REQUESTED && isCreator)
      return { label: "Review changes", href: `/deals/${deal.id}?tab=negotiation` };
    if (deal.status === DEAL_STATUS.AWAITING_COUNTERPARTY && isCreator)
      return { label: "Share invitation", href: `/deals/${deal.id}?tab=terms#invite` };
    if (deal.status === DEAL_STATUS.AWAITING_OTHER_SIGNATURES)
      return { label: "Waiting on other party", href: `/deals/${deal.id}?tab=terms#signing` };
    if (pStatus.key === "sealed")
      return { label: "View evidence", href: `/deals/${deal.id}?tab=evidence` };
    return { label: "Review terms", href: `/deals/${deal.id}?tab=terms#agreement-terms` };
  })();

  // Per-party state derivable today from existing data.
  // "Viewed" is not tracked as a durable per-party field in the current schema.
  // Proposed smallest addition (additive, nullable): DealParty.lastViewedAt DateTime?
  // updated on authenticated deal view / invite open (throttled), no destructive migration.
  const partyStates = deal.parties.map((p) => {
    const signed = partyHasSigned(deal, p.id);
    const invited = deal.invitations.some((i) => i.partyId === p.id);
    let state = "Not joined";
    if (signed) state = "Signed";
    else if (invited) state = "Invited";
    else if (p.userId) state = "Joined";
    if (isClosed && !signed) state = "Closed";
    return { ...p, state, signed, viewedTracked: false as const };
  });

  const timeline = [...deal.events].sort((a, b) => b.sequence - a.sequence);

  return (
    <div className="space-y-5">
      <Link
        href="/deals"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        Back to agreements
      </Link>

      <div className="rounded-card-lg bg-surface-raised p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={deal.status} />
              <span className="font-mono text-[11px] font-semibold text-ink-subtle">
                {deal.reference}
              </span>
              {seal ? (
                <span className="inline-flex items-center gap-1 rounded-pill bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  Sealed
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-[24px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[30px]">
              {deal.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted">
              <span className="font-semibold text-ink">
                {deal.totalAmount ? formatNaira(deal.totalAmount) : "Amount not set"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {deal.parties.length} participant{deal.parties.length === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Updated {formatDate(deal.updatedAt)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <AvatarStack names={partyNames} max={4} />
              <span className="text-[12px] text-ink-muted">{partyNames.join(" · ")}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {executed && seal ? (
              <Link
                href={`/deals/${deal.id}/documents/${executed.id}`}
                className={buttonStyles({ size: "sm" })}
              >
                <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Executed copy
              </Link>
            ) : document ? (
              <Link
                href={`/deals/${deal.id}/documents/${document.id}`}
                className={buttonStyles({ variant: "outline", size: "sm" })}
              >
                <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Source PDF
              </Link>
            ) : null}
            {seal ? (
              <Link
                href={`/verify/${seal.verificationToken}`}
                className={buttonStyles({ variant: "outline", size: "sm" })}
              >
                <QrCode className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Verify
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {TABS.map((item) => {
              const active = tab === item.key;
              return (
                <Link
                  key={item.key}
                  href={`/deals/${deal.id}?tab=${item.key}${token ? `&token=${encodeURIComponent(token)}` : ""}`}
                  className={cn(
                    "shrink-0 rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-primary text-white shadow-[var(--shadow-soft)]"
                      : "bg-surface-raised text-ink-muted shadow-[var(--shadow-soft)] hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {created ? (
            <Alert tone="success" title="Agreement created">
              Review the terms below, then share the invitation link with the other party so they can
              review and sign.
            </Alert>
          ) : null}
          {sent ? (
            <Alert tone="success" title="Invitation link ready">
              A new secure access link has been created. It is shown once in the Share &amp; invite
              section below — copy it now and send it to the other party.
            </Alert>
          ) : null}
          {revoked ? (
            <Alert tone="info" title="Invitation links revoked">
              Active invitation links for this agreement have been revoked. You can create a new link
              in the Share &amp; invite section when ready.
            </Alert>
          ) : null}

          {tab === "terms" ? (
            <div className="space-y-4">
              <div id="agreement-terms" className="scroll-mt-24">
              <Card>
                <CardHeader
                  title="Agreement terms"
                  description={agreement.subtitle}
                  action={
                    document ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-medium text-ink-muted">Document hash</span>
                        <HashChip hash={document.sha256} />
                      </div>
                    ) : null
                  }
                />
                <CardBody className="space-y-5">
                  {document ? (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
                      <span>Version {deal.currentVersion}</span>
                      <span>{DOCUMENT_LABEL[document.documentType] ?? document.documentType}</span>
                      <span>{formatDate(document.createdAt)}</span>
                    </div>
                  ) : null}
                  {document?.changeSummary ? (
                    <RevisedVersionNotice
                      versionNumber={deal.currentVersion}
                      summary={document.changeSummary}
                    />
                  ) : null}
                  <div className="rounded-[20px] bg-surface-muted p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Parties</p>
                    {agreement.parties.map((item) => (
                      <p key={`${item.role}-${item.name}`} className="mt-1 text-[13px] text-ink">
                        <span className="font-semibold">{item.role}:</span> {item.name}
                      </p>
                    ))}
                  </div>
                  {agreement.sections.map((section, index) => (
                    <div key={`${section.heading}-${index}`}>
                      <h3 className="text-[14px] font-bold text-ink">{index + 1}. {section.heading}</h3>
                      {section.body.map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex} className="mt-1.5 text-[13px] leading-6 text-ink-muted">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ))}
                  {agreement.notice ? (
                    <Alert tone="warning" title="Important limitation">{agreement.notice}</Alert>
                  ) : null}
                  {!template && document ? (
                    <Alert tone="info" title="Uploaded PDF">
                      The uploaded file is the agreement. Open the PDF to read the full terms.
                    </Alert>
                  ) : null}
                </CardBody>
              </Card>
              </div>

              <div id="signing" className="grid scroll-mt-24 gap-4">
                <Card>
                  <CardHeader title="Signatures" description="Per-party status for the current version." />
                  <CardBody className="space-y-2.5">
                    {partyStates.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-surface-muted p-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink">
                            {p.fullName}{p.userId === currentUser.id ? " (you)" : ""}
                          </p>
                          <p className="text-[11px] text-ink-muted">{p.role} · {p.state}</p>
                          <p className="text-[10px] text-ink-subtle">Viewed: not tracked yet</p>
                        </div>
                        {p.signed ? (
                          <span className="inline-flex items-center gap-1 rounded-pill bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                            Signed
                          </span>
                        ) : (
                          <span className="rounded-pill bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Pending</span>
                        )}
                      </div>
                    ))}
                  </CardBody>
                </Card>

                <div className="space-y-4">
                  {isCreator && me ? (
                    <SignPanel
                      dealId={deal.id}
                      versionNumber={deal.currentVersion}
                      defaultName={me.fullName}
                      alreadySigned={mySigned}
                      canSign={openForSigning}
                    />
                  ) : null}
                  {isCreator && template && !isClosed && deal.status !== DEAL_STATUS.EXECUTED ? (
                    <Card>
                      <CardHeader title="Amend terms" description="Changing terms creates a new version." />
                      <CardBody>
                        <VersionForm dealId={deal.id} template={template} values={values} />
                      </CardBody>
                    </Card>
                  ) : null}
                </div>
              </div>

              <div id="invite" className="grid gap-4">
                <Card>
                  <CardHeader title="Share & invite" description={otherParty ? `${otherParty.fullName}` : "No other party on this agreement."} />
                  <CardBody className="space-y-3">
                    <div className="flex flex-col gap-3 rounded-[18px] bg-surface-muted p-3 text-[12px] sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{activeInvitation ? "Active invitation" : "No active invitation"}</p>
                        <p className="text-[11px] text-ink-muted">
                          {activeInvitation ? `Expires ${formatDate(activeInvitation.expiresAt)} · opens ${activeInvitation.openCount}` : "Create a link to invite or re-share access."}
                        </p>
                      </div>
                      <Badge tone={activeInvitation ? "success" : "neutral"} className="w-fit shrink-0">{activeInvitation?.status ?? "NONE"}</Badge>
                    </div>
                    {inviteUrl ? (
                      <div className="rounded-[18px] bg-violet-50 p-3">
                        <p className="text-[11px] font-bold text-violet-700">New link (shown once)</p>
                        <p className="mt-1 break-all font-mono text-[10px] text-ink">{inviteUrl}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <CopyButton value={inviteUrl} />
                          <a href={inviteUrl} target="_blank" rel="noreferrer" className={buttonStyles({ variant: "outline", size: "sm" })}>
                            <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Open
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[12px] leading-5 text-ink-muted">For security, existing links are never shown again. Create a new link if needed.</p>
                    )}
                    {isCreator && !isClosed && otherParty ? (
                      <div className="flex flex-wrap gap-2">
                        <form action={sendInvitationAction}>
                          <input type="hidden" name="dealId" value={deal.id} />
                          <button type="submit" className={buttonStyles({ size: "sm" })}>
                            <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                            {otherPartySigned ? (activeInvitation ? "Create new access link" : "Create access link") : (activeInvitation ? "Create new link" : "Create invitation link")}
                          </button>
                        </form>
                        {activeInvitation ? (
                          <form action={revokeInvitationAction}>
                            <input type="hidden" name="dealId" value={deal.id} />
                            <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>Revoke active links</button>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </CardBody>
                </Card>

                <WitnessPanel
                  dealId={deal.id}
                  parties={deal.parties.map((item) => ({ id: item.id, fullName: item.fullName, role: item.role, isCreator: item.isCreator }))}
                  witnesses={witnessViews}
                  canManage={isCreator || currentUser.isAdmin}
                  viewerPartyId={me?.id ?? null}
                  disabled={isClosed || Boolean(deal.executedAt) || deal.status === DEAL_STATUS.EXECUTED}
                />
              </div>

              {isCreator && !isClosed ? (
                <Card>
                  <CardHeader title="Close this agreement" description="Actions are recorded in the audit trail." />
                  <CardBody className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {deal.status !== DEAL_STATUS.EXECUTED && deal.status !== DEAL_STATUS.ACTIVE ? (
                      <form action={cancelDealAction} className="flex flex-1 flex-col gap-2 sm:min-w-[240px]">
                        <input type="hidden" name="dealId" value={deal.id} />
                        <input name="reason" placeholder="Reason (optional)" className="w-full rounded-pill bg-surface-muted px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-300" />
                        <button type="submit" className={buttonStyles({ variant: "outline", size: "sm", className: "text-danger-700" })}>
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Cancel
                        </button>
                      </form>
                    ) : (
                      <form action={voidDealAction} className="flex flex-1 flex-col gap-2 sm:min-w-[240px]">
                        <input type="hidden" name="dealId" value={deal.id} />
                        <input name="reason" placeholder="Reason for voiding (required)" className="w-full rounded-pill bg-surface-muted px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-300" required />
                        <button type="submit" className={buttonStyles({ variant: "danger", size: "sm" })}>Void executed agreement</button>
                      </form>
                    )}
                    {[DEAL_STATUS.EXECUTED, DEAL_STATUS.ACTIVE, DEAL_STATUS.OVERDUE].includes(deal.status as never) ? (
                      <form action={markCompletedAction}>
                        <input type="hidden" name="dealId" value={deal.id} />
                        <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
                          <PackageCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Mark completed
                        </button>
                      </form>
                    ) : null}
                  </CardBody>
                </Card>
              ) : null}
            </div>
          ) : null}

          {tab === "negotiation" ? (
            <div className="space-y-4">
              {deal.status === DEAL_STATUS.CHANGE_REQUESTED ? (
                <Alert tone="warning" title="Change requested">
                  Review comments below, then amend terms in the Terms tab to create a new version.
                </Alert>
              ) : null}
              <CommentThread
                dealId={deal.id}
                comments={deal.comments}
                parties={deal.parties}
                currentPartyId={party?.id ?? null}
                isClosed={isClosed}
              />
              <Card>
                <CardHeader title="Version history" description="Terms changes create a new version with its own hash." />
                <CardBody className="space-y-2">
                  {deal.documents.filter((item) => !["receipt", "attachment", "signature", "certificate"].includes(item.documentType)).length === 0 ? (
                    <p className="text-[13px] text-ink-muted">No document versions yet.</p>
                  ) : (
                    deal.documents
                      .filter((item) => !["receipt", "attachment", "signature", "certificate"].includes(item.documentType))
                      .map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-3 rounded-[18px] bg-surface-muted px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-ink">v{item.versionNumber} · {DOCUMENT_LABEL[item.documentType] ?? item.documentType}</p>
                            <p className="truncate font-mono text-[10px] text-ink-subtle">{shortHash(item.sha256, 24)}</p>
                            <p className="text-[10px] text-ink-muted">{fmtWAT(item.createdAt)}</p>
                            {item.changeSummary ? (
                              <div className="mt-2">
                                <p className="text-[11px] font-semibold text-ink">What changed</p>
                                <ChangeSummaryBlock summary={item.changeSummary} compact className="mt-1.5" />
                              </div>
                            ) : null}
                          </div>
                          <Link href={`/deals/${deal.id}/documents/${item.id}`} className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink shadow-[var(--shadow-soft)]" aria-label="Download version">
                            <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                          </Link>
                        </div>
                      ))
                  )}
                </CardBody>
              </Card>
              <div className="rounded-card bg-surface-raised p-4 text-[12px] leading-5 text-ink-muted shadow-[var(--shadow-soft)]">
                <p className="font-semibold text-ink">Proposal workflow (v1)</p>
                <p className="mt-1">Use comments to propose and discuss changes. The creator can amend terms to publish a new version; all parties must sign the latest version. Per-clause accept/reject and automatic version-on-accept are not modeled yet — change requests are tracked in comments and audit events.</p>
              </div>
            </div>
          ) : null}

          {tab === "evidence" ? (
            <div className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader title="Execution artifacts" description="Sealed record, certificate, and downloads." />
                  <CardBody className="space-y-3">
                    {seal ? (
                      <>
                        <div className="space-y-1.5 text-[12px]">
                          <div className="flex justify-between gap-2"><span className="text-ink-muted">Serial</span><span className="font-mono font-semibold text-ink">{seal.serialNumber}</span></div>
                          <div className="flex justify-between gap-2"><span className="text-ink-muted">Status</span><Badge tone={seal.status === "ACTIVE" ? "success" : "danger"}>{seal.status}</Badge></div>
                          <div className="flex justify-between gap-2"><span className="text-ink-muted">Issued</span><span className="font-semibold text-ink">{fmtWAT(seal.issuedAt)}</span></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {executed ? <Link href={`/deals/${deal.id}/documents/${executed.id}`} className={buttonStyles({ size: "sm" })}><Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />Executed copy</Link> : null}
                          {certificate ? <Link href={`/deals/${deal.id}/documents/${certificate.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}><FileText className="h-4 w-4" strokeWidth={1.5} aria-hidden />Certificate</Link> : null}
                          <Link href={`/deals/${deal.id}/evidence`} className={buttonStyles({ variant: "outline", size: "sm" })}><Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />Evidence pack</Link>
                          <Link href={`/verify/${seal.verificationToken}`} className={buttonStyles({ variant: "outline", size: "sm" })}><QrCode className="h-4 w-4" strokeWidth={1.5} aria-hidden />Verify</Link>
                        </div>
                        {isCreator ? <ExecutionArtifactsButton dealId={deal.id} /> : null}
                      </>
                    ) : (
                      <EmptyState
                        icon={<ShieldCheck className="h-5 w-5" strokeWidth={1.5} aria-hidden />}
                        title="No sealed record yet"
                        description="A seal, certificate, and evidence pack are generated after all required parties and witnesses complete signing."
                        action={executionReady && isCreator ? <ExecutionArtifactsButton dealId={deal.id} /> : undefined}
                      />
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Documents & hashes" description="Stored files and their SHA-256 hashes." />
                  <CardBody className="space-y-2">
                    {deal.documents.length === 0 ? (
                      <p className="text-[13px] text-ink-muted">No documents stored yet.</p>
                    ) : (
                      deal.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-surface-muted px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-ink">{DOCUMENT_LABEL[doc.documentType] ?? doc.documentType} · v{doc.versionNumber}</p>
                            <p className="truncate font-mono text-[10px] text-ink-subtle">{shortHash(doc.sha256, 28)}</p>
                          </div>
                          <Link href={`/deals/${deal.id}/documents/${doc.id}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink shadow-[var(--shadow-soft)]" aria-label="Download document">
                            <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                          </Link>
                        </div>
                      ))
                    )}
                  </CardBody>
                </Card>
              </div>

              <div className="grid gap-4">
                <Card>
                  <CardHeader title="Payments" description="Party-recorded payments and receipts." />
                  <CardBody className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-[12px]">
                      <div className="rounded-[16px] bg-surface-muted p-2.5"><p className="text-ink-muted">Total</p><p className="font-bold text-ink">{summary.total === null ? "—" : formatNaira(summary.total)}</p></div>
                      <div className="rounded-[16px] bg-sky-50 p-2.5"><p className="text-sky-700">Paid</p><p className="font-bold text-ink">{formatNaira(summary.paid)}</p></div>
                      <div className="rounded-[16px] bg-amber-50 p-2.5"><p className="text-amber-700">Outstanding</p><p className="font-bold text-ink">{summary.outstanding === null ? "—" : formatNaira(summary.outstanding)}</p></div>
                    </div>
                    {deal.payments.length === 0 ? (
                      <p className="text-[13px] text-ink-muted">No payments recorded yet.</p>
                    ) : (
                      deal.payments.map((payment) => {
                        const voided = Boolean(payment.voidedAt);
                        const canManage =
                          !isClosed &&
                          !voided &&
                          (currentUser.isAdmin || isCreator || payment.recordedByPartyId === me?.id);
                        return (
                          <div key={payment.id} className={cn("rounded-[18px] bg-surface-muted p-3", voided && "opacity-70")}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={cn("text-[14px] font-bold text-ink", voided && "line-through")}>{formatNaira(payment.amount)}</p>
                                <p className="text-[11px] text-ink-muted">{formatDate(payment.paymentDate)} · {payment.paymentMethod}</p>
                              </div>
                              <Badge tone={voided ? "danger" : "warning"}>{voided ? "Voided" : payment.verificationStatus}</Badge>
                            </div>
                            {payment.receipt ? (
                              <a href={`/deals/${deal.id}/documents/${payment.receipt.id}`} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700">
                                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Receipt
                              </a>
                            ) : null}
                            <PaymentRecordActions
                              dealId={deal.id}
                              payment={{ id: payment.id, amount: payment.amount, paymentDateInput: toDateInputValue(payment.paymentDate), paymentMethod: payment.paymentMethod, reference: payment.reference, notes: payment.notes, revision: payment.revision }}
                              canManage={canManage}
                            />
                          </div>
                        );
                      })
                    )}
                    {!isClosed ? (
                      <div className="pt-2">
                        <p className="mb-2 text-[12px] font-semibold text-ink">Record a payment</p>
                        <PaymentForm dealId={deal.id} />
                      </div>
                    ) : null}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Obligations" description="Tasks and amounts with due dates." />
                  <CardBody className="space-y-3">
                    {deal.obligations.length === 0 ? (
                      <p className="text-[13px] text-ink-muted">No obligations recorded.</p>
                    ) : (
                      deal.obligations.map((obligation) => {
                        const overdue = isObligationOverdue(obligation);
                        const cancelled = obligation.status === OBLIGATION_STATUS.CANCELLED;
                        const canEdit =
                          !isClosed &&
                          !cancelled &&
                          (currentUser.isAdmin || isCreator || obligation.createdByPartyId === me?.id || obligation.responsiblePartyId === me?.id);
                        return (
                          <div key={obligation.id} className={cn("rounded-[18px] bg-surface-muted p-3", cancelled && "opacity-70")}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={cn("text-[13px] font-semibold text-ink", cancelled && "line-through")}>{obligation.title}</p>
                                <p className="text-[11px] text-ink-muted">
                                  {obligation.amount ? formatNaira(obligation.amount) : obligation.kind}
                                  {obligation.dueAt ? ` · due ${formatDate(obligation.dueAt)}` : ""}
                                </p>
                              </div>
                              <Badge tone={cancelled ? "neutral" : obligation.status === OBLIGATION_STATUS.COMPLETED ? "success" : overdue ? "danger" : "warning"}>
                                {cancelled ? "Cancelled" : overdue ? "Overdue" : obligation.status}
                              </Badge>
                            </div>
                            <ObligationRecordActions
                              dealId={deal.id}
                              obligation={{ id: obligation.id, title: obligation.title, description: obligation.description, amount: obligation.amount, dueAtInput: toDateInputValue(obligation.dueAt), responsiblePartyId: obligation.responsiblePartyId, status: obligation.status, revision: obligation.revision }}
                              parties={deal.parties.map((item) => ({ id: item.id, fullName: item.fullName, role: item.role }))}
                              canEdit={canEdit}
                              isClosed={isClosed}
                            />
                          </div>
                        );
                      })
                    )}
                    {!isClosed ? (
                      <div className="pt-2">
                        <p className="mb-2 text-[12px] font-semibold text-ink">Add an obligation</p>
                        <ObligationForm dealId={deal.id} parties={deal.parties.map((item) => ({ id: item.id, fullName: item.fullName, role: item.role }))} />
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              </div>

              <div className="rounded-card bg-surface-raised p-4 text-[12px] leading-5 text-ink-muted shadow-[var(--shadow-soft)]">
                <p className="font-semibold text-ink">Evidence vault uploads (coming soon)</p>
                <p className="mt-1">Uploading receipts, screenshots, and exported chats into a per-agreement evidence vault is coming soon. Payment receipts recorded here are already stored as evidence records.</p>
              </div>
            </div>
          ) : null}

          {tab === "audit" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader title="Audit trail" description={`${deal.events.length} recorded events · hash-chained log.`} />
                <CardBody>
                  {timeline.length === 0 ? (
                    <EmptyState icon={<Clock className="h-5 w-5" strokeWidth={1.5} aria-hidden />} title="No events recorded yet" description="Agreement events will appear here as they happen." />
                  ) : (
                    <ol className="relative space-y-0">
                      {timeline.map((event, idx) => (
                        <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                          <div className="flex flex-col items-center">
                            <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                              {event.sequence}
                            </span>
                            {idx < timeline.length - 1 ? <span className="mt-1 w-px flex-1 bg-violet-100" /> : null}
                          </div>
                          <div className="min-w-0 flex-1 rounded-[18px] bg-surface-muted p-3">
                            <p className="text-[13px] font-semibold text-ink">{EVENT_LABEL[event.eventType] ?? event.eventType}</p>
                            <p className="mt-0.5 text-[12px] leading-5 text-ink-muted">{event.description}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-subtle">
                              <span>{fmtWAT(event.createdAt)}</span>
                              {event.actorPartyId ? <span>by {deal.parties.find((p) => p.id === event.actorPartyId)?.fullName ?? "Party"}</span> : null}
                              <span className="font-mono">hash {shortHash(event.eventHash, 16)}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardBody>
              </Card>
              <Alert tone="info" title="Event coverage (existing log)">
                Logged today: deal/document creation &amp; versions, invitations/access links (create/deliver/open/accept/decline), contact verification, account linking, comments/edits/retractions, change requests, signature intent &amp; signatures, witness lifecycle, execution/completion/cancel/void, payments/receipts/obligations (create/update/void/cancel/complete/dispute), evidence pack generation, seal revocation, admin actions. Not yet logged as DealEvents: per-party document &quot;viewed&quot; timestamps and granular OTP send/fail attempts (OTP records exist separately).
              </Alert>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <Card>
            <CardHeader title="Participants" description="Roles and per-party state." />
            <CardBody className="space-y-2.5">
              {partyStates.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-2 rounded-[18px] bg-surface-muted p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{p.fullName}</p>
                    <p className="text-[11px] text-ink-muted">{p.role}{p.isCreator ? " · Creator" : ""}</p>
                    <p className="text-[11px] text-ink-muted">Auth: {AUTH_LEVEL_LABEL[p.authenticationLevel] ?? "—"}</p>
                    <p className="mt-0.5 text-[10px] text-ink-subtle">Viewed: not tracked yet</p>
                  </div>
                  <span className={cn("shrink-0 rounded-pill px-2.5 py-1 text-[10px] font-semibold", p.signed ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700")}>
                    {p.state}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Verification" description="Seal and hash status." />
            <CardBody className="space-y-2 text-[12px]">
              {seal ? (
                <>
                  <div className="flex items-center justify-between"><span className="text-ink-muted">Status</span><Badge tone={seal.status === "ACTIVE" ? "success" : "danger"}>{seal.status}</Badge></div>
                  <div className="flex items-center justify-between gap-2"><span className="text-ink-muted">Serial</span><span className="font-mono font-semibold text-ink">{seal.serialNumber}</span></div>
                  {executed ? (
                    <div>
                      <p className="mb-1 text-[10px] font-medium text-ink-muted">Sealed hash</p>
                      <HashChip hash={executed.sha256} />
                    </div>
                  ) : null}
                  <Link href={`/verify/${seal.verificationToken}`} className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-violet-700">
                    Open verification <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-ink-muted">Not sealed yet. A verifiable hash and certificate are issued after all required signatures.</p>
                  {document ? (
                    <div>
                      <p className="mb-1 text-[10px] font-medium text-ink-muted">Current version hash</p>
                      <HashChip hash={document.sha256} />
                    </div>
                  ) : null}
                </>
              )}
            </CardBody>
          </Card>

          <Card className="bg-violet-50">
            <CardHeader title="Next action" />
            <CardBody className="space-y-3">
              <p className="text-[13px] font-medium text-ink">{nextAction.label}</p>
              <p className="text-[12px] leading-5 text-ink-muted">
                {progress.signed}/{progress.required} signatures · {progress.witnessesAttested}/{progress.witnessesRequired} witnesses
              </p>
              <ButtonLink href={nextAction.href} size="sm" className="w-full">
                Continue <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </ButtonLink>
              <div className="pt-1 text-[11px] leading-5 text-ink-muted">
                <p className="inline-flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Identity is contact-verified (email/phone), not civil ID.</p>
                <p className="mt-1 inline-flex items-center gap-1"><Banknote className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Records do not guarantee payment or recovery.</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick facts" />
            <CardBody className="space-y-2 text-[12px]">
              {[
                ["Current version", String(deal.currentVersion)],
                ["Created", formatDate(deal.createdAt)],
                ["Executed", deal.executedAt ? fmtWAT(deal.executedAt) : "Not yet"],
                ["Template", template?.name ?? "Uploaded PDF"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <span className="text-ink-muted">{label}</span>
                  <span className="text-right font-semibold text-ink">{value}</span>
                </div>
              ))}
              {executionReady && (!executed || !seal || !certificate) && isCreator ? (
                <div className="pt-2"><ExecutionArtifactsButton dealId={deal.id} /></div>
              ) : null}
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
