"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction } from "@/server/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function SignInForm({ reset }: { reset?: boolean }) {
  const [state, action] = useActionState(signInAction, null);

  return (
    <form action={action} className="space-y-4">
      {reset ? (
        <ActionMessage state={{ success: "Password reset. Sign in with your new password." }} />
      ) : null}
      <ActionMessage state={state} />
      <Field label="Email address" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required />
      </Field>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-semibold text-ink-800">
            Password
          </label>
          <Link href="/forgot-password" className="text-[12px] font-semibold text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton className="w-full" pendingLabel="Signing in...">
        Sign in
      </SubmitButton>
    </form>
  );
}
