import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Hash,
  Link2,
  MessageSquare,
  PackageCheck,
  QrCode,
  RefreshCw,
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
  statusTone,
  workspaceProgress,
} from "@/lib/deals";
import { buildAgreementContent } from "@/lib/agreement";
import { getTemplate } from "@/lib/templates";
import {
  AUTH_LEVEL_LABEL,
  DEAL_STATUS,
  DEAL_STATUS_LABEL,
  EVENT_LABEL,
  OBLIGATION_STATUS,
  WITNESS_STATUS,
  WITNESS_STATUS_LABEL,
} from "@/lib/constants";
import {
  formatDate,
  formatDateTime,
  formatNaira,
  shortHash,
  titleCase,
} from "@/lib/utils";
import {
  cancelDealAction,
  markCompletedAction,
  regenerateEvidenceAction,
  revokeInvitationAction,
  sendInvitationAction,
  updateObligationAction,
  voidDealAction,
} from "@/server/actions/deals";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonStyles } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Alert } from "@/components/ui/alert";
import { CopyButton } from "@/components/ui/copy-button";
import { SignPanel } from "@/components/deals/sign-panel";
import { VersionForm } from "@/components/deals/version-form";
import { CommentForm } from "@/components/deals/comment-form";
import { PaymentForm } from "@/components/deals/payment-form";
import { ObligationForm } from "@/components/deals/obligation-form";
import { WitnessPanel } from "@/components/deals/witness-panel";

export const metadata = { title: "Deal workspace" };

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "agreement", label: "Agreement" },
  { key: "activity", label: "Activity" },
  { key: "payments", label: "Payments" },
  { key: "invite", label: "Invite & sign" },
];

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

