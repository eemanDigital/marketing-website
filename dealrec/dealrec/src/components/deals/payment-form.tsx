"use client";

import { useActionState, useEffect, useRef } from "react";
import { recordPaymentAction } from "@/server/actions/deals";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { PreservedForm } from "@/components/ui/preserved-form";

export function PaymentForm({ dealId }: { dealId: string }) {
  const [state, action] = useActionState(recordPaymentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <PreservedForm ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="dealId" value={dealId} />
      <ActionMessage state={state} />
      <div className="grid gap-3">
        <Field label="Amount (NGN)" htmlFor="amount" required>
          <Input id="amount" name="amount" inputMode="decimal" placeholder="e.g. 50000" required />
        </Field>
        <Field label="Payment date" htmlFor="paymentDate">
          <Input id="paymentDate" name="paymentDate" type="date" />
        </Field>
        <Field label="Method" htmlFor="paymentMethod" required>
          <Select id="paymentMethod" name="paymentMethod" defaultValue="Bank transfer" required>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reference (optional)" htmlFor="reference">
          <Input id="reference" name="reference" placeholder="Bank reference or receipt number" maxLength={120} />
        </Field>
        <Field label="Notes (optional)" htmlFor="notes">
          <Textarea id="notes" name="notes" placeholder="Any detail the other party should know" maxLength={2000} />
        </Field>
        <Field label="Receipt or proof (optional)" htmlFor="receipt">
          <input
            id="receipt"
            name="receipt"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="w-full rounded-xl border border-ink-200 bg-surface-raised px-3 py-2 text-[12px] text-ink-muted file:mr-2 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
          />
        </Field>
      </div>
      <Alert tone="info">
        Payments recorded here are party-reported. Uploading a receipt helps, but the platform does not
        connect to your bank and does not independently confirm that money moved. The other party can
        confirm or dispute this payment after you record it.
      </Alert>
      <SubmitButton size="sm" pendingLabel="Recording...">
        Record payment
      </SubmitButton>
    </PreservedForm>
  );
}
