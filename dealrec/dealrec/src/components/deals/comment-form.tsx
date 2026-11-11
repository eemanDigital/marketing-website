"use client";

import { useActionState, useEffect, useRef } from "react";
import { MessageSquarePlus } from "lucide-react";
import { addCommentAction } from "@/server/actions/deals";
import { Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function CommentForm({ dealId }: { dealId: string }) {
  const [state, action] = useActionState(addCommentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="dealId" value={dealId} />
      <ActionMessage state={state} />
      <Textarea
        name="message"
        placeholder="Add a comment, clarification or note for the record..."
        required
        maxLength={3000}
        aria-label="Comment"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="file"
          name="file"
          accept="application/pdf,image/png,image/jpeg"
          className="text-[12px] text-ink-500 file:mr-2 file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-ink-700"
        />
        <SubmitButton size="sm" pendingLabel="Posting...">
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          Post comment
        </SubmitButton>
      </div>
    </form>
  );
}
