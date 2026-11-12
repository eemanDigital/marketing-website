import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { buildAgreementContent } from "@/lib/agreement";
import { DEAL_STATUS, DEAL_STATUS_LABEL, WITNESS_STATUS, WITNESS_STATUS_LABEL } from "@/lib/constants";
import { findWitness, witnessCanAttest, witnessProblem } from "@/lib/witness";
import { formatDate, formatDateTime, formatNaira, maskEmail, maskPhone, shortHash } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { TrackWitnessOpen } from "@/components/witness/track-open";
import { WitnessVerify } from "@/components/witness/witness-verify";
import { WitnessAttest } from "@/components/witness/witness-attest";

export const metadata = { title: "Witness an agreement" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/verify" className="text-[12px] font-semibold text-ink-500 hover:text-ink-800">
            Verify a document
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-10 text-center text-[10px] leading-5 text-ink-400 sm:px-6">
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
          <CardBody className="py-10">
            <h1 className="text-xl font-extrabold text-ink-900">Witness link not found</h1>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-ink-600">
              This link is not valid. Ask the person who invited you to create a fresh witness link.
            </p>
            <Link href="/" className="mt-4 inline-flex text-[13px] font-semibold text-brand-700">
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
          <CardBody className="py-10">
            <h1 className="text-xl font-extrabold text-ink-900">This witness link cannot be used</h1>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-ink-600">{problem}</p>
            <Link href="/" className="mt-4 inline-flex text-[13px] font-semibold text-brand-700">
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
  const contact = witness.email ? maskEmail(witness.email) : maskPhone(witness.phoneNumber);
  const attested = witness.status === WITNESS_STATUS.ATTESTED;
  const documentUrl = document
    ? `/deals/${deal.id}/documents/${document.id}?witnessToken=${encodeURIComponent(token)}`
    : null;

  return (
    <Shell>
      <TrackWitnessOpen token={token} />

      <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-ink-500">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        You were asked to witness an agreement
      </div>

      <Card className="overflow-hidden">
        <div className="bg-ink-900 px-5 py-5 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{WITNESS_STATUS_LABEL[witness.status] ?? witness.status}</Badge>
            <span className="font-mono text-[10px] text-ink-300">{deal.reference}</span>
            {witness.required ? (
              <Badge tone="warning">Required witness</Badge>
            ) : (
              <Badge tone="neutral">Optional</Badge>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{deal.title}</h1>
          <p className="mt-1.5 text-[12px] text-ink-300">
            {witness.fullName} · Witness for {witness.witnessedParty.fullName} · version{" "}
            {document?.versionNumber ?? deal.currentVersion}
          </p>
        </div>
        <CardBody className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Deal value</p>
            <p className="text-sm font-bold text-ink-900">
              {deal.totalAmount ? formatNaira(deal.totalAmount) : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Version</p>
            <p className="text-sm font-bold text-ink-900">
              {document?.versionNumber ?? deal.currentVersion}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Deal status</p>
            <p className="text-sm font-bold text-ink-900">
              {DEAL_STATUS_LABEL[deal.status] ?? deal.status}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3 sm:col-span-3">
            {deal.parties.map((party) => (
              <span
                key={party.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-1 text-[11px] text-ink-600"
              >
                <Avatar name={party.fullName} size="sm" className="h-5 w-5 text-[8px]" />
                {party.fullName}
                {party.id === witness.witnessedPartyId ? (
                  <UserCheck className="h-3 w-3 text-brand-600" aria-label="Witnessed party" />
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
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink-900">
                  Agreement version {document.versionNumber}
                </p>
                <p className="font-mono text-[10px] text-ink-500">
                  SHA-256 {shortHash(document.sha256, 24)}
                </p>
                <p className="text-[10px] text-ink-400">{formatDateTime(document.createdAt)}</p>
              </div>
            </div>
            {documentUrl ? (
              <a href={documentUrl} className={buttonStyles({ variant: "outline", size: "sm" })}>
                <Download className="h-3.5 w-3.5" aria-hidden />
                Open PDF
              </a>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {attested ? (
        <Card className="mt-4 border-brand-200 bg-brand-50">
          <CardBody className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
            <div>
              <h2 className="text-[15px] font-bold text-brand-900">Witness attestation recorded</h2>
              <p className="mt-1 text-[12px] leading-5 text-brand-800/80">
                You attested on{" "}
                {witness.attestedAt
                  ? formatDateTime(witness.attestedAt)
                  : formatDate(new Date())}
                . The attestation is locked to version{" "}
                {document?.versionNumber ?? deal.currentVersion} and this witness link cannot be used
                to change it.
              </p>
              <p className="mt-2 text-[11px] text-brand-800/70">
                You can close this page. The parties can now see your attestation in the deal record.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : deal.status === DEAL_STATUS.EXECUTED ? (
        <Alert tone="warning" className="mt-4" title="Execution already completed">
          The deal was executed without this witness attestation. This link is now read-only and
          cannot be used to attest. Contact the inviting party if a new record is needed.
        </Alert>
      ) : !witness.verifiedAt ? (
        <div className="mt-4">
          <WitnessVerify token={token} contact={contact} />
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
        <Alert tone="warning" className="mt-4" title="Waiting for the signature">
          Your contact is verified, but {witness.witnessedParty.fullName} has not signed version{" "}
          {document?.versionNumber ?? deal.currentVersion} yet. You can attest once they have signed
          the version you are witnessing.
        </Alert>
      )}

      <Card className="mt-4">
        <CardHeader
          title="Agreement summary"
          description="The PDF is the agreement; this is a plain-language preview."
        />
        <CardBody className="space-y-4">
          {agreement.sections.map((section, index) => (
            <div key={`${section.heading}-${index}`}>
              <h3 className="text-[13px] font-bold text-ink-900">
                {index + 1}. {section.heading}
              </h3>
              {section.body.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="mt-1 text-[12px] leading-6 text-ink-600">
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

      <Card className="mt-4">
        <CardHeader title="What gets recorded" />
        <CardBody className="space-y-2 text-[11px] leading-5 text-ink-500">
          <p className="flex gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Your verified contact, attestation time and the document hash are recorded.
          </p>
          <p className="flex gap-2">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Your IP address and device user agent are stored with the attestation event.
          </p>
          <p className="flex gap-2">
            <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Witnessing does not guarantee payment or legal enforceability. Some transactions need a
            notary or specific formalities.
          </p>
        </CardBody>
      </Card>
    </Shell>
  );
}
