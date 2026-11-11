"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/server/actions/auth";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";

export function ProfileForm({
  fullName,
  phoneNumber,
  email,
}: {
  fullName: string;
  phoneNumber: string | null;
  email: string;
}) {
  const [state, action] = useActionState(updateProfileAction, null);

  return (
    <form action={action} className="space-y-3">
      <ActionMessage state={state} />
      <Field label="Full name" htmlFor="fullName" required>
        <Input id="fullName" name="fullName" defaultValue={fullName} required minLength={2} maxLength={120} />
      </Field>
      <Field label="Email address" htmlFor="email" hint="Email changes are not available in this MVP.">
        <Input id="email" value={email} disabled readOnly />
      </Field>
      <Field label="Phone number" htmlFor="phoneNumber" hint="Nigerian format, e.g. 08012345678.">
        <Input id="phoneNumber" name="phoneNumber" inputMode="tel" defaultValue={phoneNumber ?? ""} placeholder="08012345678" />
      </Field>
      <SubmitButton size="sm" pendingLabel="Saving...">
        Save profile
      </SubmitButton>
    </form>
  );
}
