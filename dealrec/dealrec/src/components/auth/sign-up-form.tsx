"use client";

import { useActionState } from "react";
import { signUpAction } from "@/server/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, null);

  return (
    <form action={action} className="space-y-4">
      <ActionMessage state={state} />
      <Field label="Full name" htmlFor="fullName" required>
        <Input id="fullName" name="fullName" autoComplete="name" placeholder="e.g. Adaeze Okafor" required minLength={2} maxLength={120} />
      </Field>
      <Field label="Email address" htmlFor="email" required hint="We send a verification code to this email.">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required />
      </Field>
      <Field label="Password" htmlFor="password" required hint="At least 8 characters. Use a mix of letters and numbers.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <p className="text-[11px] leading-5 text-ink-500">
        By creating an account you agree that dealrec may store the agreements and records you create.
        You remain responsible for the accuracy of the information you provide.
      </p>
      <SubmitButton className="w-full" pendingLabel="Creating account...">
        Create account
      </SubmitButton>
    </form>
  );
}
