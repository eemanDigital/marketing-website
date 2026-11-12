import Link from "next/link";
import { CheckCircle2, FileText, ShieldAlert, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";
import { WITNESS_STATUS, WITNESS_STATUS_LABEL } from "@/lib/constants";
import { Logo } from "@/components/ui/logo";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { VerifyFileForm } from "@/components/verify/verify-file-form";

export const metadata = { title: "Verification result" };

export default async function VerifyResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const seal = await db.dealSeal.findFirst({
    where: {
      OR: [{ verificationToken: token }, { deal: { reference: token } }],
    },
    orderBy: { issuedAt: "desc" },
    include: {
      document: true,
      deal: {
        include: {
          parties: true,
          signatures: true,
          documents: true,
          witnesses: true,
        },
      },
    },
  });

  return (
    <div className="min-h-dvh bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/verify" className="text-[12px] font-semibold text-ink-500 hover:text-ink-800">
            New search
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {!seal ? (
          <Card className="text-center">
            <CardBody className="py-10">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <ShieldAlert className="h-6 w-6" aria-hidden />
              </span>
              <h1 className="mt-3 text-xl font-extrabold text-ink-900">No verification record found</h1>
              <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-ink-600">
                Check that the reference or verification code is complete and correct. A record may
                also be unavailable if the deal was never executed or the seal was removed.
              </p>
              <Link href="/verify" className="mt-4 inline-flex text-[13px] font-semibold text-brand-700">
                Try another search
              </Link>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className={seal.status === "ACTIVE" ? "border-brand-300" : "border-red-300"}>
              <div className={seal.status === "ACTIVE" ? "bg-brand-600 px-5 py-5 text-white" : "bg-red-600 px-5 py-5 text-white"}>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-90">
                  {seal.status === "ACTIVE" ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <ShieldAlert className="h-4 w-4" aria-hidden />
                  )}
                  {seal.status === "ACTIVE" ? "Record verified" : `Seal ${seal.status.toLowerCase()}`}
                </div>
                <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">{seal.deal.title}</h1>
                <p className="mt-1 font-mono text-[11px] opacity-80">{seal.deal.reference}</p>
              </div>
              <CardBody className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Seal serial</p>
                  <p className="font-mono text-[13px] font-bold text-ink-900">{seal.serialNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Issued</p>
                  <p className="text-[13px] font-semibold text-ink-800">{formatDateTime(seal.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Executed version</p>
                  <p className="text-[13px] font-semibold text-ink-800">{seal.document.versionNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Executed at</p>
                  <p className="text-[13px] font-semibold text-ink-800">
                    {seal.deal.executedAt ? formatDateTime(seal.deal.executedAt) : "—"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Executed document SHA-256</p>
                  <p className="break-all font-mono text-[10px] text-ink-600">{seal.document.sha256}</p>
                </div>
                {seal.revokedAt ? (
                  <div className="sm:col-span-2">
                    <Alert tone="error" title={`Revoked ${formatDate(seal.revokedAt)}`}>
                      {seal.revocationReason ?? "No reason was provided."}
                    </Alert>
                  </div>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Parties and signatories" description="Names as recorded on the executed deal." />
              <CardBody className="grid gap-2 sm:grid-cols-2">
                {seal.deal.parties.map((party) => {
                  const signed = seal.deal.signatures.some(
                    (signature) => signature.partyId === party.id && signature.documentId === seal.documentId,
                  );
                  return (
                    <div key={party.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                      <Avatar name={party.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-ink-900">{party.fullName}</p>
                        <p className="text-[10px] text-ink-500">{party.role}</p>
                      </div>
                      {signed ? <CheckCircle2 className="ml-auto h-4 w-4 text-brand-600" aria-hidden /> : null}
                    </div>
                  );
                })}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Witness attestations"
                description="Witnesses recorded for the executed document version."
              />
              <CardBody className="space-y-2">
                {seal.deal.witnesses.filter(
                  (witness) =>
                    seal.deal.documents.find((document) => document.id === witness.documentId)
                      ?.versionNumber === seal.document.versionNumber,
                ).length === 0 ? (
                  <p className="text-[12px] text-ink-500">No witnesses recorded for this version.</p>
                ) : (
                  seal.deal.witnesses
                    .filter(
                      (witness) =>
                        seal.deal.documents.find((document) => document.id === witness.documentId)
                          ?.versionNumber === seal.document.versionNumber,
                    )
                    .map((witness) => {
                      const witnessedParty = seal.deal.parties.find(
                        (party) => party.id === witness.witnessedPartyId,
                      );
                      const attested = witness.status === WITNESS_STATUS.ATTESTED;
                      return (
                        <div
                          key={witness.id}
                          className="flex items-center gap-3 rounded-xl border border-ink-100 p-3"
                        >
                          <Avatar name={witness.fullName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-ink-900">
                              {witness.fullName}
                            </p>
                            <p className="text-[10px] text-ink-500">
                              Witness for {witnessedParty?.fullName ?? "party"}
                              {witness.attestedAt ? ` · ${formatDateTime(witness.attestedAt)}` : ""}
                            </p>
                          </div>
                          <span
                            className={
                              attested
                                ? "ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700"
                                : "ml-auto text-[10px] font-semibold text-ink-500"
                            }
                          >
                            {attested ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
                            {WITNESS_STATUS_LABEL[witness.status] ?? witness.status}
                          </span>
                        </div>
                      );
                    })
                )}
              </CardBody>
            </Card>

            <VerifyFileForm identifier={token} />

            <Card>
              <CardHeader title="What this result means" />
              <CardBody className="space-y-2 text-[11px] leading-5 text-ink-500">
                <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />The seal confirms that dealrec recorded this executed document, version and party set.</p>
                <p className="flex gap-2"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Use the file comparison above to check whether a copy you hold is byte-for-byte identical.</p>
                <p className="flex gap-2"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />A valid seal is not legal advice or a government certification, and does not guarantee payment, recovery, enforceability or admissibility. Contact a qualified Nigerian legal practitioner for legal questions.</p>
              </CardBody>
            </Card>

            <p className="text-center text-[10px] text-ink-400">
              Checked {formatDateTime(new Date())} · dealrec public verification
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
