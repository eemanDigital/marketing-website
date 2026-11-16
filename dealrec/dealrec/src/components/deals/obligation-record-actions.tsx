"use client";

import { useActionState, useEffect, useState } from "react";
import { Ban, Pencil } from "lucide-react";
import {
  cancelObligationAction,
  editObligationAction,
  updateObligationAction,
} from "@/server/actions/deals";
import { OBLIGATION_STATUS } from "@/lib/constants";
import { buttonStyles } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { PreservedForm } from "@/components/ui/preserved-form";

type ObligationRecord = {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  dueAtInput: string;
  responsiblePartyId: string | null;
  status: string;
  revision: number;
};

type PartyOption = { id: string; fullName: string; role: string };

export function ObligationRecordActions({
  dealId,
  obligation,
  parties,
  canEdit,
  isClosed,
}: {
  dealId: string;
  obligation: ObligationRecord;
  parties: PartyOption[];
  canEdit: boolean;
  isClosed: boolean;
}) {
  const [mode, setMode] = useState<"edit" | "cancel" | null>(null);
  const [statusState, statusAction] = useActionState(updateObligationAction, null);
  const [editState, editAction] = useActionState(editObligationAction, null);
  const [cancelState, cancelAction] = useActionState(cancelObligationAction, null);
  const cancelled = obligation.status === OBLIGATION_STATUS.CANCELLED;

  useEffect(() => {
    if (editState?.success) setMode(null);
  }, [editState]);

  useEffect(() => {
    if (cancelState?.success) setMode(null);
  }, [cancelState]);

  if (isClosed) return null;

  return (
    <div className="mt-2.5 border-t border-ink-100 pt-2.5">
      {!cancelled ? (
        <div className="flex flex-wrap gap-1.5">
          {obligation.status !== OBLIGATION_STATUS.COMPLETED ? (
            <form action={statusAction}>
              <input type="hidden" name="dealId" value={dealId} />
              <input type="hidden" name="obligationId" value={obligation.id} />
              <input type="hidden" name="status" value={OBLIGATION_STATUS.COMPLETED} />
              <SubmitButton size="sm" variant="outline" pendingLabel="Saving...">
                Mark done
              </SubmitButton>
            </form>
          ) : null}
          {obligation.status !== OBLIGATION_STATUS.DISPUTED ? (
            <form action={statusAction}>
              <input type="hidden" name="dealId" value={dealId} />
              <input type="hidden" name="obligationId" value={obligation.id} />
              <input type="hidden" name="status" value={OBLIGATION_STATUS.DISPUTED} />
              <SubmitButton size="sm" variant="ghost" pendingLabel="Saving...">
                Dispute
              </SubmitButton>
            </form>
          ) : null}
          {canEdit ? (
            <>
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
                onClick={() => setMode(mode === "cancel" ? null : "cancel")}
                className={buttonStyles({ variant: "ghost", size: "sm", className: "text-red-700 hover:bg-red-50" })}
              >
                <Ban className="h-3.5 w-3.5" aria-hidden />
                Cancel
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <ActionMessage state={statusState} />
      <ActionMessage state={editState} />
      <ActionMessage state={cancelState} />

      {mode === "edit" ? (
        <PreservedForm action={editAction} className="mt-3 space-y-3 rounded-xl border border-ink-200 bg-white p-3">
          <input type="hidden" name="dealId" value={dealId} />
          <input type="hidden" name="obligationId" value={obligation.id} />
          <input type="hidden" name="revision" value={obligation.revision} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Obligation" htmlFor={`edit-obligation-title-${obligation.id}`} required className="sm:col-span-2">
              <Input
                id={`edit-obligation-title-${obligation.id}`}
                name="title"
                defaultValue={obligation.title}
                required
                maxLength={160}
              />
            </Field>
            <Field label="Amount (optional)" htmlFor={`edit-obligation-amount-${obligation.id}`}>
              <Input
                id={`edit-obligation-amount-${obligation.id}`}
                name="amount"
                inputMode="decimal"
                defaultValue={obligation.amount ?? ""}
              />
            </Field>
            <Field label="Due date (optional)" htmlFor={`edit-obligation-due-${obligation.id}`}>
              <Input
                id={`edit-obligation-due-${obligation.id}`}
                name="dueAt"
                type="date"
                defaultValue={obligation.dueAtInput}
              />
            </Field>
            <Field
              label="Responsible party (optional)"
              htmlFor={`edit-obligation-party-${obligation.id}`}
              className="sm:col-span-2"
            >
              <Select
                id={`edit-obligation-party-${obligation.id}`}
                name="responsiblePartyId"
                defaultValue={obligation.responsiblePartyId ?? ""}
              >
                <option value="">Not assigned</option>
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.fullName} ({party.role})
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Details (optional)"
              htmlFor={`edit-obligation-description-${obligation.id}`}
              className="sm:col-span-2"
            >
              <Textarea
                id={`edit-obligation-description-${obligation.id}`}
                name="description"
                defaultValue={obligation.description ?? ""}
                maxLength={2000}
              />
            </Field>
            <Field
              label="Reason for editing"
              htmlFor={`edit-obligation-reason-${obligation.id}`}
              required
              className="sm:col-span-2"
              hint="Required. Both parties see this reason and the previous values remain in the audit log."
            >
              <Textarea
                id={`edit-obligation-reason-${obligation.id}`}
                name="reason"
                required
                minLength={5}
                maxLength={500}
                placeholder="Explain what was wrong and why it is being corrected."
              />
            </Field>
          </div>
          <Alert tone="warning">
            The previous values, editor and reason are written to the hash-chained audit log, and
            both parties are notified.
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

      {mode === "cancel" ? (
        <PreservedForm action={cancelAction} className="mt-3 space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-3">
          <input type="hidden" name="dealId" value={dealId} />
          <input type="hidden" name="obligationId" value={obligation.id} />
          <input type="hidden" name="revision" value={obligation.revision} />
          <Field
            label="Reason for cancelling"
            htmlFor={`cancel-obligation-reason-${obligation.id}`}
            required
            hint="Required. The obligation and reason remain in the audit log and evidence record."
          >
            <Textarea
              id={`cancel-obligation-reason-${obligation.id}`}
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder="For example: no longer required by agreement."
            />
          </Field>
          <Alert tone="error">
            Cancelling does not delete the obligation. It stays visible as cancelled, and both
            parties are notified.
          </Alert>
          <div className="flex flex-wrap gap-2">
            <SubmitButton size="sm" variant="danger" pendingLabel="Cancelling...">
              Cancel obligation
            </SubmitButton>
            <button
              type="button"
              onClick={() => setMode(null)}
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              Keep obligation
            </button>
          </div>
        </PreservedForm>
      ) : null}
    </div>
  );
}
