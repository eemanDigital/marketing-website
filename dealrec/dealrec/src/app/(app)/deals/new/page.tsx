import Link from "next/link";
import { ArrowRight, FileUp, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { TEMPLATES } from "@/lib/templates";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export const metadata = { title: "Create a Deal" };

export default async function NewDealPage() {
  const user = await requireUser();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Create a Deal</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-6 text-ink-500">
          Choose a guided template and answer a few plain questions, or upload a PDF agreement you
          already have. Every deal gets a reference, version history and a secure invitation link.
        </p>
      </div>

      {!user.emailVerifiedAt ? (
        <Alert tone="warning" title="Verify your email first">
          You need a verified email to create a deal.{" "}
          <Link href="/verify-account" className="font-semibold underline">
            Verify now
          </Link>
          .
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/deals/new/upload"
          className="group flex flex-col justify-between rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50"
        >
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <FileUp className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 text-[15px] font-bold text-ink-900">Upload your own PDF</h2>
            <p className="mt-1 text-[12px] leading-5 text-ink-600">
              Use an agreement you already prepared. We store a hash, collect signatures and issue a
              verification certificate.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-brand-700">
            Upload a PDF <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Link>

        {TEMPLATES.map((template) => (
          <Link
            key={template.slug}
            href={`/deals/new/${template.slug}`}
            className="group rounded-2xl border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[15px] font-bold text-ink-900 group-hover:text-brand-800">
                {template.name}
              </h2>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-300 group-hover:text-brand-600" aria-hidden />
            </div>
            <p className="mt-1 text-[12px] leading-5 text-ink-500">{template.shortDescription}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{template.creatorRole}</Badge>
              <Badge tone="neutral">{template.counterpartyRole}</Badge>
            </div>
          </Link>
        ))}
      </div>

      <Card className="border-ink-200 bg-ink-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden />
          <p className="text-[12px] leading-5 text-ink-600">
            Templates are plain-language starting points, not legal advice. Some transactions need
            witnesses, stamping, registration or professional review. The platform seal verifies the
            record; it is not an NBA, notarial or government seal.
          </p>
        </div>
      </Card>
    </div>
  );
}
