"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Type } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/field";
import { cn } from "@/lib/utils";

type Mode = "drawn" | "typed";

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

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={mode === "drawn" ? data : ""} />
      <input type="hidden" name="signatureType" value={mode} />

      <div className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-1">
        <button
          type="button"
          onClick={() => setMode("drawn")}
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
          onClick={() => setMode("typed")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold",
            mode === "typed" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
          )}
        >
          <Type className="h-3.5 w-3.5" aria-hidden />
          Type
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
      ) : (
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
      )}
    </div>
  );
}
