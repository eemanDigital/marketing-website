"use client";

import { useActionState, useState } from "react";
import { PencilLine } from "lucide-react";
import { createNewVersionAction } from "@/server/actions/deals";
import type { TemplateDefinition } from "@/lib/templates";
import { TemplateFieldInput } from "./template-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";

export function VersionForm({
  dealId,
  template,
  values,
}: {
  dealId: string;
  template: TemplateDefinition;
  values: Record<string, string>;
}) {
  const [state, action] = useActionState(createNewVersionAction, null);
  const [open, setOpen] = useState(false);
  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-[12px] font-semibold text-ink-700 hover:border-ink-300"
      >
        <PencilLine className="h-3.5 w-3.5" aria-hidden />
        {open ? "Close editor" : "Prepare a revised version"}
      </button>

      {open ? (
        <form action={action} className="mt-3 space-y-4 rounded-2xl border border-ink-200 bg-white p-4">
          <input type="hidden" name="dealId" value={dealId} />
          <Alert tone="warning" title="This creates a new version">
            Existing signatures apply only to the current version. The other party must verify, review
            and sign the new version. Active invitation links are replaced.
          </Alert>
          <ActionMessage state={state?.fieldErrors ? null : state} />
          {Object.keys(fieldErrors).length > 0 ? (
            <Alert tone="error">Please check the highlighted fields.</Alert>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {template.fields.map((field) => (
              <TemplateFieldInput
                key={field.key}
                field={field}
                error={fieldErrors[field.key]}
                defaultValue={values[field.key] ?? ""}
              />
            ))}
          </div>
          <SubmitButton size="sm" pendingLabel="Creating version...">
            Create revised version
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
