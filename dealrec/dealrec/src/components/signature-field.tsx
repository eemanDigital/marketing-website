"use client";

import { useState, type ChangeEvent } from "react";
import { FileUp } from "lucide-react";
import NextImage from "next/image";
import { MAX_SIGNATURE_BYTES } from "@/lib/constants";

export function SignatureField({
  name = "signatureData",
}: {
  name?: string;
  fullName?: string;
}) {
  const [data, setData] = useState("");
  const [uploadError, setUploadError] = useState("");

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setData("");
    setUploadError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setUploadError("Choose a PNG, JPG or WebP image.");
      event.currentTarget.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("The image must be smaller than 5 MB.");
      event.currentTarget.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      if (!image.naturalWidth || !image.naturalHeight) {
        setUploadError("That image could not be read.");
        return;
      }
      const scale = Math.min(1, 1200 / image.naturalWidth, 400 / image.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        setUploadError("Your browser could not process that image.");
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");
      const base64Size = Math.ceil((imageData.length - imageData.indexOf(",") - 1) * 0.75);
      if (base64Size > MAX_SIGNATURE_BYTES) {
        setUploadError("Use a simpler or smaller signature image (maximum 512 KB after processing).");
        return;
      }
      setData(imageData);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setUploadError("That image could not be read.");
    };
    image.src = url;
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={data} />
      <input type="hidden" name="signatureType" value="uploaded" />

      <div className="space-y-3 rounded-xl border border-dashed border-ink-200 bg-surface-muted/30 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <FileUp className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0">
            <label className="block text-sm font-semibold text-ink" htmlFor={`${name}-upload`}>
              Upload your signature
            </label>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">
              Sign clearly on paper, then upload a photo or scan of your signature (PNG, JPG or WebP, up to 5 MB).
            </p>
          </div>
        </div>

        <input
          id={`${name}-upload`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleUpload}
          className="block w-full text-[12px] text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-2 file:text-[12px] file:font-semibold file:text-violet-700"
        />
        <p className="text-[11px] leading-5 text-ink-subtle">
          The image is resized and stored with this signing record as your electronic signature representation.
        </p>
        {uploadError ? (
          <p role="alert" className="text-[12px] font-medium text-danger-700">
            {uploadError}
          </p>
        ) : null}
        {data ? (
          <div className="rounded-lg border border-ink-100 bg-surface-raised p-3">
            <NextImage
              src={data}
              alt="Uploaded signature preview"
              width={480}
              height={140}
              unoptimized
              className="max-h-28 max-w-full object-contain"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
