"use client";

import { useActionState } from "react";
import { ArrowLeft, FileText, ListChecks, Lock, Users } from "lucide-react";
import Link from "next/link";
import { createTemplateDealAction } from "@/server/actions/deals";
import type { TemplateDefinition } from "@/lib/templates";
import { TemplateFieldInput } from "./template-fields";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PreservedForm } from "@/components/ui/preserved-form";

export function TemplateDealForm({ template }: { template: TemplateDefinition }) {
  const [state, action, pending] = useActionState(createTemplateDealAction, null);
  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <PreservedForm action={action} className="space-y-4">
      <input type="hidden" name="templateSlug" value={template.slug} />

      <Link
        href="/deals/new"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        Change template
      </Link>

      <ActionMessage state={state?.fieldErrors ? null : state} />
      {Object.keys(fieldErrors).length > 0 ? (
        <Alert tone="error" title="Please check the highlighted fields">
          Your answers are still here. Correct the fields marked below and submit again.
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-ink-muted">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-violet-100 px-3 py-1 text-violet-700">
          <Users className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> 1. Basics
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-raised px-3 py-1 shadow-[var(--shadow-soft)]">
          <FileText className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> 2. Terms
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-raised px-3 py-1 shadow-[var(--shadow-soft)]">
          <ListChecks className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> 3. Review &amp; create
        </span>
      </div>

      <Card>
        <CardHeader
          title="Deal basics"
          description="Start with the title and the other party. They will see this before reviewing the full agreement."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Deal title"
            htmlFor="title"
            required
            error={fieldErrors.title}
            hint="A short name both parties will recognise."
            className="sm:col-span-2"
          >
            <Input
              id="title"
              name="title"
              placeholder={`e.g. ${template.name} - ${template.counterpartyRole}`}
              required
              minLength={3}
              maxLength={160}
            />
          </Field>
          <Field
            label={`${template.counterpartyRole} full name`}
            htmlFor="counterpartyName"
            required
            error={fieldErrors.counterpartyName}
          >
            <Input
              id="counterpartyName"
              name="counterpartyName"
              placeholder="Their full name"
              required
              minLength={2}
              maxLength={120}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-1">
            <Field
              label="Their email"
              htmlFor="counterpartyEmail"
              hint="Needed to send the review and signing link."
              error={fieldErrors.counterpartyEmail}
              required
            >
              <Input
                id="counterpartyEmail"
                name="counterpartyEmail"
                type="email"
                inputMode="email"
                placeholder="them@example.com"
              />
            </Field>
            <Field
              label="Their phone (optional)"
              htmlFor="counterpartyPhone"
              hint="Useful if they prefer SMS."
              error={fieldErrors.counterpartyPhone}
            >
              <Input
                id="counterpartyPhone"
                name="counterpartyPhone"
                inputMode="tel"
                placeholder="08012345678"
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Agreement details"
          description="These answers create the clauses. Keep them specific and accurate (amounts in ₦, dates clear)."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          {template.fields.map((field) => (
            <TemplateFieldInput key={field.key} field={field} error={fieldErrors[field.key]} />
          ))}
        </CardBody>
      </Card>

      {template.formalitiesNote ? (
        <Alert tone="warning" title="Before you rely on this record">
          {template.formalitiesNote}
        </Alert>
      ) : null}

      <Card className="bg-surface-muted/60">
        <CardBody className="flex gap-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.5} aria-hidden />
          <p className="text-[13px] leading-6 text-ink-muted">
            After you create this agreement you can review the generated terms and share a secure
            link. The other party must verify their email or phone and sign the exact version they
            reviewed. A new version is required if the terms change after signing begins.
          </p>
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/deals/new"
          className="inline-flex h-11 items-center justify-center rounded-pill bg-surface-raised px-5 text-[13px] font-semibold text-ink shadow-[var(--shadow-soft)] hover:bg-surface"
        >
          Cancel
        </Link>
        <SubmitButton pending={pending} pendingLabel="Creating agreement...">
          Create and continue
        </SubmitButton>
      </div>
    </PreservedForm>
  );
}
