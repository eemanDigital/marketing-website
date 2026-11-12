"use client";

import { useEffect } from "react";
import { trackWitnessOpenAction } from "@/server/actions/witness";

export function TrackWitnessOpen({ token }: { token: string }) {
  useEffect(() => {
    void trackWitnessOpenAction(token);
  }, [token]);

  return null;
}
