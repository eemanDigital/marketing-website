"use client";

import { useActionState, useMemo, useState, type ChangeEvent } from "react";
import { CheckCircle2, FileSearch, XCircle } from "lucide-react";
import { checkFileAction } from "@/server/actions/verify";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PreservedForm } from "@/components/ui/preserved-form";
import type { VerifiableArtifact } from "@/lib/verify";

async function hashFile(file: File) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function VerifyFileForm({
  identifier,
  artifacts,
}: {
  identifier: string;
  artifacts: VerifiableArtifact[];
}) {
  const [result, action] = useActionState(checkFileAction, null);
  const [artifactId, setArtifactId] = useState(artifacts[0]?.id ?? "agreement");
  const [fileHash, setFileHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [hashing, setHashing] = useState(false);
  const [hashError, setHashError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const grouped = new Map<string, VerifiableArtifact[]>();
    for (const artifact of artifacts) {
      const current = grouped.get(artifact.group) ?? [];
      current.push(artifact);
      grouped.set(artifact.group, current);
    }
    return Array.from(grouped.entries());
  }, [artifacts]);

  const selected = artifacts.find((artifact) => artifact.id === artifactId) ?? artifacts[0];

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileHash("");
    setFileName(file?.name ?? "");
    setHashError(null);
    if (!file) return;

    setHashing(true);
    try {
      setFileHash(await hashFile(file));
    } catch {
      setHashError("This browser could not compute the file hash. Try another browser.");
    } finally {
      setHashing(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-violet-600" aria-hidden />
            Compare a file
          </span>
        }
        description="Choose a recorded file, then select your copy. The hash is computed in your browser; the file is not uploaded."
      />
      <CardBody className="space-y-3">
        <PreservedForm action={action} className="space-y-3">
          <input type="hidden" name="identifier" value={identifier} />
          <input type="hidden" name="artifactId" value={artifactId} />
          <input type="hidden" name="fileHash" value={fileHash} />

          <div>
            <label htmlFor="artifactId" className="mb-1 block text-[11px] font-semibold text-ink-muted">
              Recorded file to compare against
            </label>
            <select
              id="artifactId"
              name="artifactId"
              value={artifactId}
              onChange={(event) => setArtifactId(event.target.value)}
              className="w-full rounded-xl border border-ink-200 bg-surface-raised px-3 py-2 text-[12px] text-ink"
            >
              {groups.map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((artifact) => (
                    <option key={artifact.id} value={artifact.id}>
                      {artifact.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selected?.detail ? (
              <p className="mt-1 text-[10px] text-ink-subtle">{selected.detail}</p>
            ) : null}
            {selected?.expectedFingerprint ? (
              <p className="mt-1 break-all font-mono text-[10px] text-ink-subtle">
                Recorded SHA-256: {selected.expectedFingerprint}…
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="verifyFile" className="mb-1 block text-[11px] font-semibold text-ink-muted">
              Your copy of that file
            </label>
            <input
              id="verifyFile"
              type="file"
              required
              onChange={handleFileChange}
              className="w-full rounded-xl border border-ink-200 bg-surface-raised px-3 py-2 text-[12px] text-ink-muted file:mr-2 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
            />
            {hashing ? (
              <p className="mt-1 text-[10px] text-ink-subtle">Computing SHA-256…</p>
            ) : fileHash ? (
              <p className="mt-1 break-all font-mono text-[10px] text-ink-subtle">
                Local hash: {fileHash.slice(0, 16)}… · {fileName}
              </p>
            ) : null}
          </div>

          {hashError ? <Alert tone="error">{hashError}</Alert> : null}

          <SubmitButton
            size="sm"
            variant="outline"
            pendingLabel="Comparing..."
            disabled={hashing || !fileHash}
          >
            Compare file hash
          </SubmitButton>
        </PreservedForm>

        {result && !result.ok ? <Alert tone="error">{result.error}</Alert> : null}
        {result?.ok ? (
          result.match ? (
            <Alert tone="success" title="The file matches the record">
              <div className="mt-1 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Identical SHA-256 for {result.label}
                </p>
                <p className="font-mono text-[10px]">Recorded: {result.expectedFingerprint}…</p>
                <p className="font-mono text-[10px]">Your file: {result.uploadedFingerprint}…</p>
                <p className="text-[11px]">
                  This shows the file is byte-for-byte identical to the recorded copy. It does not by
                  itself prove legal validity or that money was paid.
                </p>
              </div>
            </Alert>
          ) : (
            <Alert tone="error" title="The file does not match">
              <div className="mt-1 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold">
                  <XCircle className="h-4 w-4" aria-hidden />
                  Different SHA-256 for {result.label}
                </p>
                <p className="font-mono text-[10px]">Recorded: {result.expectedFingerprint}…</p>
                <p className="font-mono text-[10px]">Your file: {result.uploadedFingerprint}…</p>
                <p className="text-[11px]">
                  The selected file differs from the recorded copy. That may be because it was edited,
                  regenerated or is a different document. A mismatch does not by itself prove fraud.
                </p>
              </div>
            </Alert>
          )
        ) : null}
      </CardBody>
    </Card>
  );
}
