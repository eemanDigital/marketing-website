"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { PreservedForm } from "@/components/ui/preserved-form";

export function ForgotPasswordForm({
  initialEmail = "",
  next,
}: {
  initialEmail?: string;
  next?: string | null;
}) {
  const [state, action] = useActionState(requestPasswordResetAction, null);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <ActionMessage state={state} />
        <ResetPasswordForm email={state.email ?? ""} next={state.next ?? next} />
        <a
          href="/forgot-password"
          className="block text-center text-[12px] font-semibold text-brand-700 hover:underline"
        >
          Use a different email
        </a>
      </div>
    );
  }

  return (
    <PreservedForm action={action} className="space-y-4">
      <ActionMessage state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Email address" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          defaultValue={initialEmail}
          required
        />
      </Field>
      <SubmitButton className="w-full" pendingLabel="Sending...">
        Send reset code
      </SubmitButton>
    </PreservedForm>
  );
}
