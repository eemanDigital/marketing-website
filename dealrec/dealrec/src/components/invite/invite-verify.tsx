"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { sendInviteOtpAction, verifyInviteOtpAction } from "@/server/actions/invite";
import type { ActionState } from "@/server/action-state";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PreservedForm } from "@/components/ui/preserved-form";

export function InviteVerify({ token, contact }: { token: string; contact: string }) {
  const [state, action] = useActionState(verifyInviteOtpAction, null);
  const [sendState, setSendState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

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
            <ShieldCheck className="h-4 w-4 text-violet-600" aria-hidden />
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

        <PreservedForm action={action} className="space-y-3">
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
        </PreservedForm>
        <p className="text-[11px] leading-5 text-ink-subtle">
          The code proves control of this contact channel for this session. It is not a national
          identity check. Never share the code with anyone.
        </p>
      </CardBody>
    </Card>
  );
}
