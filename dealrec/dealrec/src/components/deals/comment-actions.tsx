"use client";

import { useActionState, useEffect, useState } from "react";
import { Ban, Pencil } from "lucide-react";
import { editCommentAction, retractCommentAction } from "@/server/actions/deals";
import { buttonStyles } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { PreservedForm } from "@/components/ui/preserved-form";

type CommentRecord = {
  id: string;
  message: string;
  revision: number;
};

export function CommentActions({
  dealId,
  comment,
  canManage,
}: {
  dealId: string;
  comment: CommentRecord;
  canManage: boolean;
}) {
  const [mode, setMode] = useState<"edit" | "retract" | null>(null);
  const [editState, editAction] = useActionState(editCommentAction, null);
  const [retractState, retractAction] = useActionState(retractCommentAction, null);

  useEffect(() => {
    if (editState?.success) setMode(null);
  }, [editState]);

  useEffect(() => {
    if (retractState?.success) setMode(null);
  }, [retractState]);

  if (!canManage) return null;

  return (
    <div className="mt-2.5 border-t border-ink-200/70 pt-2">
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
          onClick={() => setMode(mode === "retract" ? null : "retract")}
          className={buttonStyles({ variant: "ghost", size: "sm", className: "text-red-700 hover:bg-red-50" })}
        >
          <Ban className="h-3.5 w-3.5" aria-hidden />
          Retract
        </button>
      </div>

      <ActionMessage state={editState} />
      <ActionMessage state={retractState} />

      {mode === "edit" ? (
        <PreservedForm action={editAction} className="mt-2.5 space-y-3 rounded-xl border border-ink-200 bg-white p-3">
          <input type="hidden" name="dealId" value={dealId} />
          <input type="hidden" name="commentId" value={comment.id} />
          <input type="hidden" name="revision" value={comment.revision} />
          <Field label="Edit comment" htmlFor={`edit-comment-${comment.id}`} required>
            <Textarea
              id={`edit-comment-${comment.id}`}
              name="message"
              defaultValue={comment.message}
              required
              maxLength={3000}
              rows={4}
            />
          </Field>
          <Field
            label="Reason for editing"
            htmlFor={`edit-comment-reason-${comment.id}`}
            required
            hint="Required. The previous text remains in the audit log and both parties are notified."
          >
            <Textarea
              id={`edit-comment-reason-${comment.id}`}
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder="For example: correcting a figure or clarifying a sentence."
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <SubmitButton size="sm" pendingLabel="Saving...">
              Save edit
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

      {mode === "retract" ? (
        <PreservedForm action={retractAction} className="mt-2.5 space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-3">
          <input type="hidden" name="dealId" value={dealId} />
          <input type="hidden" name="commentId" value={comment.id} />
          <input type="hidden" name="revision" value={comment.revision} />
          <Field
            label="Reason for retracting"
            htmlFor={`retract-comment-reason-${comment.id}`}
            required
            hint="Required. The comment is marked retracted but is not erased from the audit record."
          >
            <Textarea
              id={`retract-comment-reason-${comment.id}`}
              name="reason"
              required
              minLength={5}
              maxLength={500}
              placeholder="For example: sent in error or replaced by a correction."
            />
          </Field>
          <Alert tone="error">
            Retracting does not erase the message. It stays in the evidence pack and audit log, and
            both parties are notified.
          </Alert>
          <div className="flex flex-wrap gap-2">
            <SubmitButton size="sm" variant="danger" pendingLabel="Retracting...">
              Retract comment
            </SubmitButton>
            <button
              type="button"
              onClick={() => setMode(null)}
              className={buttonStyles({ variant: "outline", size: "sm" })}
            >
              Keep comment
            </button>
          </div>
        </PreservedForm>
      ) : null}
    </div>
  );
}
