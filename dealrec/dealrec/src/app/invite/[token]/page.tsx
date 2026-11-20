import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { findInvitation, invitationProblem } from "@/lib/deals";
import { buildAgreementContent } from "@/lib/agreement";
import { getSessionUser } from "@/lib/auth";
import { partyContactMatchesUser } from "@/lib/party-access";
import { db } from "@/lib/db";
import {
  DEAL_STATUS,
  DEAL_STATUS_LABEL,
  DOCUMENT_TYPE,
  INVITATION_STATUS,
  WITNESS_STATUS,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatNaira, maskEmail, maskPhone, shortHash } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { TrackOpen } from "@/components/invite/track-open";
import { InviteAccount } from "@/components/invite/invite-account";
import { InviteVerify } from "@/components/invite/invite-verify";
import { InviteRespond } from "@/components/invite/invite-respond";
import { InviteSign } from "@/components/invite/invite-sign";
import { InviteWitnessPanel } from "@/components/invite/invite-witness-panel";
import { RevisedVersionNotice } from "@/components/deals/change-summary-block";

export const metadata = { title: "Review your agreement" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-10 bg-surface-raised/90 shadow-[var(--shadow-soft)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            href="/verify"
            className="text-[12px] font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Verify a document
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-10 text-center text-[11px] leading-5 text-ink-subtle sm:px-6">
        dealrec records the agreement and signing events. It is not a law firm, notary or government
        service, and does not guarantee payment, enforceability or admissibility.
      </footer>
    </div>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await findInvitation(token);

  if (!invitation) {
    return (
      <Shell>
        <Card className="text-center">
          <CardBody className="py-12">
            <h1 className="text-xl font-extrabold text-ink">Invitation not found</h1>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-6 text-ink-muted">
              This link is not valid. Ask the person who created the agreement to send a new invitation.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex text-[13px] font-semibold text-violet-700 hover:text-violet-600"
            >
              Go to dealrec home
            </Link>
          </CardBody>
        </Card>
      </Shell>
    );
  }

  const deal = invitation.deal;
  const problem = invitationProblem(invitation);

  if (problem) {
    return (
      <Shell>
        <Card className="text-center">
          <CardBody className="py-12">
            <h1 className="text-xl font-extrabold text-ink">This invitation cannot be used</h1>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-6 text-ink-muted">{problem}</p>
            <p className="mt-2 text-[12px] text-ink-subtle">
              If you still need to review this agreement, ask the creator to send a fresh invitation link.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex text-[13px] font-semibold text-violet-700 hover:text-violet-600"
            >
              Go to dealrec home
            </Link>
          </CardBody>
        </Card>
      </Shell>
    );
  }

  const currentDoc =
    deal.documents.find(
      (document) =>
        document.versionNumber === deal.currentVersion &&
        (document.documentType === DOCUMENT_TYPE.DRAFT ||
          document.documentType === DOCUMENT_TYPE.UPLOADED_ORIGINAL),
    ) ?? null;
  const signatures = currentDoc
    ? deal.signatures.filter((signature) => signature.documentId === currentDoc.id)
    : [];
  const signed = signatures.some((signature) => signature.partyId === invitation.partyId);
  const required = deal.parties.filter((party) => party.signatureRequired);
  const allSigned = required.every((party) => signatures.some((signature) => signature.partyId === party.id));
  const currentWitnesses = currentDoc
    ? deal.witnesses.filter(
        (witness) =>
          witness.documentId === currentDoc.id &&
          witness.status !== WITNESS_STATUS.REVOKED &&
          witness.status !== WITNESS_STATUS.SUPERSEDED,
      )
    : [];
  const ownWitnesses = currentWitnesses
    .filter((witness) => witness.witnessedPartyId === invitation.partyId)
    .map((witness) => ({
      id: witness.id,
      fullName: witness.fullName,
      status: witness.status,
      required: witness.required,
      acceptedLabel: witness.acceptedAt ? formatDateTime(witness.acceptedAt) : null,
      attestedLabel: witness.attestedAt ? formatDateTime(witness.attestedAt) : null,
    }));
  const pendingWitnesses = currentWitnesses.filter(
    (witness) => witness.required && witness.status !== WITNESS_STATUS.ATTESTED,
  );
  const executed =
    deal.documents.find((document) => document.documentType === DOCUMENT_TYPE.EXECUTION_COPY) ?? null;
  const fullyExecuted = Boolean(executed) && allSigned && pendingWitnesses.length === 0;
  const witnessChangesDisabled =
    Boolean(deal.executedAt) ||
    [
      DEAL_STATUS.EXECUTED,
      DEAL_STATUS.ACTIVE,
      DEAL_STATUS.OVERDUE,
      DEAL_STATUS.COMPLETED,
      DEAL_STATUS.CANCELLED,
      DEAL_STATUS.VOIDED,
      DEAL_STATUS.SUPERSEDED,
    ].includes(deal.status as never);
  const agreement = buildAgreementContent(deal, deal.parties);
  const contact = invitation.party.email
    ? maskEmail(invitation.party.email)
    : maskPhone(invitation.party.phoneNumber);
  const evidenceUrl = `/deals/${deal.id}/evidence?token=${encodeURIComponent(token)}`;

  const seal = fullyExecuted
    ? await db.dealSeal.findFirst({ where: { dealId: deal.id }, orderBy: { issuedAt: "desc" } })
    : null;
  const certificate =
    deal.documents.find((item) => item.documentType === DOCUMENT_TYPE.CERTIFICATE) ?? null;
  const viewer = await getSessionUser();
  const accountMode: "signedOut" | "linked" | "linkedOther" | "claimable" | "mismatch" = !viewer
    ? "signedOut"
    : invitation.party.userId === viewer.id
      ? "linked"
      : invitation.party.userId
        ? "linkedOther"
        : partyContactMatchesUser(invitation.party, viewer)
          ? "claimable"
          : "mismatch";
  const accountEmail = invitation.party.email?.trim().toLowerCase() ?? null;
  const emailAccountReady = Boolean(
    invitation.verifiedAt && invitation.verifyMethod === "EMAIL_OTP" && accountEmail,
  );
  const emailAccountExists =
    emailAccountReady && !viewer && !invitation.party.userId && accountEmail
      ? Boolean(await db.user.findUnique({ where: { email: accountEmail }, select: { id: true } }))
      : false;

  const canSignNow = Boolean(currentDoc) && deal.status !== DEAL_STATUS.CHANGE_REQUESTED;

  return (
    <Shell>
      <TrackOpen token={token} />

      <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold text-ink-muted">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        You were invited to review this agreement
      </div>

      <Card className="overflow-hidden">
        <div className="bg-violet-600 px-5 py-6 text-white sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/20">
              {DEAL_STATUS_LABEL[deal.status] ?? deal.status}
            </span>
            <span className="font-mono text-[10px] text-white/70">{deal.reference}</span>
          </div>
          <h1 className="mt-2 text-[24px] font-extrabold tracking-tight sm:text-[30px]">{deal.title}</h1>
          <p className="mt-1.5 text-[13px] text-white/80">
            From {deal.creator.fullName} · created {formatDate(deal.createdAt)}
          </p>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Deal value</p>
            <p className="mt-0.5 text-sm font-bold text-ink">
              {deal.totalAmount ? formatNaira(deal.totalAmount) : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Version</p>
            <p className="mt-0.5 text-sm font-bold text-ink">{deal.currentVersion}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Your role</p>
            <p className="mt-0.5 text-sm font-bold text-ink">{invitation.party.role}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:col-span-3">
            {deal.parties.map((party) => (
              <span
                key={party.id}
                className="inline-flex items-center gap-1.5 rounded-pill bg-surface-muted px-2.5 py-1.5 text-[11px] text-ink-muted"
              >
                <Avatar name={party.fullName} size="sm" className="h-5 w-5 text-[8px]" />
                {party.fullName}
                {signatures.some((signature) => signature.partyId === party.id) ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" strokeWidth={1.5} aria-hidden />
                ) : null}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="mt-4">
        <InviteAccount
          token={token}
          dealId={deal.id}
          contact={contact}
          email={invitation.party.email}
          defaultName={invitation.party.fullName}
          verified={Boolean(invitation.verifiedAt)}
          emailAccountReady={emailAccountReady}
          emailAccountExists={emailAccountExists}
          mode={accountMode}
        />
      </div>

      {currentDoc ? (
        <Card className="mt-4">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-violet-50 text-violet-700">
                <FileText className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink">
                  Source agreement · version {currentDoc.versionNumber}
                </p>
                <p className="font-mono text-[10px] text-ink-subtle">
                  SHA-256 {shortHash(currentDoc.sha256, 24)}
                </p>
                <p className="text-[10px] text-ink-subtle">{formatDateTime(currentDoc.createdAt)}</p>
                <p className="mt-1 text-[11px] leading-4 text-ink-muted">
                  This is the original agreement file. Signatures are recorded in the executed copy after completion.
                </p>
              </div>
            </div>
            <Link
              href={`/deals/${deal.id}/documents/${currentDoc.id}?token=${encodeURIComponent(token)}`}
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Open source PDF
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Alert tone="warning" className="mt-4">
          The agreement document is not available yet. Ask the creator to check the deal.
        </Alert>
      )}

      {!invitation.verifiedAt ? (
        <div className="mt-4">
          <InviteVerify token={token} contact={contact} />
        </div>
      ) : signed || invitation.party.invitationStatus === INVITATION_STATUS.SIGNED ? (
        <div className="mt-4 space-y-4">
          <Card className="bg-sky-50">
            <CardBody className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" strokeWidth={1.5} aria-hidden />
              <div>
                <h2 className="text-[15px] font-bold text-ink">You have signed this agreement</h2>
                <p className="mt-1 text-[13px] leading-6 text-ink-muted">
                  Your signature is locked to version {currentDoc?.versionNumber ?? deal.currentVersion}.
                  {fullyExecuted
                    ? " All required parties have signed and required witnesses have attested, so the executed record is available."
                    : allSigned
                      ? pendingWitnesses.length > 0
                        ? ` All required parties have signed. ${pendingWitnesses.length} required witness${pendingWitnesses.length === 1 ? "" : "es"} still need to attest before execution.`
                        : " All required signatures and witness attestations are recorded. The executed copy is being prepared; refresh this page shortly."
                      : " The other required party still needs to sign."}
                </p>
                {fullyExecuted ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {executed ? (
                      <Link
                        href={`/deals/${deal.id}/documents/${executed.id}?token=${encodeURIComponent(token)}`}
                        className={buttonStyles({ size: "sm" })}
                      >
                        <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        Executed agreement
                      </Link>
                    ) : null}
                    <a href={evidenceUrl} className={buttonStyles({ variant: "outline", size: "sm" })}>
                      <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      Evidence pack
                    </a>
                    {certificate ? (
                      <Link
                        href={`/deals/${deal.id}/documents/${certificate.id}?token=${encodeURIComponent(token)}`}
                        className={buttonStyles({ variant: "outline", size: "sm" })}
                      >
                        <FileText className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        Certificate
                      </Link>
                    ) : null}
                    {seal ? (
                      <Link
                        href={`/verify/${seal.verificationToken}`}
                        className={buttonStyles({ variant: "outline", size: "sm" })}
                      >
                        <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        Verify
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Agreement summary" description={agreement.subtitle} />
            <CardBody className="space-y-4">
              {currentDoc?.changeSummary ? (
                <RevisedVersionNotice
                  versionNumber={deal.currentVersion}
                  summary={currentDoc.changeSummary}
                />
              ) : null}
              {agreement.sections.map((section, index) => (
                <div key={`${section.heading}-${index}`}>
                  <h3 className="text-[14px] font-bold text-ink">
                    {index + 1}. {section.heading}
                  </h3>
                  {section.body.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="mt-1.5 text-[13px] leading-6 text-ink-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader
              title="Agreement summary"
              description="Read the full PDF before responding. The PDF is the agreement; this is a plain-language preview."
            />
            <CardBody className="space-y-4">
              {currentDoc?.changeSummary ? (
                <RevisedVersionNotice
                  versionNumber={deal.currentVersion}
                  summary={currentDoc.changeSummary}
                />
              ) : null}
              <div className="rounded-[18px] bg-surface-muted p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Parties</p>
                {agreement.parties.map((party) => (
                  <p key={`${party.role}-${party.name}`} className="mt-1.5 text-[13px] text-ink">
                    <span className="font-semibold">{party.role}:</span> {party.name}
                  </p>
                ))}
              </div>
              {agreement.sections.map((section, index) => (
                <div key={`${section.heading}-${index}`}>
                  <h3 className="text-[14px] font-bold text-ink">
                    {index + 1}. {section.heading}
                  </h3>
                  {section.body.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="mt-1.5 text-[13px] leading-6 text-ink-muted">
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
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Your response" description="Accept, request a change, or decline." />
            <CardBody>
              <InviteRespond token={token} />
            </CardBody>
          </Card>

          {canSignNow && currentDoc ? (
            <InviteSign
              token={token}
              defaultName={invitation.party.fullName}
              versionNumber={currentDoc.versionNumber}
            />
          ) : (
            <Alert tone="warning" title="A new version is being prepared">
              The creator has been asked to revise the agreement. You will be able to sign once the new
              version is ready.
            </Alert>
          )}

          <Card>
            <CardHeader title="What gets recorded" />
            <CardBody className="space-y-2.5 text-[12px] leading-5 text-ink-muted">
              <p className="flex gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.5} aria-hidden />
                Each signature is tied to the document hash and your verified contact.
              </p>
              <p className="flex gap-2">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.5} aria-hidden />
                Your IP address, device user agent, signing time and consent version are stored.
              </p>
              <p className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.5} aria-hidden />
                Signing does not guarantee payment or legal enforceability. Some agreements need witnesses or other formalities.
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {invitation.verifiedAt && currentDoc ? (
        <div className="mt-4">
          <InviteWitnessPanel token={token} witnesses={ownWitnesses} disabled={witnessChangesDisabled} />
        </div>
      ) : null}
    </Shell>
  );
}
