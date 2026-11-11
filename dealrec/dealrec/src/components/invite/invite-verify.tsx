"use client";

import { useActionState, useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { sendInviteOtpAction, verifyInviteOtpAction } from "@/server/actions/invite";
import type { ActionState } from "@/server/action-state";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export function InviteVerify({ token, contact }: { token: string; contact: string }) {
  const [state, action] = useActionState(verifyInviteOtpAction, null);
  const [sendState, setSendState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      setSendState(await sendInviteOtpAction(token));
    });
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden />
            Verify it is you
          </span>
        }
        description={`We will send a 6-digit code to ${contact}.`}
      />
      <CardBody className="space-y-4">
        <ActionMessage state={sendState} />
        <Button type="button" onClick={send} disabled={pending} className="w-full">
          {pending ? "Sending code..." : "Send verification code"}
        </Button>

        <form action={action} className="space-y-3">
          <input type="hidden" name="token" value={token} />
          <ActionMessage state={state} />
          <Field label="6-digit code" htmlFor="code" required>
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
            Verify and continue
          </SubmitButton>
        </form>
        <p className="text-[11px] leading-5 text-ink-500">
          The code proves control of this contact channel for this session. It is not a national
          identity check. Never share the code with anyone.
        </p>
      </CardBody>
    </Card>
  );
}
