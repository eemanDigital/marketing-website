"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquareWarning, ThumbsDown } from "lucide-react";
import { respondInvitationAction } from "@/server/actions/invite";
import { Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Mode = "accept" | "change" | "decline";

const choices: { key: Mode; label: string; icon: typeof CheckCircle2; classes: string }[] = [
  { key: "accept", label: "Accept and continue", icon: CheckCircle2, classes: "border-brand-300 bg-brand-50 text-brand-900" },
  { key: "change", label: "Request a change", icon: MessageSquareWarning, classes: "border-sand-200 bg-sand-100 text-sand-700" },
  { key: "decline", label: "Decline this deal", icon: ThumbsDown, classes: "border-red-200 bg-red-50 text-red-800" },
];

export function InviteRespond({ token }: { token: string }) {
  const [mode, setMode] = useState<Mode>("accept");
  const [state, action] = useActionState(respondInvitationAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  const choice = choices.find((item) => item.key === mode)!;

  return (
    <div className="space-y-3">
      <ActionMessage state={state} />
      {mode === "change" ? (
        <Alert tone="warning" title="Requesting a change">
          The creator will see your message and can prepare a revised version. You cannot sign until
          the revised version is ready.
        </Alert>
      ) : null}
      {mode === "decline" ? (
        <Alert tone="error" title="Declining closes the deal">
          Declining marks the deal cancelled for both parties. The event and reason are recorded.
        </Alert>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        {choices.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] font-semibold",
                mode === item.key ? item.classes : "border-ink-200 bg-white text-ink-600",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="decision" value={mode} />
        {mode !== "accept" ? (
          <Textarea
            name="message"
            placeholder={mode === "change" ? "What needs to change?" : "Reason for declining (optional)"}
            required={mode === "change"}
            maxLength={2000}
          />
        ) : null}
        <SubmitButton
          className="w-full"
          variant={mode === "decline" ? "danger" : mode === "change" ? "sand" : "primary"}
          pendingLabel="Sending..."
        >
          {mode === "accept" ? "Accept invitation" : mode === "change" ? "Send change request" : "Decline deal"}
        </SubmitButton>
        <p className="text-[11px] leading-5 text-ink-500">
          {choice.label}. This response is recorded as a deal event with your verified contact.
        </p>
      </form>
    </div>
  );
}
