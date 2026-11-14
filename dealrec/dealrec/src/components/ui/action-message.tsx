import { Alert } from "./alert";
import type { ActionState } from "@/server/action-state";

export function ActionMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) {
    return <Alert tone="error">{state.error}</Alert>;
  }
  if (state.success || state.devCode) {
    return (
      <div className="space-y-2">
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}
        {state.devCode ? (
          <Alert tone="info" title={`Development code: ${state.devCode}`}>
            This code is shown because the app is running in development. In production it is sent
            privately and never shown in the app.
          </Alert>
        ) : null}
      </div>
    );
  }
  return null;
}
