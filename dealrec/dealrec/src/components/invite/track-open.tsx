"use client";

import { useEffect } from "react";
import { trackInvitationOpenAction } from "@/server/actions/invite";

export function TrackOpen({ token }: { token: string }) {
  useEffect(() => {
    void trackInvitationOpenAction(token);
  }, [token]);

  return null;
}