export default async function DealWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ tab?: string; token?: string; version?: string }>;
}) {
  const user = await getDealAccess((await params).dealId);
  if (!user) notFound();
  const { user: currentUser, deal, party, isCreator } = user;
  const { tab: rawTab, token } = await searchParams;
  const tab = TABS.some((item) => item.key === rawTab) ? rawTab! : "overview";

  const template = getTemplate(deal.templateSlug);
  const values = safeValues(deal);
  const document = currentDocument(deal);
  const progress = workspaceProgress(deal);
  const summary = paymentSummary(deal);
  const seal = deal.seals[0] ?? null;
  const executed = executedDocument(deal);
  const certificate = certificateDocument(deal);
  const creatorParty = deal.parties.find((item) => item.isCreator);
  const otherParty = deal.parties.find((item) => !item.isCreator);
  const me = party ?? deal.parties.find((item) => item.userId === currentUser.id) ?? creatorParty;
  const mySigned = me ? partyHasSigned(deal, me.id) : false;
  const openForSigning = canSign(deal);
  const tone = statusTone(deal.status) as "success" | "warning" | "danger" | "neutral";
  const activeInvitation = getActiveInvitation(deal);
  const baseUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const inviteUrl = token ? `${baseUrl}/invite/${token}` : null;
  const isClosed = [DEAL_STATUS.CANCELLED, DEAL_STATUS.VOIDED, DEAL_STATUS.COMPLETED, DEAL_STATUS.SUPERSEDED].includes(
    deal.status as never,
  );

  const agreement = buildAgreementContent(deal, deal.parties);
  const witnessViews = (document ? deal.witnesses.filter((witness) => witness.documentId === document.id) : []).map(
    (witness) => ({
      id: witness.id,
      witnessedPartyId: witness.witnessedPartyId,
      witnessedPartyName:
        deal.parties.find((item) => item.id === witness.witnessedPartyId)?.fullName ?? "Party",
      fullName: witness.fullName,
      status: witness.status,
      statusLabel: WITNESS_STATUS_LABEL[witness.status] ?? witness.status,
      required: witness.required,
      expiresLabel: formatDate(witness.expiresAt),
      attestedLabel: witness.attestedAt ? formatDateTime(witness.attestedAt) : null,
      openCount: witness.openCount,
      canManage:
        !isClosed &&
        deal.status !== DEAL_STATUS.EXECUTED &&
        (isCreator ||
          currentUser.isAdmin ||
          me?.id === witness.addedByPartyId ||
          me?.id === witness.witnessedPartyId) &&
        witness.status !== WITNESS_STATUS.REVOKED &&
        witness.status !== WITNESS_STATUS.SUPERSEDED,
      canResend:
        !isClosed &&
        deal.status !== DEAL_STATUS.EXECUTED &&
        witness.status !== WITNESS_STATUS.ATTESTED &&
        witness.status !== WITNESS_STATUS.REVOKED &&
        witness.status !== WITNESS_STATUS.SUPERSEDED &&
        (isCreator ||
          currentUser.isAdmin ||
          me?.id === witness.addedByPartyId ||
          me?.id === witness.witnessedPartyId),
    }),
  );

  return (
    <div className="space-y-5">
      <Link href="/deals" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to deals
      </Link>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={tone}>{DEAL_STATUS_LABEL[deal.status] ?? deal.status}</Badge>
            <span className="font-mono text-[11px] font-semibold text-ink-500">{deal.reference}</span>
            {deal.status === DEAL_STATUS.EXECUTED ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Sealed record
              </span>
            ) : null}
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            {deal.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {deal.parties.map((item) => item.fullName).join(" · ")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              Updated {formatDate(deal.updatedAt)}
            </span>
            {template ? <span>{template.name}</span> : <span>Uploaded PDF</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {executed && seal ? (
            <>
              <Link href={`/deals/${deal.id}/evidence`} className={buttonStyles({ size: "sm" })}>
                <Download className="h-4 w-4" aria-hidden />
                Evidence pack
              </Link>
              <Link href={`/verify/${seal.verificationToken}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
                <QrCode className="h-4 w-4" aria-hidden />
                Verify
              </Link>
            </>
          ) : null}
          {!isClosed && isCreator ? (
            <Link href={`/deals/${deal.id}?tab=invite`} className={buttonStyles({ variant: "outline", size: "sm" })}>
              <Send className="h-4 w-4" aria-hidden />
              Invite
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Deal value</p>
          <p className="mt-1 truncate text-[15px] font-bold text-ink-900">
            {deal.totalAmount ? formatNaira(deal.totalAmount) : "Not set"}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Paid</p>
          <p className="mt-1 truncate text-[15px] font-bold text-brand-800">{formatNaira(summary.paid)}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Outstanding</p>
          <p className="mt-1 truncate text-[15px] font-bold text-ink-900">
            {summary.outstanding === null ? "Not set" : formatNaira(summary.outstanding)}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Signed</p>
          <p className="mt-1 text-[15px] font-bold text-ink-900">
            {progress.signed} / {progress.required}
          </p>
        </Card>
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-b border-ink-200 pb-0">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/deals/${deal.id}?tab=${item.key}${token ? `&token=${encodeURIComponent(token)}` : ""}`}
            className={
              tab === item.key
                ? "shrink-0 border-b-2 border-brand-600 px-3 py-2.5 text-[13px] font-bold text-brand-800"
                : "shrink-0 border-b-2 border-transparent px-3 py-2.5 text-[13px] font-semibold text-ink-500 hover:text-ink-800"
            }
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader title="Parties and signatures" description="Signatures are tied to the current version." />
              <CardBody className="space-y-3">
                {deal.parties.map((item) => {
                  const signed = partyHasSigned(deal, item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={item.fullName} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-ink-900">
                            {item.fullName}
                            {item.userId === currentUser.id ? " (you)" : ""}
                          </p>
                          <p className="text-[11px] text-ink-500">
                            {item.role} · {AUTH_LEVEL_LABEL[item.authenticationLevel] ?? "Not verified"}
                          </p>
                        </div>
                      </div>
                      {signed ? (
                        <Badge tone="success">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          Signed
                        </Badge>
                      ) : (
                        <Badge tone="warning">Awaiting signature</Badge>
                      )}
                    </div>
                  );
                })}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Payment position" description="Party-recorded payments only." />
              <CardBody className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-ink-50 p-3">
                  <p className="text-[11px] text-ink-500">Total</p>
                  <p className="text-sm font-bold text-ink-900">
                    {summary.total === null ? "Not set" : formatNaira(summary.total)}
                  </p>
                </div>
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-[11px] text-brand-700">Paid</p>
                  <p className="text-sm font-bold text-brand-900">{formatNaira(summary.paid)}</p>
                </div>
                <div className="rounded-xl bg-sand-100 p-3">
                  <p className="text-[11px] text-sand-700">Outstanding</p>
                  <p className="text-sm font-bold text-sand-700">
                    {summary.outstanding === null ? "Not set" : formatNaira(summary.outstanding)}
                  </p>
                </div>
                <div className="sm:col-span-3 flex flex-wrap gap-2 text-[11px]">
                  <Badge tone={summary.status === "PAID" ? "success" : summary.status === "UNPAID" ? "danger" : "warning"}>
                    {titleCase(summary.status)}
                  </Badge>
                  {summary.overdue > 0 ? <Badge tone="danger">{summary.overdue} overdue</Badge> : null}
                  {summary.nextDue ? <Badge tone="info">Next due {formatDate(summary.nextDue)}</Badge> : null}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Recent activity"
                description="Key events in the deal record."
                action={
                  <Link href={`/deals/${deal.id}?tab=activity`} className="text-[12px] font-semibold text-brand-700">
                    View all
                  </Link>
                }
              />
              <CardBody className="space-y-3">
                {deal.events.slice(-5).reverse().map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-ink-800">
                        {EVENT_LABEL[event.eventType] ?? event.eventType}
                      </p>
                      <p className="text-[12px] leading-5 text-ink-500">{event.description}</p>
                      <p className="text-[10px] text-ink-400">{formatDateTime(event.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Record details" />
              <CardBody className="space-y-2.5 text-[12px]">
                {[
                  ["Reference", deal.reference],
                  ["Template", template?.name ?? "Uploaded PDF"],
                  ["Current version", String(deal.currentVersion)],
                  ["Created", formatDate(deal.createdAt)],
                  ["Executed", deal.executedAt ? formatDateTime(deal.executedAt) : "Not yet"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-ink-500">{label}</span>
                    <span className="text-right font-semibold text-ink-800">{value}</span>
                  </div>
                ))}
              </CardBody>
            </Card>

            {seal ? (
              <Card className="border-brand-200 bg-brand-50">
                <CardHeader title="Verification seal" description="Platform verification record." />
                <CardBody className="space-y-2.5 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-brand-800/80">Serial</span>
                    <span className="font-mono font-semibold text-brand-900">{seal.serialNumber}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-brand-800/80">Status</span>
                    <Badge tone={seal.status === "ACTIVE" ? "success" : "danger"}>{seal.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-brand-800/80">Issued</span>
                    <span className="font-semibold text-brand-900">{formatDate(seal.issuedAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link href={`/verify/${seal.verificationToken}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
                      <QrCode className="h-3.5 w-3.5" aria-hidden />
                      Public page
                    </Link>
                    {certificate ? (
                      <Link href={`/deals/${deal.id}/documents/${certificate.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        Certificate
                      </Link>
                    ) : null}
                  </div>
                  <p className="pt-1 text-[10px] leading-4 text-brand-800/70">
                    This seal confirms the platform record. It is not an NBA, notarial or government
                    seal and does not guarantee recovery or admissibility.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardHeader title="No seal yet" description="A seal is issued after all required parties sign." />
                <CardBody>
                  <p className="text-[12px] leading-5 text-ink-500">
                    Once every required party signs the same document version, dealrec generates an
                    executed copy, certificate, verification page and evidence pack.
                  </p>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader title="Next steps" />
              <CardBody className="space-y-2 text-[12px] leading-5 text-ink-600">
                {deal.status === DEAL_STATUS.AWAITING_COUNTERPARTY ? (
                  <p>Share the invitation link so the other party can verify, review and sign.</p>
                ) : null}
                {deal.status === DEAL_STATUS.UNDER_REVIEW ? (
                  <p>The other party has opened the deal and is reviewing the current version.</p>
                ) : null}
                {deal.status === DEAL_STATUS.AWAITING_CREATOR_SIGNATURE ? (
                  <p>Your signature is needed. Open the Agreement tab to sign.</p>
                ) : null}
                {deal.status === DEAL_STATUS.AWAITING_OTHER_SIGNATURES ? (
                  <p>The other party still needs to sign. You can resend the invitation link.</p>
                ) : null}
                {deal.status === DEAL_STATUS.CHANGE_REQUESTED ? (
                  <p>A change was requested. Review the Activity tab, then prepare a revised version.</p>
                ) : null}
                {deal.status === DEAL_STATUS.EXECUTED ? (
                  <p>Record payments and complete obligations. Download the evidence pack for your records.</p>
                ) : null}
                {deal.status === DEAL_STATUS.CHANGE_REQUESTED || deal.status === DEAL_STATUS.AWAITING_OTHER_SIGNATURES ? (
                  <Link href={`/deals/${deal.id}?tab=invite`} className="inline-flex items-center gap-1 font-semibold text-brand-700">
                    Go to invite <Send className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ) : null}
              </CardBody>
            </Card>

            {isCreator && !isClosed ? (
              <Card className="border-red-200">
                <CardHeader title="Close this deal" description="This action is recorded in the event log." />
                <CardBody className="space-y-3">
                  {deal.status !== DEAL_STATUS.EXECUTED && deal.status !== DEAL_STATUS.ACTIVE ? (
                    <form action={cancelDealAction} className="space-y-2">
                      <input type="hidden" name="dealId" value={deal.id} />
                      <input
                        name="reason"
                        placeholder="Reason (optional)"
                        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[12px]"
                      />
                      <button type="submit" className={buttonStyles({ variant: "outline", size: "sm", className: "text-red-700" })}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Cancel deal
                      </button>
                    </form>
                  ) : (
                    <form action={voidDealAction} className="space-y-2">
                      <input type="hidden" name="dealId" value={deal.id} />
                      <input
                        name="reason"
                        placeholder="Reason for voiding (required)"
                        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[12px]"
                        required
                      />
                      <button type="submit" className={buttonStyles({ variant: "danger", size: "sm" })}>
                        Void executed deal
                      </button>
                    </form>
                  )}
                  {[DEAL_STATUS.EXECUTED, DEAL_STATUS.ACTIVE, DEAL_STATUS.OVERDUE].includes(deal.status as never) ? (
                    <form action={markCompletedAction}>
                      <input type="hidden" name="dealId" value={deal.id} />
                      <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
                        <PackageCheck className="h-3.5 w-3.5" aria-hidden />
                        Mark completed
                      </button>
                    </form>
                  ) : null}
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "agreement" ? (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader
                title={`Version ${deal.currentVersion}`}
                description={document ? `${DOCUMENT_LABEL[document.documentType] ?? document.documentType} · ${formatDate(document.createdAt)}` : "No document generated yet."}
                action={
                  document ? (
                    <Link href={`/deals/${deal.id}/documents/${document.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      PDF
                    </Link>
                  ) : null
                }
              />
              <CardBody>
                {document ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3 w-3" aria-hidden />
                      SHA-256 {shortHash(document.sha256, 20)}
                    </span>
                    <span>{Math.max(1, Math.round(document.fileSize / 1024))} KB</span>
                    {document.changeSummary ? (
                      <span className="basis-full whitespace-pre-line text-ink-600">{document.changeSummary}</span>
                    ) : null}
                  </div>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Agreement preview" description={agreement.subtitle} />
              <CardBody className="space-y-5">
                <div className="rounded-xl bg-ink-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Parties</p>
                  {agreement.parties.map((item) => (
                    <p key={`${item.role}-${item.name}`} className="mt-1 text-[13px] text-ink-800">
                      <span className="font-semibold">{item.role}:</span> {item.name}
                    </p>
                  ))}
                </div>
                {agreement.sections.map((section, index) => (
                  <div key={`${section.heading}-${index}`}>
                    <h3 className="text-[13px] font-bold text-ink-900">
                      {index + 1}. {section.heading}
                    </h3>
                    {section.body.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className="mt-1.5 text-[12px] leading-6 text-ink-600">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}
                {agreement.notice ? (
                  <Alert tone="warning" title="Important limitation">
                    {agreement.notice}
                  </Alert>
                ) : null}
                {!template && document ? (
                  <Alert tone="info" title="Uploaded PDF">
                    The uploaded file is the agreement. Open the PDF to read the full terms. The executed
                    copy adds a signature and verification page.
                  </Alert>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Version history" description="Every version has a stored hash and audit event." />
              <CardBody className="space-y-2">
                {deal.documents
                  .filter((item) => !["receipt", "attachment", "signature"].includes(item.documentType))
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-ink-800">
                          v{item.versionNumber} · {DOCUMENT_LABEL[item.documentType] ?? item.documentType}
                        </p>
                        <p className="truncate font-mono text-[10px] text-ink-500">{item.sha256}</p>
                        <p className="text-[10px] text-ink-400">{formatDateTime(item.createdAt)}</p>
                      </div>
                      <Link
                        href={`/deals/${deal.id}/documents/${item.id}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50"
                        aria-label={`Download ${DOCUMENT_LABEL[item.documentType] ?? item.documentType}`}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  ))}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4">
            {isCreator && me ? (
              <SignPanel
                dealId={deal.id}
                versionNumber={deal.currentVersion}
                defaultName={me.fullName}
                alreadySigned={mySigned}
                canSign={openForSigning}
              />
            ) : (
              <Card>
                <CardHeader title="Your signing page" description="Sign through your private invitation link." />
                <CardBody>
                  <p className="text-[12px] leading-5 text-ink-600">
                    The other party signs through the invite link sent to their email or phone. This keeps
                    each signature tied to the contact control check.
                  </p>
                  {token ? (
                    <ButtonLink href={`/invite/${token}`} className="mt-3" size="sm">
                      Open invitation
                    </ButtonLink>
                  ) : null}
                </CardBody>
              </Card>
            )}

            {isCreator && template && !isClosed && deal.status !== DEAL_STATUS.EXECUTED ? (
              <Card>
                <CardHeader title="Amend the agreement" description="Changing terms creates a new version." />
                <CardBody>
                  <VersionForm dealId={deal.id} template={template} values={values} />
                </CardBody>
              </Card>
            ) : null}

            <Card>
              <CardHeader title="Signing facts" />
              <CardBody className="space-y-2 text-[11px] leading-5 text-ink-500">
                <p>Each signature records the document hash, signer name, contact verification method, IP address, device and consent version.</p>
                <p>A signature only covers the version shown here. If a new version is created, everyone must sign again.</p>
                <p>Contact verification proves control of an email or phone number, not civil identity.</p>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "activity" ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader title="Event record" description={`${deal.events.length} events in the hash-chained log.`} />
            <CardBody>
              <ol className="space-y-3">
                {deal.events
                  .slice()
                  .reverse()
                  .map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 font-mono text-[10px] font-bold text-brand-700">
                        {event.sequence}
                      </span>
                      <div className="min-w-0 border-b border-ink-100 pb-3">
                        <p className="text-[12px] font-semibold text-ink-800">
                          {EVENT_LABEL[event.eventType] ?? event.eventType}
                        </p>
                        <p className="text-[12px] leading-5 text-ink-600">{event.description}</p>
                        <p className="mt-0.5 text-[10px] text-ink-400">
                          {formatDateTime(event.createdAt)}
                          {event.actorPartyId
                            ? ` · ${deal.parties.find((item) => item.id === event.actorPartyId)?.fullName ?? "Party"}`
                            : ""}
                        </p>
                        <p className="truncate font-mono text-[9px] text-ink-300">hash {event.eventHash}</p>
                      </div>
                    </li>
                  ))}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Comments and change requests" description="Visible to all deal parties." />
            <CardBody className="space-y-4">
              {deal.comments.length === 0 ? (
                <p className="text-[12px] text-ink-500">No comments yet.</p>
              ) : (
                deal.comments.map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-ink-100 p-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={comment.authorParty.fullName} size="sm" />
                      <div>
                        <p className="text-[12px] font-semibold text-ink-800">{comment.authorParty.fullName}</p>
                        <p className="text-[10px] text-ink-400">{formatDateTime(comment.createdAt)}</p>
                      </div>
                      {comment.kind !== "COMMENT" ? (
                        <Badge tone="warning" className="ml-auto">{titleCase(comment.kind)}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-[12px] leading-5 text-ink-600">{comment.message}</p>
                    {comment.attachment ? (
                      <a
                        href={`/deals/${deal.id}/documents/${comment.attachment.id}`}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700"
                      >
                        <FileText className="h-3 w-3" aria-hidden />
                        {comment.attachment.originalName ?? "Attachment"}
                      </a>
                    ) : null}
                  </div>
                ))
              )}
              {!isClosed ? <CommentForm dealId={deal.id} /> : null}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "payments" ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader title="Payment summary" description="Payments are recorded by parties; receipts are optional evidence." />
              <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] uppercase text-ink-400">Total</p>
                  <p className="text-sm font-bold">{summary.total === null ? "Not set" : formatNaira(summary.total)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-ink-400">Paid</p>
                  <p className="text-sm font-bold text-brand-800">{formatNaira(summary.paid)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-ink-400">Outstanding</p>
                  <p className="text-sm font-bold">{summary.outstanding === null ? "Not set" : formatNaira(summary.outstanding)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-ink-400">Status</p>
                  <Badge tone={summary.status === "PAID" ? "success" : summary.status === "UNPAID" ? "danger" : "warning"}>
                    {titleCase(summary.status)}
                  </Badge>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Payments" description={`${deal.payments.length} recorded`} />
              <CardBody className="space-y-2">
                {deal.payments.length === 0 ? (
                  <p className="text-[12px] text-ink-500">No payments recorded yet.</p>
                ) : (
                  deal.payments.map((payment) => (
                    <div key={payment.id} className="rounded-xl border border-ink-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[14px] font-bold text-ink-900">{formatNaira(payment.amount)}</p>
                          <p className="text-[11px] text-ink-500">
                            {formatDate(payment.paymentDate)} · {payment.paymentMethod}
                          </p>
                        </div>
                        <Badge tone="warning">{titleCase(payment.verificationStatus)}</Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-ink-500">
                        Recorded by {payment.recordedBy.fullName}
                        {payment.reference ? ` · Ref ${payment.reference}` : ""}
                      </p>
                      {payment.notes ? <p className="mt-1 text-[11px] text-ink-600">{payment.notes}</p> : null}
                      {payment.receipt ? (
                        <a
                          href={`/deals/${deal.id}/documents/${payment.receipt.id}`}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700"
                        >
                          <FileText className="h-3 w-3" aria-hidden />
                          Receipt
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Obligations" description="Tasks and payments with due dates." />
              <CardBody className="space-y-2">
                {deal.obligations.length === 0 ? (
                  <p className="text-[12px] text-ink-500">No obligations recorded.</p>
                ) : (
                  deal.obligations.map((obligation) => {
                    const overdue = isObligationOverdue(obligation);
                    return (
                      <div key={obligation.id} className="rounded-xl border border-ink-100 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[12px] font-semibold text-ink-900">{obligation.title}</p>
                            <p className="text-[11px] text-ink-500">
                              {obligation.amount ? formatNaira(obligation.amount) : obligation.kind}
                              {obligation.dueAt ? ` · due ${formatDate(obligation.dueAt)}` : ""}
                              {obligation.responsiblePartyId
                                ? ` · ${deal.parties.find((item) => item.id === obligation.responsiblePartyId)?.fullName ?? "Party"}`
                                : ""}
                            </p>
                            {obligation.description ? <p className="mt-1 text-[11px] text-ink-600">{obligation.description}</p> : null}
                          </div>
                          <Badge tone={obligation.status === OBLIGATION_STATUS.COMPLETED ? "success" : obligation.status === OBLIGATION_STATUS.DISPUTED ? "danger" : overdue ? "danger" : "warning"}>
                            {obligation.status}
                          </Badge>
                        </div>
                        {!isClosed && obligation.status !== OBLIGATION_STATUS.COMPLETED ? (
                          <div className="mt-2 flex gap-2">
                            <form action={updateObligationAction}>
                              <input type="hidden" name="dealId" value={deal.id} />
                              <input type="hidden" name="obligationId" value={obligation.id} />
                              <input type="hidden" name="status" value={OBLIGATION_STATUS.COMPLETED} />
                              <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
                                Mark done
                              </button>
                            </form>
                            {obligation.status !== OBLIGATION_STATUS.DISPUTED ? (
                              <form action={updateObligationAction}>
                                <input type="hidden" name="dealId" value={deal.id} />
                                <input type="hidden" name="obligationId" value={obligation.id} />
                                <input type="hidden" name="status" value={OBLIGATION_STATUS.DISPUTED} />
                                <button type="submit" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                                  Dispute
                                </button>
                              </form>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4">
            {!isClosed ? (
              <>
                <Card>
                  <CardHeader title="Record a payment" description="Add a bank transfer, cash payment or other receipt." />
                  <CardBody>
                    <PaymentForm dealId={deal.id} />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Add an obligation" description="Track a task or amount with a due date." />
                  <CardBody>
                    <ObligationForm
                      dealId={deal.id}
                      parties={deal.parties.map((item) => ({ id: item.id, fullName: item.fullName, role: item.role }))}
                    />
                  </CardBody>
                </Card>
              </>
            ) : (
              <Alert tone="info">Closed deals are read-only. You can still download the evidence pack.</Alert>
            )}
          </div>
        </div>
      ) : null}

      {tab === "invite" ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader
                title="Invite the other party"
                description={otherParty ? `${otherParty.fullName} · ${otherParty.email ?? otherParty.phoneNumber ?? "No contact"}` : "No other party on this deal."}
              />
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3">
                  <div>
                    <p className="text-[12px] font-semibold text-ink-800">
                      {activeInvitation ? "Active invitation" : "No active invitation"}
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {activeInvitation
                        ? `Expires ${formatDate(activeInvitation.expiresAt)} · ${activeInvitation.status}`
                        : "Creating a new invitation revokes the previous link."}
                    </p>
                  </div>
                  <Badge tone={activeInvitation ? "success" : "neutral"}>{activeInvitation?.status ?? "NONE"}</Badge>
                </div>

                {inviteUrl ? (
                  <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
                    <p className="text-[11px] font-bold text-brand-900">New invitation link</p>
                    <p className="mt-1 break-all font-mono text-[10px] text-brand-800">{inviteUrl}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <CopyButton value={inviteUrl} />
                      <a
                        href={inviteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonStyles({ variant: "outline", size: "sm" })}
                      >
                        <Link2 className="h-3.5 w-3.5" aria-hidden />
                        Open link
                      </a>
                    </div>
                    <p className="mt-2 text-[10px] leading-4 text-brand-800/70">
                      This link is only shown in this response. Store it or send it now. The other party
                      will still need a one-time code sent to their email or phone.
                    </p>
                  </div>
                ) : (
                  <Alert tone="info">
                    For security, existing invitation links are never shown again. Create a new
                    invitation if you need to resend the link.
                  </Alert>
                )}

                {isCreator && !isClosed && otherParty?.invitationStatus !== "SIGNED" ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={sendInvitationAction}>
                      <input type="hidden" name="dealId" value={deal.id} />
                      <button type="submit" className={buttonStyles({ size: "sm" })}>
                        <Send className="h-4 w-4" aria-hidden />
                        {activeInvitation ? "Create new link" : "Create invitation link"}
                      </button>
                    </form>
                    {activeInvitation ? (
                      <form action={revokeInvitationAction}>
                        <input type="hidden" name="dealId" value={deal.id} />
                        <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
                          Revoke active links
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </CardBody>
            </Card>

            <WitnessPanel
              dealId={deal.id}
              parties={deal.parties.map((item) => ({
                id: item.id,
                fullName: item.fullName,
                role: item.role,
                isCreator: item.isCreator,
              }))}
              witnesses={witnessViews}
              canManage={isCreator || currentUser.isAdmin}
              viewerPartyId={me?.id ?? null}
              disabled={isClosed || deal.status === DEAL_STATUS.EXECUTED}
            />

            <Card>
              <CardHeader title="Invitation history" />
              <CardBody className="space-y-2">
                {deal.invitations.length === 0 ? (
                  <p className="text-[12px] text-ink-500">No invitations created yet.</p>
                ) : (
                  deal.invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 px-3 py-2 text-[11px]">
                      <span className="text-ink-500">{formatDateTime(invitation.createdAt)}</span>
                      <span className="text-ink-500">opens {invitation.openCount}</span>
                      <Badge tone={invitation.revokedAt ? "neutral" : invitation.verifiedAt ? "success" : "warning"}>
                        {invitation.revokedAt ? "REVOKED" : invitation.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="How their signing works" />
              <CardBody className="space-y-3 text-[12px] leading-5 text-ink-600">
                <p className="flex gap-2"><UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />They open the link and request a one-time code sent to their email or phone.</p>
                <p className="flex gap-2"><FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />They review the exact current version and see its hash.</p>
                <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />They accept, request a change, decline or sign with consent.</p>
                <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />When everyone required has signed, the deal locks and execution artifacts are generated.</p>
              </CardBody>
            </Card>

            {executed && seal ? (
              <Card className="border-brand-200 bg-brand-50">
                <CardHeader title="Executed record" description="Ready to share or download." />
                <CardBody className="space-y-2">
                  <ButtonLink href={`/deals/${deal.id}/evidence`} className="w-full" size="sm">
                    <Download className="h-4 w-4" aria-hidden />
                    Download evidence pack
                  </ButtonLink>
                  <Link href={`/verify/${seal.verificationToken}`} className={buttonStyles({ variant: "outline", size: "sm", className: "w-full" })}>
                    <QrCode className="h-4 w-4" aria-hidden />
                    Verification page
                  </Link>
                  {isCreator ? (
                    <form action={regenerateEvidenceAction}>
                      <input type="hidden" name="dealId" value={deal.id} />
                      <button type="submit" className={buttonStyles({ variant: "ghost", size: "sm", className: "w-full" })}>
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                        Regenerate artifacts
                      </button>
                    </form>
                  ) : null}
                </CardBody>
              </Card>
            ) : null}

            <Card>
              <CardHeader title="Reminder" />
              <CardBody className="space-y-2 text-[11px] leading-5 text-ink-500">
                <p className="flex gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Invitation links expire after 14 days.</p>
                <p className="flex gap-2"><MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Use comments to clarify terms before signing; material changes require a new version.</p>
                <p className="flex gap-2"><Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Do not treat this record as a guarantee of payment or recovery.</p>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
