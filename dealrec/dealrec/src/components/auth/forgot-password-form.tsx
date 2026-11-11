"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordResetAction, null);

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <ActionMessage state={state} />
        <Field label="Email address" htmlFor="email" required>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required />
        </Field>
        <SubmitButton className="w-full" pendingLabel="Sending...">
          Send reset code
        </SubmitButton>
      </form>
      {state?.success ? (
        <Link
          href="/reset-password"
          className="flex h-11 w-full items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-sm font-semibold text-brand-800"
        >
          Continue to reset password
        </Link>
      ) : null}
    </div>
  );
}
