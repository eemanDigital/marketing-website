import Link from "next/link";
import { ArrowRight, FileText, FileUp, Info, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { TEMPLATES } from "@/lib/templates";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export const metadata = { title: "Create agreement" };

export default async function NewDealPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-violet-700">
            New agreement
          </p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[34px]">
            Put a deal on record
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-muted">
            Choose a guided template and answer a few plain questions, or upload a PDF you already
            have. Every agreement gets a reference, version history, and a secure signing link.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-pill bg-sky-50 px-3 py-2 text-[12px] font-medium text-sky-700">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          <span>Clear terms · verifiable record</span>
        </div>
      </div>

      {!user.emailVerifiedAt ? (
        <Alert tone="warning" title="Verify your email first">
          You need a verified email to create an agreement.{" "}
          <Link href="/verify-account" className="font-semibold underline">
            Verify now
          </Link>
          .
        </Alert>
      ) : null}

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[16px] font-bold text-ink">Start from a template or upload</h2>
          <span className="text-[12px] text-ink-subtle">Step 1 of 3 · Choose type</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/deals/new/upload"
            className="group flex flex-col justify-between rounded-card bg-violet-50 p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-violet-600 text-white shadow-[var(--shadow-soft)]">
                <FileUp className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-ink">Upload your own PDF</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">
                Use an agreement you already prepared. We store a hash, collect signatures, and
                issue a verification certificate.
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-violet-700">
              Upload a PDF <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </span>
          </Link>

          {TEMPLATES.map((template) => (
            <Link
              key={template.slug}
              href={`/deals/new/${template.slug}`}
              className="group flex flex-col rounded-card bg-surface-raised p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-surface-muted text-ink">
                  <FileText className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-ink-subtle transition-colors group-hover:text-violet-700"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </div>
              <h3 className="mt-4 text-[16px] font-bold text-ink">{template.name}</h3>
              <p className="mt-1.5 flex-1 text-[13px] leading-6 text-ink-muted">
                {template.shortDescription}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone="neutral">{template.creatorRole}</Badge>
                <Badge tone="neutral">{template.counterpartyRole}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Card className="bg-surface-muted/60">
        <CardBody className="flex gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.5} aria-hidden />
          <p className="text-[13px] leading-6 text-ink-muted">
            Templates are plain-language starting points, not legal advice. Some transactions need
            witnesses, stamping, registration, or professional review. The platform seal verifies the
            record; it is not an NBA, notarial, or government seal.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
