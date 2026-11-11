"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/server/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function ResetPasswordForm({ email = "" }: { email?: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);

  return (
    <form action={action} className="space-y-4">
      <ActionMessage state={state} />
      <Field label="Email address" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={email} required />
      </Field>
      <Field label="Reset code" htmlFor="code" required hint="The 6-digit code sent to your email.">
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
      <Field label="New password" htmlFor="password" required hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <SubmitButton className="w-full" pendingLabel="Resetting...">
        Reset password
      </SubmitButton>
    </form>
  );
}
