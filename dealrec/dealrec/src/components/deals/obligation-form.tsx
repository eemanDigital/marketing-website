"use client";

import { useActionState, useEffect, useRef } from "react";
import { addObligationAction } from "@/server/actions/deals";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function ObligationForm({
  dealId,
  parties,
}: {
  dealId: string;
  parties: { id: string; fullName: string; role: string }[];
}) {
  const [state, action] = useActionState(addObligationAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="dealId" value={dealId} />
      <ActionMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Obligation" htmlFor="obligationTitle" required className="sm:col-span-2">
          <Input id="obligationTitle" name="title" placeholder="e.g. Pay balance on delivery" required maxLength={160} />
        </Field>
        <Field label="Amount (optional)" htmlFor="obligationAmount">
          <Input id="obligationAmount" name="amount" inputMode="decimal" placeholder="e.g. 120000" />
        </Field>
        <Field label="Due date (optional)" htmlFor="dueAt">
          <Input id="dueAt" name="dueAt" type="date" />
        </Field>
        <Field label="Responsible party (optional)" htmlFor="responsiblePartyId" className="sm:col-span-2">
          <Select id="responsiblePartyId" name="responsiblePartyId" defaultValue="">
            <option value="">Not assigned</option>
            {parties.map((party) => (
              <option key={party.id} value={party.id}>
                {party.fullName} ({party.role})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Details (optional)" htmlFor="obligationDescription" className="sm:col-span-2">
          <Textarea id="obligationDescription" name="description" maxLength={2000} />
        </Field>
      </div>
      <SubmitButton size="sm" variant="outline" pendingLabel="Adding...">
        Add obligation
      </SubmitButton>
    </form>
  );
}
