"use client";

import { useActionState } from "react";
import { CheckCircle2, FileSearch, XCircle } from "lucide-react";
import { checkFileAction } from "@/server/actions/verify";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export function VerifyFileForm({ identifier }: { identifier: string }) {
  const [result, action] = useActionState(checkFileAction, null);

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-brand-600" aria-hidden />
            Compare a file
          </span>
        }
        description="Upload an executed PDF to compare its SHA-256 hash with the platform record."
      />
      <CardBody className="space-y-3">
        <form action={action} className="space-y-3">
          <input type="hidden" name="identifier" value={identifier} />
          <input
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] text-ink-600 file:mr-2 file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
          />
          <SubmitButton size="sm" variant="outline" pendingLabel="Comparing...">
            Compare file hash
          </SubmitButton>
        </form>

        {result && !result.ok ? <Alert tone="error">{result.error}</Alert> : null}
        {result?.ok ? (
          result.match ? (
            <Alert tone="success" title="The file matches the record">
              <div className="mt-1 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Identical SHA-256 fingerprint
                </p>
                <p className="font-mono text-[10px]">Recorded: {result.expectedFingerprint}…</p>
                <p className="font-mono text-[10px]">Uploaded: {result.uploadedFingerprint}…</p>
                <p className="text-[11px]">
                  This shows the file is byte-for-byte identical to the executed document recorded by
                  dealrec. It does not by itself prove legal validity or that money was paid.
                </p>
              </div>
            </Alert>
          ) : (
            <Alert tone="error" title="The file does not match">
              <div className="mt-1 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold">
                  <XCircle className="h-4 w-4" aria-hidden />
                  Different SHA-256 fingerprint
                </p>
                <p className="font-mono text-[10px]">Recorded: {result.expectedFingerprint}…</p>
                <p className="font-mono text-[10px]">Uploaded: {result.uploadedFingerprint}…</p>
                <p className="text-[11px]">
                  The uploaded file differs from the recorded executed copy. That may be because the
                  file was edited, regenerated or is a different document. A mismatch does not by itself
                  prove fraud.
                </p>
              </div>
            </Alert>
          )
        ) : null}
      </CardBody>
    </Card>
  );
}
