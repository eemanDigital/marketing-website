"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function VerifyLookup() {
  const [identifier, setIdentifier] = useState("");
  const router = useRouter();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = identifier.trim();
        if (!value) return;
        router.push(`/verify/${encodeURIComponent(value)}`);
      }}
      className="space-y-3"
    >
      <label htmlFor="identifier" className="block text-sm font-semibold text-ink-800">
        Deal reference or verification code
      </label>
      <Input
        id="identifier"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder="e.g. DR-2026-XXXX or the code from the certificate"
        autoComplete="off"
      />
      <Button type="submit" className="w-full">
        <Search className="h-4 w-4" aria-hidden />
        Check the record
      </Button>
    </form>
  );
}
