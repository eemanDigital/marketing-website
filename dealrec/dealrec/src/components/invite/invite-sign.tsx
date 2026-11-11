"use client";

import { useActionState } from "react";
import { FileSignature } from "lucide-react";
import { signInvitationAction } from "@/server/actions/invite";
import { SignatureField } from "@/components/signature-field";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export function InviteSign({
  token,
  defaultName,
  versionNumber,
}: {
  token: string;
  defaultName: string;
  versionNumber: number;
}) {
  const [state, action] = useActionState(signInvitationAction, null);

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-brand-600" aria-hidden />
            Sign version {versionNumber}
          </span>
        }
        description="Your signature will be locked to the exact version you reviewed."
      />
      <CardBody>
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <ActionMessage state={state} />
          <Field label="Your full name" htmlFor="signerName" required>
            <Input id="signerName" name="signerName" defaultValue={defaultName} maxLength={120} required />
          </Field>
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
                I confirm that I have read and understood this agreement, that my details are accurate,
                and that I intend to be legally bound by it. I understand this is a platform record and
                not legal advice, and that some transactions require additional legal formalities. I
                consent to my name, signature, IP address and device information being recorded with
                this signing event.
              </span>
            }
          />
          <Alert tone="warning">
            After signing, this version is locked. If the terms change, the creator must prepare a new
            version and you must review and sign again.
          </Alert>
          <SubmitButton className="w-full" pendingLabel="Signing...">
            Sign agreement
          </SubmitButton>
        </form>
      </CardBody>
    </Card>
  );
}
