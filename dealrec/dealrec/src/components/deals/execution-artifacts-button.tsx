"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { regenerateEvidenceAction } from "@/server/actions/deals";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function ExecutionArtifactsButton({
  dealId,
  label = "Repair missing artifacts",
}: {
  dealId: string;
  label?: string;
}) {
  const [state, action] = useActionState(regenerateEvidenceAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <div className="space-y-2">
      <form action={action}>
        <input type="hidden" name="dealId" value={dealId} />
        <SubmitButton
          variant="ghost"
          size="sm"
          className="w-full"
          pendingLabel="Checking..."
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          {label}
        </SubmitButton>
      </form>
      <ActionMessage state={state} />
    </div>
  );
}
