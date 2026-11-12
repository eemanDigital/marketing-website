"use client";

import { useActionState } from "react";
import { Link2, RefreshCw, ShieldCheck, UserPlus, XCircle } from "lucide-react";
import {
  addWitnessAction,
  resendWitnessAction,
  revokeWitnessAction,
} from "@/server/actions/witness";
import { Field, Input, Select, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";

type PartyOption = {
  id: string;
  fullName: string;
  role: string;
  isCreator: boolean;
};

type WitnessView = {
  id: string;
  witnessedPartyId: string;
  witnessedPartyName: string;
  fullName: string;
  status: string;
  statusLabel: string;
  required: boolean;
  expiresLabel: string;
  attestedLabel: string | null;
  openCount: number;
  canManage: boolean;
  canResend: boolean;
};

function toneFor(status: string): "success" | "warning" | "danger" | "neutral" | "info" {
  if (status === "ATTESTED") return "success";
  if (status === "REVOKED" || status === "SUPERSEDED") return "neutral";
  if (status === "VERIFIED" || status === "OPENED") return "info";
  return "warning";
}

function WitnessRow({ dealId, witness }: { dealId: string; witness: WitnessView }) {
  const [revokeState, revokeAction] = useActionState(revokeWitnessAction, null);
  const [resendState, resendAction] = useActionState(resendWitnessAction, null);

  return (
    <div className="rounded-xl border border-ink-100 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-bold text-ink-900">{witness.fullName}</p>
          <p className="text-[11px] text-ink-500">
            Witness for {witness.witnessedPartyName} · opens {witness.openCount}
          </p>
          <p className="text-[10px] text-ink-400">
            Expires {witness.expiresLabel}
            {witness.attestedLabel ? ` · Attested ${witness.attestedLabel}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {witness.required ? <Badge tone="warning">Required</Badge> : <Badge tone="neutral">Optional</Badge>}
          <Badge tone={toneFor(witness.status)}>{witness.statusLabel}</Badge>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        <ActionMessage state={revokeState} />
        <ActionMessage state={resendState} />
        {resendState?.url ? (
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-2">
            <p className="break-all font-mono text-[10px] text-brand-800">{resendState.url}</p>
            <CopyButton value={resendState.url} className="mt-1" />
          </div>
        ) : null}
        {witness.canManage || witness.canResend ? (
          <div className="flex flex-wrap gap-2">
            {witness.canResend ? (
              <form action={resendAction}>
                <input type="hidden" name="dealId" value={dealId} />
                <input type="hidden" name="witnessId" value={witness.id} />
                <button type="submit" className={buttonStyles({ variant: "outline", size: "sm" })}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  New link
                </button>
              </form>
            ) : null}
            {witness.canManage ? (
              <form action={revokeAction}>
                <input type="hidden" name="dealId" value={dealId} />
                <input type="hidden" name="witnessId" value={witness.id} />
                <button type="submit" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                  <XCircle className="h-3.5 w-3.5" aria-hidden />
                  Revoke
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function WitnessPanel({
  dealId,
  parties,
  witnesses,
  canManage,
  viewerPartyId,
  disabled,
}: {
  dealId: string;
  parties: PartyOption[];
  witnesses: WitnessView[];
  canManage: boolean;
  viewerPartyId: string | null;
  disabled: boolean;
}) {
  const [addState, addAction] = useActionState(addWitnessAction, null);
  const currentPartyIds = new Set(witnesses.map((witness) => witness.witnessedPartyId));
  const addableParties = parties.filter(
    (party) => (canManage || party.id === viewerPartyId) && !currentPartyIds.has(party.id),
  );

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden />
            Witnesses
          </span>
        }
        description="A witness attests that they observed a party sign the current version."
      />
      <CardBody className="space-y-3">
        {witnesses.length === 0 ? (
          <p className="text-[12px] text-ink-500">No witnesses for the current version yet.</p>
        ) : (
          witnesses.map((witness) => (
            <WitnessRow key={witness.id} dealId={dealId} witness={witness} />
          ))
        )}

        {addState?.url ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
            <p className="text-[11px] font-bold text-brand-900">Witness link</p>
            <p className="mt-1 break-all font-mono text-[10px] text-brand-800">{addState.url}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <CopyButton value={addState.url} />
              <a
                href={addState.url}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({ variant: "outline", size: "sm" })}
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden />
                Open link
              </a>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-brand-800/70">
              This link is only shown in this response. The witness still needs a one-time code sent to
              the contact recorded above.
            </p>
          </div>
        ) : null}
        <ActionMessage state={addState} />

        {disabled ? (
          <p className="text-[11px] text-ink-500">Witnesses are locked after execution or closing.</p>
        ) : addableParties.length === 0 ? (
          <p className="text-[11px] text-ink-500">
            Each party can have one witness for this version. Revoke or create a new version to change
            a witness.
          </p>
        ) : (
          <form action={addAction} className="space-y-3 rounded-xl border border-ink-100 p-3">
            <input type="hidden" name="dealId" value={dealId} />
            <p className="inline-flex items-center gap-2 text-[12px] font-bold text-ink-900">
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Add a witness
            </p>
            <Field label="Witness for" htmlFor="witnessPartyId" required>
              <Select
                id="witnessPartyId"
                name="partyId"
                defaultValue={addableParties[0]?.id}
                required
              >
                {addableParties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.fullName} · {party.role}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Witness full name" htmlFor="witnessFullName" required>
              <Input id="witnessFullName" name="fullName" maxLength={120} required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email" htmlFor="witnessEmail" hint="Email or phone is required">
                <Input id="witnessEmail" name="email" type="email" maxLength={160} />
              </Field>
              <Field label="Phone number" htmlFor="witnessPhone" hint="Email or phone is required">
                <Input id="witnessPhone" name="phoneNumber" maxLength={40} />
              </Field>
            </div>
            <Field label="Witness address" htmlFor="witnessAddress" hint="Optional now, confirmed at attestation">
              <Input id="witnessAddress" name="address" maxLength={240} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Occupation" htmlFor="witnessOccupation" hint="Optional">
                <Input id="witnessOccupation" name="occupation" maxLength={120} />
              </Field>
              <Field label="Relationship" htmlFor="witnessRelationship" hint="Optional">
                <Input id="witnessRelationship" name="relationship" maxLength={120} />
              </Field>
            </div>
            <Checkbox
              name="required"
              value="1"
              defaultChecked
              label="This witness must attest before the deal can be executed."
            />
            <SubmitButton size="sm" pendingLabel="Creating...">
              Create witness link
            </SubmitButton>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
