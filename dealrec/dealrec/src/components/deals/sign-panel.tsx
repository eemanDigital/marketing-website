"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, FileSignature } from "lucide-react";
import { signAsCreatorAction } from "@/server/actions/sign";
import { SignatureField } from "@/components/signature-field";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export function SignPanel({
  dealId,
  versionNumber,
  defaultName,
  alreadySigned,
  canSign,
}: {
  dealId: string;
  versionNumber: number;
  defaultName: string;
  alreadySigned: boolean;
  canSign: boolean;
}) {
  const [state, action] = useActionState(signAsCreatorAction, null);

  if (alreadySigned) {
    return (
      <Card className="border-brand-200 bg-brand-50">
        <CardBody className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
          <div>
            <p className="text-[14px] font-bold text-brand-900">You signed version {versionNumber}</p>
            <p className="mt-0.5 text-[12px] leading-5 text-brand-800/80">
              Your signature is locked to this exact document hash. If the other party requests a
              change, a new version will require a fresh signature.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!canSign) {
    return (
      <Alert tone="warning">
        This deal is not currently open for signing. Review the activity and status before taking
        further action.
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-brand-600" aria-hidden />
            Sign version {versionNumber}
          </span>
        }
        description="Confirm that you have reviewed this exact version and intend to be bound by it."
      />
      <CardBody>
        <form action={action} className="space-y-4">
          <input type="hidden" name="dealId" value={dealId} />
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
                I confirm that I have read and understood this agreement, that the information I
                provided is accurate, and that I intend to be legally bound by it. I understand this is
                a platform record and not legal advice, and that some transactions require additional
                legal formalities. I consent to my name, signature, IP address and device information
                being recorded with the signing event.
              </span>
            }
          />

          <Alert tone="warning">
            <span className="inline-flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Signing locks this version. Later changes require a new version and new signatures.
            </span>
          </Alert>

          <SubmitButton className="w-full" pendingLabel="Signing...">
            Sign agreement
          </SubmitButton>
        </form>
      </CardBody>
    </Card>
  );
}
