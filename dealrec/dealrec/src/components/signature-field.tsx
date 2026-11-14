"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Eraser, FileUp, PenLine, Type } from "lucide-react";
import NextImage from "next/image";
import { Button } from "./ui/button";
import { Input } from "./ui/field";
import { cn } from "@/lib/utils";
import { MAX_SIGNATURE_BYTES } from "@/lib/constants";

type Mode = "drawn" | "typed" | "uploaded";

export function SignatureField({
  name = "signatureData",
  fullName,
}: {
  name?: string;
  fullName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<{ clear: () => void; toDataURL: (type?: string) => string; isEmpty: () => boolean; on: () => void } | null>(null);
  const [mode, setMode] = useState<Mode>("drawn");
  const [data, setData] = useState("");
  const [typed, setTyped] = useState(fullName ?? "");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (mode !== "drawn") return;
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.offsetWidth;
    canvas.width = width * ratio;
    canvas.height = 160 * ratio;
    const context = canvas.getContext("2d");
    if (context) context.scale(ratio, ratio);

    import("signature_pad").then(({ default: SignaturePad }) => {
      if (cancelled) return;
      const pad = new SignaturePad(canvas, {
        minWidth: 1,
        maxWidth: 2.6,
        penColor: "#1a1f1c",
        backgroundColor: "rgba(255,255,255,0)",
      });
      pad.addEventListener("endStroke", () => {
        setData(pad.isEmpty() ? "" : pad.toDataURL("image/png"));
      });
      padRef.current = pad as unknown as typeof padRef.current;
    });

    return () => {
      cancelled = true;
      padRef.current = null;
    };
  }, [mode]);

  function clear() {
    padRef.current?.clear();
    setData("");
  }

  function changeMode(nextMode: Mode) {
    if (mode === "drawn") padRef.current?.clear();
    setData("");
    setUploadError("");
    setMode(nextMode);
  }

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
      <input type="hidden" name={name} value={mode !== "typed" ? data : ""} />
      <input type="hidden" name="signatureType" value={mode} />

      <div className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-1">
        <button
          type="button"
          onClick={() => changeMode("drawn")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold",
            mode === "drawn" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
          )}
        >
          <PenLine className="h-3.5 w-3.5" aria-hidden />
          Draw
        </button>
        <button
          type="button"
          onClick={() => changeMode("typed")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold",
            mode === "typed" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
          )}
        >
          <Type className="h-3.5 w-3.5" aria-hidden />
          Type
        </button>
        <button
          type="button"
          onClick={() => changeMode("uploaded")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold",
            mode === "uploaded" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
          )}
        >
          <FileUp className="h-3.5 w-3.5" aria-hidden />
          Upload
        </button>
      </div>

      {mode === "drawn" ? (
        <div className="rounded-xl border border-dashed border-ink-300 bg-white">
          <canvas
            ref={canvasRef}
            className="h-40 w-full touch-none rounded-xl"
            aria-label="Draw your signature"
          />
          <div className="flex items-center justify-between border-t border-ink-100 px-3 py-2">
            <span className="text-[12px] text-ink-500">Sign inside the box with your finger or mouse.</span>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <Eraser className="h-3.5 w-3.5" aria-hidden />
              Clear
            </Button>
          </div>
        </div>
      ) : mode === "typed" ? (
        <div className="space-y-2 rounded-xl border border-dashed border-ink-300 bg-white p-4">
          <Input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Type your full name"
            aria-label="Typed signature"
            maxLength={80}
          />
          <div className="rounded-lg bg-ink-50 px-4 py-5 text-center">
            <span className="font-serif text-2xl italic text-ink-800">{typed || "Your name"}</span>
          </div>
          <p className="text-[12px] text-ink-500">
            A typed signature is a simple electronic signature representation. It is recorded with the
            signing event and technical metadata.
          </p>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-dashed border-ink-300 bg-white p-4">
          <label className="block text-sm font-semibold text-ink-800" htmlFor={`${name}-upload`}>
            Upload a signature image
          </label>
          <input
            id={`${name}-upload`}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleUpload}
            className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-800"
          />
          <p className="text-[12px] leading-5 text-ink-500">
            PNG, JPG or WebP, up to 5 MB. The image is resized and stored with this signing record.
          </p>
          {uploadError ? <p role="alert" className="text-[12px] font-medium text-red-700">{uploadError}</p> : null}
          {data && mode === "uploaded" ? (
            <div className="rounded-lg border border-ink-100 bg-white p-3">
              <NextImage
                src={data}
                alt="Uploaded signature preview"
                width={480}
                height={120}
                unoptimized
                className="max-h-24 max-w-full object-contain"
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
