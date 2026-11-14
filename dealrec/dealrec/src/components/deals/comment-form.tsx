"use client";

import { useActionState, useEffect, useRef } from "react";
import { MessageSquarePlus, Paperclip } from "lucide-react";
import { addCommentAction } from "@/server/actions/deals";
import { cn } from "@/lib/utils";
import { Field, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function CommentForm({
  dealId,
  authorName,
  authorLabel,
  authorBadgeClassName,
}: {
  dealId: string;
  authorName?: string;
  authorLabel?: string;
  authorBadgeClassName?: string;
}) {
  const [state, action] = useActionState(addCommentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="dealId" value={dealId} />
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] text-ink-500">
          Commenting as <span className="font-semibold text-ink-800">{authorName ?? "deal party"}</span>
        </p>
        {authorLabel ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold",
              authorBadgeClassName,
            )}
          >
            {authorLabel}
          </span>
        ) : null}
      </div>
      <ActionMessage state={state} />
      <Field
        label="Add a comment"
        htmlFor="comment-message"
        required
        hint="Be specific and factual. This message is visible to both parties and becomes part of the deal record."
      >
        <Textarea
          id="comment-message"
          name="message"
          placeholder="Write a clarification, question, or note for both parties..."
          required
          maxLength={3000}
          rows={4}
          aria-label="Comment"
        />
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <label
            htmlFor="comment-file"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-700"
          >
            <Paperclip className="h-3.5 w-3.5 text-ink-400" aria-hidden />
            Attach evidence
          </label>
          <input
            id="comment-file"
            type="file"
            name="file"
            accept="application/pdf,image/png,image/jpeg"
            className="block w-full max-w-sm text-[11px] text-ink-500 file:mr-2 file:rounded-lg file:border-0 file:bg-ink-100 file:px-2.5 file:py-1.5 file:text-[11px] file:font-semibold file:text-ink-700 hover:file:bg-ink-200"
          />
          <p className="text-[10px] text-ink-400">PDF, PNG or JPEG · maximum 4MB</p>
        </div>
        <SubmitButton
          size="sm"
          pendingLabel="Posting..."
          className="w-full shrink-0 sm:w-auto"
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          Post comment
        </SubmitButton>
      </div>
    </form>
  );
}
