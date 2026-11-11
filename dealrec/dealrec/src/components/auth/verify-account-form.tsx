"use client";

import { useActionState, useState, useTransition } from "react";
import { resendSignupCodeAction, verifySignupCodeAction } from "@/server/actions/auth";
import type { ActionState } from "@/server/action-state";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function VerifyAccountForm() {
  const [state, action] = useActionState(verifySignupCodeAction, null);
  const [resendState, setResendState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();

  function resend() {
    startTransition(async () => {
      setResendState(await resendSignupCodeAction());
    });
  }

  return (
    <div className="space-y-4">
      <ActionMessage state={resendState} />
      <form action={action} className="space-y-4">
        <ActionMessage state={state} />
        <Field label="Verification code" htmlFor="code" required hint="Enter the 6-digit code sent to your email.">
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            className="text-center text-lg font-bold tracking-[0.4em]"
            required
          />
        </Field>
        <SubmitButton className="w-full" pendingLabel="Verifying...">
          Verify email
        </SubmitButton>
      </form>
      <Button type="button" variant="outline" className="w-full" onClick={resend} disabled={pending}>
        {pending ? "Sending..." : "Resend code"}
      </Button>
    </div>
  );
}
