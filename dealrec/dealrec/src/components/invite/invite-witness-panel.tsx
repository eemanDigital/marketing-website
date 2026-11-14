"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link2, ShieldCheck, UserPlus } from "lucide-react";
import { WITNESS_STATUS, WITNESS_STATUS_LABEL } from "@/lib/constants";
import { addInviteWitnessAction } from "@/server/actions/witness";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

type WitnessSummary = {
  id: string;
  fullName: string;
  status: string;
  required: boolean;
  acceptedLabel: string | null;
  attestedLabel: string | null;
};

function toneFor(status: string): "success" | "warning" | "neutral" | "info" {
  if (status === WITNESS_STATUS.ATTESTED) return "success";
  if (status === WITNESS_STATUS.ACCEPTED || status === WITNESS_STATUS.VERIFIED || status === WITNESS_STATUS.OPENED) {
    return "info";
  }
  return "warning";
}

export function InviteWitnessPanel({
  token,
  witnesses,
  disabled,
}: {
  token: string;
  witnesses: WitnessSummary[];
  disabled: boolean;
}) {
  const [state, action] = useActionState(addInviteWitnessAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden />
            Your witness
          </span>
        }
        description="You may invite one witness for your signature on this version."
      />
      <CardBody className="space-y-3">
        {witnesses.map((witness) => (
          <div key={witness.id} className="rounded-xl border border-ink-100 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[12px] font-bold text-ink-900">{witness.fullName}</p>
                {witness.acceptedLabel ? (
                  <p className="mt-1 text-[10px] text-ink-500">Accepted to witness {witness.acceptedLabel}</p>
                ) : null}
                {witness.attestedLabel ? (
                  <p className="mt-1 text-[10px] text-ink-500">Attested {witness.attestedLabel}</p>
                ) : null}
              </div>
              <div className="flex gap-1.5">
                <Badge tone={witness.required ? "warning" : "neutral"}>
                  {witness.required ? "Required" : "Optional"}
                </Badge>
                <Badge tone={toneFor(witness.status)}>
                  {WITNESS_STATUS_LABEL[witness.status] ?? witness.status}
                </Badge>
              </div>
            </div>
          </div>
        ))}

        {state?.url ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
            <p className="text-[11px] font-bold text-brand-900">Share this witness link</p>
            <p className="mt-1 break-all font-mono text-[10px] text-brand-800">{state.url}</p>
            <CopyButton value={state.url} className="mt-2" />
            <p className="mt-2 text-[10px] leading-4 text-brand-800/70">
              The witness must also verify the email or phone number you provided.
            </p>
          </div>
        ) : null}
        <ActionMessage state={state} />

        {witnesses.length === 0 && !disabled ? (
          <form action={action} className="space-y-3 rounded-xl border border-ink-100 p-3">
            <input type="hidden" name="token" value={token} />
            <p className="inline-flex items-center gap-2 text-[12px] font-bold text-ink-900">
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Invite a witness
            </p>
            <Field label="Witness full name" htmlFor="inviteWitnessName" required>
              <Input id="inviteWitnessName" name="fullName" maxLength={120} required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email" htmlFor="inviteWitnessEmail" hint="Email or phone is required">
                <Input id="inviteWitnessEmail" name="email" type="email" maxLength={160} />
              </Field>
              <Field label="Phone number" htmlFor="inviteWitnessPhone" hint="Email or phone is required">
                <Input id="inviteWitnessPhone" name="phoneNumber" maxLength={40} />
              </Field>
            </div>
            <Checkbox
              name="required"
              value="1"
              defaultChecked
              label="This witness must attest before the deal can be executed."
            />
            <SubmitButton size="sm" pendingLabel="Creating...">
              <Link2 className="h-3.5 w-3.5" aria-hidden />
              Create witness link
            </SubmitButton>
          </form>
        ) : null}

        {disabled && witnesses.length === 0 ? (
          <p className="text-[11px] text-ink-500">Witnesses are locked after execution or closing.</p>
        ) : null}
        {witnesses.length > 0 && !disabled ? (
          <p className="text-[11px] text-ink-500">
            One witness is allowed for your signature on this version. Ask the deal creator to help if
            this witness needs to be replaced.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
