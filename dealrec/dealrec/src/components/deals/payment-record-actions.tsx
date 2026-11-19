"use client";

import { useActionState, useState } from "react";
import { Ban, Pencil } from "lucide-react";
import { editPaymentAction, voidPaymentAction } from "@/server/actions/deals";
import { PAYMENT_METHODS } from "@/lib/constants";
import { buttonStyles } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { PreservedForm } from "@/components/ui/preserved-form";

type PaymentRecord = {
  id: string;
  amount: number;
  paymentDateInput: string;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  revision: number;
};

export function PaymentRecordActions({
  dealId,
  payment,
  canManage,
}: {
  dealId: string;
  payment: PaymentRecord;
  canManage: boolean;
}) {
  const [mode, setMode] = useState<"edit" | "void" | null>(null);
  const [editState, editAction] = useActionState(editPaymentAction, null);
  const [voidState, voidAction] = useActionState(voidPaymentAction, null);

  const [lastEditState, setLastEditState] = useState(editState);
  if (editState !== lastEditState) {
    setLastEditState(editState);
    if (editState?.success) setMode(null);
  }
  const [lastVoidState, setLastVoidState] = useState(voidState);
  if (voidState !== lastVoidState) {
    setLastVoidState(voidState);
    if (voidState?.success) setMode(null);
  }

  if (!canManage) return null;

  return (
    <div className="mt-2.5 border-t border-ink-100 pt-2.5">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setMode(mode === "edit" ? null : "edit")}
          className={buttonStyles({ variant: "ghost", size: "sm" })}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "void" ? null : "void")}
          className={buttonStyles({ variant: "ghost", size: "sm", className: "text-danger-700 hover:bg-danger-50" })}
        >
          <Ban className="h-3.5 w-3.5" aria-hidden />
          Void
        </button>
      </div>

      <ActionMessage state={editState} />
      <ActionMessage state={voidState} />

      {mode === "edit" ? (
        <PreservedForm action={editAction} className="mt-3 space-y-3 rounded-xl border border-ink-200 bg-surface-raised p-3">
          <input type="hidden" name="dealId" value={dealId} />
          <input type="hidden" name="paymentId" value={payment.id} />
          <input type="hidden" name="revision" value={payment.revision} />
          <div className="grid gap-3">
            <Field label="Amount (NGN)" htmlFor={`edit-amount-${payment.id}`} required>
              <Input
                id={`edit-amount-${payment.id}`}
                name="amount"
                inputMode="decimal"
                defaultValue={payment.amount}
                required
              />
            </Field>
            <Field label="Payment date" htmlFor={`edit-date-${payment.id}`} required>
              <Input
                id={`edit-date-${payment.id}`}
                name="paymentDate"
                type="date"
                defaultValue={payment.paymentDateInput}
                required
              />
            </Field>
            <Field label="Method" htmlFor={`edit-method-${payment.id}`} required>
              <Select
                id={`edit-method-${payment.id}`}
                name="paymentMethod"
                defaultValue={payment.paymentMethod}
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reference (optional)" htmlFor={`edit-reference-${payment.id}`}>
              <Input
                id={`edit-reference-${payment.id}`}
                name="reference"
                defaultValue={payment.reference ?? ""}
                maxLength={120}
              />
            </Field>
            <Field label="Notes (optional)" htmlFor={`edit-notes-${payment.id}`}>
              <Textarea
                id={`edit-notes-${payment.id}`}
                name="notes"
                defaultValue={payment.notes ?? ""}
                maxLength={2000}
              />
            </Field>
            <Field
              label="Replacement receipt (optional)"
              htmlFor={`edit-receipt-${payment.id}`}
              hint="Leave blank to keep the current receipt."
            >
              <input
                id={`edit-receipt-${payment.id}`}
                name="receipt"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                className="w-full rounded-xl border border-ink-200 bg-surface-raised px-3 py-2 text-[12px] text-ink-muted file:mr-2 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
              />
            </Field>
            <Field
              label="Reason for editing"
              htmlFor={`edit-reason-${payment.id}`}
              required
              hint="Required. Both parties see this reason and the previous values remain in the audit log."
            >
              <Textarea
                id={`edit-reason-${payment.id}`}
                name="reason"
                required
                minLength={5}
                maxLength={500}
                placeholder="Explain what was wrong and why it is being corrected."
              />
            </Field>
          </div>
          <Alert tone="warning">
            Editing resets this payment to unverified. The previous values, editor and reason are
            written to the hash-chained audit log, and both parties are notified.
          </Alert>
          <div className="flex flex-wrap gap-2">
            <SubmitButton size="sm" pendingLabel="Saving...">
              Save changes
            </SubmitButton>
            <button
              type="button"
              onClick={() => setMode(null)}
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              Cancel
            </button>
          </div>
        </PreservedForm>
      ) : null}

      {mode === "void" ? (
        <PreservedForm action={voidAction} className="mt-3 space-y-3 rounded-xl border border-danger-200 bg-danger-50/60 p-3">
          <input type="hidden" name="dealId" value={dealId} />
          <input type="hidden" name="paymentId" value={payment.id} />
          <input type="hidden" name="revision" value={payment.revision} />
          <Field
            label="Reason for voiding"
            htmlFor={`void-reason-${payment.id}`}
            required
            hint="Required. The payment, receipt and reason stay in the evidence record."
          >
            <Textarea
              id={`void-reason-${payment.id}`}
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder="For example: recorded against the wrong deal or duplicate entry."
            />
          </Field>
          <Alert tone="error">
            Voiding removes this amount from the active payment total, but it does not delete the
            record or its receipt. Both parties are notified.
          </Alert>
          <div className="flex flex-wrap gap-2">
            <SubmitButton size="sm" variant="danger" pendingLabel="Voiding...">
              Void payment
            </SubmitButton>
            <button
              type="button"
              onClick={() => setMode(null)}
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              Cancel
            </button>
          </div>
        </PreservedForm>
      ) : null}
    </div>
  );
}
