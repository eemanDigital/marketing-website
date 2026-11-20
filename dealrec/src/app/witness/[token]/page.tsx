import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, FileText, UserCheck } from "lucide-react";
import { buildAgreementContent } from "@/lib/agreement";
import { DEAL_STATUS, DEAL_STATUS_LABEL, WITNESS_STATUS, WITNESS_STATUS_LABEL } from "@/lib/constants";
import {
  findWitness,
  witnessCanAttest,
  witnessExecutionClosed,
  witnessProblem,
} from "@/lib/witness";
import { formatDate, formatDateTime, formatNaira, maskEmail, maskPhone, shortHash } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { TrackWitnessOpen } from "@/components/witness/track-open";
import { WitnessVerify } from "@/components/witness/witness-verify";
import { WitnessAccept } from "@/components/witness/witness-accept";
import { WitnessAttest } from "@/components/witness/witness-attest";

export const metadata = { title: "Witness an agreement" };

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

export default async function WitnessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const witness = await findWitness(token);

  if (!witness) {
    return (
      <Shell>
        <Card className="text-center">
          <CardBody className="py-12">
            <h1 className="text-xl font-extrabold text-ink">Witness link not found</h1>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-6 text-ink-muted">
              This link is not valid. Ask the person who invited you to create a fresh witness link.
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

  const problem = witnessProblem(witness);
  if (problem) {
    return (
      <Shell>
        <Card className="text-center">
          <CardBody className="py-12">
            <h1 className="text-xl font-extrabold text-ink">This witness link cannot be used</h1>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-6 text-ink-muted">{problem}</p>
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

  const deal = witness.deal;
  const document = witness.document;
  const agreement = buildAgreementContent(deal, deal.parties);
  const canAttest = witnessCanAttest(witness);
  const executionClosed = witnessExecutionClosed(witness);
  const contact = witness.email ? maskEmail(witness.email) : maskPhone(witness.phoneNumber);
  const attested = witness.status === WITNESS_STATUS.ATTESTED;
  const documentUrl = document
    ? `/deals/${deal.id}/documents/${document.id}?witnessToken=${encodeURIComponent(token)}`
    : null;

  return (
    <Shell>
      <TrackWitnessOpen token={token} />

      <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold text-ink-muted">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        You were asked to witness an agreement
      </div>

      <Card className="overflow-hidden">
        <div className="bg-violet-600 px-5 py-6 text-white sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/20">
              {WITNESS_STATUS_LABEL[witness.status] ?? witness.status}
            </span>
            <span className="font-mono text-[10px] text-white/70">{deal.reference}</span>
            <span className="rounded-pill bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90 ring-1 ring-inset ring-white/15">
              {witness.required ? "Required witness" : "Optional"}
            </span>
          </div>
          <h1 className="mt-2 text-[24px] font-extrabold tracking-tight sm:text-[30px]">{deal.title}</h1>
          <p className="mt-1.5 text-[13px] text-white/80">
            {witness.fullName} · Witness for {witness.witnessedParty.fullName} · version{" "}
            {document?.versionNumber ?? deal.currentVersion}
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
            <p className="mt-0.5 text-sm font-bold text-ink">{document?.versionNumber ?? deal.currentVersion}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">Deal status</p>
            <p className="mt-0.5 text-sm font-bold text-ink">
              {DEAL_STATUS_LABEL[deal.status] ?? deal.status}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:col-span-3">
            {deal.parties.map((party) => (
              <span
                key={party.id}
                className="inline-flex items-center gap-1.5 rounded-pill bg-surface-muted px-2.5 py-1.5 text-[11px] text-ink-muted"
              >
                <Avatar name={party.fullName} size="sm" className="h-5 w-5 text-[8px]" />
                {party.fullName}
                {party.id === witness.witnessedPartyId ? (
                  <UserCheck
                    className="h-3.5 w-3.5 text-violet-600"
                    strokeWidth={1.5}
                    aria-label="Witnessed party"
                  />
                ) : null}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      {document ? (
        <Card className="mt-4">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-violet-50 text-violet-700">
                <FileText className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink">Agreement version {document.versionNumber}</p>
                <p className="font-mono text-[10px] text-ink-subtle">SHA-256 {shortHash(document.sha256, 24)}</p>
                <p className="text-[10px] text-ink-subtle">{formatDateTime(document.createdAt)}</p>
              </div>
            </div>
            {documentUrl ? (
              <a href={documentUrl} className={buttonStyles({ variant: "outline", size: "sm" })}>
                <Download className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                Open PDF
              </a>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {attested ? (
        <Card className="mt-4 bg-sky-50">
          <CardBody className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" strokeWidth={1.5} aria-hidden />
            <div>
              <h2 className="text-[15px] font-bold text-ink">Witness attestation recorded</h2>
              <p className="mt-1 text-[13px] leading-6 text-ink-muted">
                You attested on {witness.attestedAt ? formatDateTime(witness.attestedAt) : formatDate(new Date())}.
                The attestation is locked to version {document?.versionNumber ?? deal.currentVersion} and this witness
                link cannot be used to change it.
              </p>
              <p className="mt-2 text-[12px] text-ink-muted">
                You can close this page. The parties can now see your attestation in the deal record.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : deal.status === DEAL_STATUS.EXECUTED ? (
        <Alert tone="warning" className="mt-4" title="Execution already completed">
          The deal was executed without this witness attestation. This link is now read-only and cannot be used to
          attest. Contact the inviting party if a new record is needed.
        </Alert>
      ) : executionClosed ? (
        <Alert tone="warning" className="mt-4" title="Witnessing is locked">
          This deal has already been executed or closed. The witness record is read-only.
        </Alert>
      ) : !witness.verifiedAt ? (
        <div className="mt-4">
          <WitnessVerify token={token} contact={contact} />
        </div>
      ) : witness.status !== WITNESS_STATUS.ACCEPTED ? (
        <div className="mt-4">
          <WitnessAccept
            token={token}
            witnessedName={witness.witnessedParty.fullName}
            versionNumber={document?.versionNumber ?? deal.currentVersion}
          />
        </div>
      ) : canAttest ? (
        <div className="mt-4">
          <WitnessAttest
            token={token}
            defaultName={witness.fullName}
            defaultAddress={witness.address}
            defaultOccupation={witness.occupation}
            defaultRelationship={witness.relationship}
            versionNumber={document?.versionNumber ?? deal.currentVersion}
            witnessedName={witness.witnessedParty.fullName}
          />
        </div>
      ) : (
        <Alert tone="info" className="mt-4" title="Intention to witness recorded">
          {witness.acceptedAt
            ? `You accepted this invitation on ${formatDateTime(witness.acceptedAt)}. `
            : "Your intention to witness is recorded. "}
          You can submit the separate attestation after {witness.witnessedParty.fullName} signs version{" "}
          {document?.versionNumber ?? deal.currentVersion}.
        </Alert>
      )}

      <Card className="mt-4">
        <CardHeader
          title="Agreement summary"
          description="The PDF is the agreement; this is a plain-language preview."
        />
        <CardBody className="space-y-4">
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
    </Shell>
  );
}
