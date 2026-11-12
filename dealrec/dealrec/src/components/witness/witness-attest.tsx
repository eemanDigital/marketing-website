"use client";

import { useActionState } from "react";
import { FileSignature } from "lucide-react";
import { attestWitnessAction } from "@/server/actions/witness";
import { SignatureField } from "@/components/signature-field";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export function WitnessAttest({
  token,
  defaultName,
  defaultAddress,
  defaultOccupation,
  defaultRelationship,
  versionNumber,
  witnessedName,
}: {
  token: string;
  defaultName: string;
  defaultAddress?: string | null;
  defaultOccupation?: string | null;
  defaultRelationship?: string | null;
  versionNumber: number;
  witnessedName: string;
}) {
  const [state, action] = useActionState(attestWitnessAction, null);

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-brand-600" aria-hidden />
            Attest as a witness
          </span>
        }
        description={`Confirm that you observed ${witnessedName} sign version ${versionNumber}.`}
      />
      <CardBody>
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <ActionMessage state={state} />
          <Field label="Your full name" htmlFor="signerName" required>
            <Input id="signerName" name="signerName" defaultValue={defaultName} maxLength={120} required />
          </Field>
          <Field label="Your address" htmlFor="address" required hint="Recorded on the attestation.">
            <Input id="address" name="address" defaultValue={defaultAddress ?? ""} maxLength={240} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Occupation" htmlFor="occupation" hint="Optional">
              <Input id="occupation" name="occupation" defaultValue={defaultOccupation ?? ""} maxLength={120} />
            </Field>
            <Field label="Relationship to the party" htmlFor="relationship" hint="Optional">
              <Input id="relationship" name="relationship" defaultValue={defaultRelationship ?? ""} maxLength={120} />
            </Field>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-800">Your signature</p>
            <SignatureField fullName={defaultName} />
          </div>
          <Checkbox
            name="consent"
            value="1"
            required
            label={
              <span>
                I confirm that I observed {witnessedName} sign this version, that my details are
                accurate, and that I am attesting voluntarily. I understand this is a platform record,
                not legal advice, and that some transactions require a witness to be physically present
                or to satisfy other formalities. I consent to my name, signature, address, IP address and
                device information being recorded with this attestation.
              </span>
            }
          />
          <Alert tone="warning">
            Attestation is locked to document version {versionNumber}. If the agreement changes, you
            will be asked to attest to the new version.
          </Alert>
          <SubmitButton className="w-full" pendingLabel="Attesting...">
            Submit witness attestation
          </SubmitButton>
        </form>
      </CardBody>
    </Card>
  );
}
