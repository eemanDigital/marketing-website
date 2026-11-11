import Link from "next/link";
import { FileSearch, Fingerprint, QrCode, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { VerifyLookup } from "@/components/verify/verify-lookup";

export const metadata = { title: "Verify a document" };

export default function VerifyPage() {
  return (
    <div className="min-h-dvh bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/" className="text-[12px] font-semibold text-ink-500 hover:text-ink-800">
            Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="success" className="mb-3">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Public verification
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Check a deal record
          </h1>
          <p className="mt-3 text-[14px] leading-7 text-ink-600">
            Enter the deal reference or the verification code from a certificate. You can also upload
            an executed PDF to compare its fingerprint with the file recorded by dealrec.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader title="Look up a record" description="No account needed." />
            <CardBody>
              <VerifyLookup />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="What this check can tell you" />
            <CardBody className="space-y-3 text-[12px] leading-5 text-ink-600">
              <p className="flex gap-2.5">
                <Fingerprint className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                Whether a file is identical to the executed copy recorded by the platform.
              </p>
              <p className="flex gap-2.5">
                <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                The deal reference, version, status and seal serial for a valid record.
              </p>
              <p className="flex gap-2.5">
                <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                Whether a seal has been revoked or a record is no longer active.
              </p>
              <p className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                It cannot prove that money was paid, that a person is who they claim, or that a court
                will admit or enforce the document.
              </p>
            </CardBody>
          </Card>
        </div>

        <Alert tone="warning" className="mt-4" title="What verification is not">
          A match shows the file is identical to the file recorded by the platform. It does not prove
          legal validity, identity, payment or enforceability. The platform seal is not an NBA stamp or
          seal, notarial seal, government certification or Section 84 Evidence Act certificate.
        </Alert>
      </main>
    </div>
  );
}
