"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Handshake } from "lucide-react";
import { acceptWitnessAction } from "@/server/actions/witness";
import { Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PreservedForm } from "@/components/ui/preserved-form";

export function WitnessAccept({
  token,
  witnessedName,
  versionNumber,
}: {
  token: string;
  witnessedName: string;
  versionNumber: number;
}) {
  const [state, action] = useActionState(acceptWitnessAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Handshake className="h-4 w-4 text-violet-600" aria-hidden />
            Accept witness invitation
          </span>
        }
        description={`Confirm your intention to witness ${witnessedName} sign version ${versionNumber}.`}
      />
      <CardBody>
        <PreservedForm action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <ActionMessage state={state} />
          <Checkbox
            name="consent"
            value="1"
            required
            label={
              <span>
                I accept this invitation and intend to witness the signing. I understand this records
                intention only; I must personally observe {witnessedName} sign version {versionNumber}
                and submit a separate attestation afterward. I will not attest if I did not observe
                the signing.
              </span>
            }
          />
          <Alert tone="info">
            Accepting does not certify that a signature has happened. Your attestation will be enabled
            only after {witnessedName} signs this version.
          </Alert>
          <SubmitButton className="w-full" pendingLabel="Recording intention...">
            I agree to witness
          </SubmitButton>
        </PreservedForm>
      </CardBody>
    </Card>
  );
}
