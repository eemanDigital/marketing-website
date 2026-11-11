"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, FileUp } from "lucide-react";
import { createUploadedDealAction } from "@/server/actions/deals";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export function UploadDealForm() {
  const [state, action] = useActionState(createUploadedDealAction, null);

  return (
    <form action={action} className="space-y-4">
      <Link href="/deals/new" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to templates
      </Link>

      <ActionMessage state={state} />

      <Card>
        <CardHeader title="Deal basics" description="These details appear on the deal record and certificate." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Deal title" htmlFor="title" required className="sm:col-span-2">
            <Input id="title" name="title" placeholder="e.g. Equipment supply agreement" required minLength={3} maxLength={160} />
          </Field>
          <Field label="Your role" htmlFor="creatorRole">
            <Input id="creatorRole" name="creatorRole" defaultValue="Party A" maxLength={80} />
          </Field>
          <Field label="Their role" htmlFor="counterpartyRole">
            <Input id="counterpartyRole" name="counterpartyRole" defaultValue="Party B" maxLength={80} />
          </Field>
          <Field label="Total amount (NGN, optional)" htmlFor="totalAmount" hint="Used to track payments. Leave blank if not a money deal.">
            <Input id="totalAmount" name="totalAmount" inputMode="decimal" placeholder="e.g. 250000" />
          </Field>
          <div />
          <Field label="Other party's full name" htmlFor="counterpartyName" required>
            <Input id="counterpartyName" name="counterpartyName" placeholder="Their full name" required minLength={2} maxLength={120} />
          </Field>
          <Field label="Other party's email" htmlFor="counterpartyEmail" required hint="The signing link and codes go here.">
            <Input id="counterpartyEmail" name="counterpartyEmail" type="email" inputMode="email" placeholder="them@example.com" required />
          </Field>
          <Field label="Other party's phone (optional)" htmlFor="counterpartyPhone" className="sm:col-span-2">
            <Input id="counterpartyPhone" name="counterpartyPhone" inputMode="tel" placeholder="08012345678" />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Upload the agreement" description="PDF only, up to 10 MB. Other formats are rejected." />
        <CardBody>
          <label
            htmlFor="file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 px-6 py-10 text-center hover:border-brand-400 hover:bg-brand-50/50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
              <FileUp className="h-5 w-5" aria-hidden />
            </span>
            <span className="mt-3 text-[14px] font-semibold text-ink-800">Choose a PDF agreement</span>
            <span className="mt-1 text-[12px] text-ink-500">The file is stored privately and hashed.</span>
            <input id="file" name="file" type="file" accept="application/pdf,.pdf" required className="sr-only" />
          </label>
        </CardBody>
      </Card>

      <Alert tone="info" title="What happens next">
        The uploaded PDF becomes version 1. You can review and share it. If the terms need to change,
        you can upload a revised version, and the other party must review the new hash before signing.
      </Alert>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/deals/new"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-800"
        >
          Cancel
        </Link>
        <SubmitButton pendingLabel="Uploading...">Create and continue</SubmitButton>
      </div>
    </form>
  );
}
