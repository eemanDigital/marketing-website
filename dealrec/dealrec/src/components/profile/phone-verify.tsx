"use client";

import { useActionState, useState, useTransition } from "react";
import { sendPhoneCodeAction, verifyPhoneCodeAction } from "@/server/actions/auth";
import type { ActionState } from "@/server/action-state";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function PhoneVerify({ hasPhone }: { hasPhone: boolean }) {
  const [state, action] = useActionState(verifyPhoneCodeAction, null);
  const [sendState, setSendState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();

  if (!hasPhone) {
    return <p className="text-[12px] text-ink-500">Add and save a phone number first.</p>;
  }

  function send() {
    startTransition(async () => {
      setSendState(await sendPhoneCodeAction());
    });
  }

  return (
    <div className="space-y-3">
      <ActionMessage state={sendState} />
      <Button type="button" variant="outline" size="sm" onClick={send} disabled={pending}>
        {pending ? "Sending..." : "Send SMS code"}
      </Button>
      <form action={action} className="space-y-3">
        <ActionMessage state={state} />
        <Field label="SMS code" htmlFor="phoneCode">
          <Input
            id="phoneCode"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            required
          />
        </Field>
        <SubmitButton size="sm" variant="outline" pendingLabel="Verifying...">
          Verify phone
        </SubmitButton>
      </form>
    </div>
  );
}
