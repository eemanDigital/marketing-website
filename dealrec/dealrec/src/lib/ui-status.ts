import { DEAL_STATUS } from "./constants";

export type TargetStatus = "draft" | "negotiating" | "awaiting_signature" | "sealed" | "disputed";

export type StatusPresentation = {
  key: TargetStatus;
  label: string;
  tone: "neutral" | "violet" | "amber" | "sky" | "danger";
  description: string;
};

const presentations: Record<TargetStatus, StatusPresentation> = {
  draft: {
    key: "draft",
    label: "Draft",
    tone: "neutral",
    description: "Being prepared and not yet shared for signature.",
  },
  negotiating: {
    key: "negotiating",
    label: "Negotiating",
    tone: "violet",
    description: "Parties are reviewing or proposing changes.",
  },
  awaiting_signature: {
    key: "awaiting_signature",
    label: "Awaiting signature",
    tone: "amber",
    description: "Waiting for one or more signatures or attestations.",
  },
  sealed: {
    key: "sealed",
    label: "Signed (Sealed)",
    tone: "sky",
    description: "Fully signed and sealed with a verifiable record.",
  },
  disputed: {
    key: "disputed",
    label: "Disputed",
    tone: "danger",
    description: "Flagged for review due to a disagreement.",
  },
};

export function toTargetStatus(status: string): TargetStatus {
  switch (status) {
    case DEAL_STATUS.DRAFT:
      return "draft";
    case DEAL_STATUS.AWAITING_COUNTERPARTY:
    case DEAL_STATUS.UNDER_REVIEW:
    case DEAL_STATUS.CHANGE_REQUESTED:
      return "negotiating";
    case DEAL_STATUS.AWAITING_CREATOR_SIGNATURE:
    case DEAL_STATUS.AWAITING_OTHER_SIGNATURES:
    case DEAL_STATUS.AWAITING_WITNESSES:
    case DEAL_STATUS.OVERDUE:
      return "awaiting_signature";
    case DEAL_STATUS.EXECUTED:
    case DEAL_STATUS.ACTIVE:
    case DEAL_STATUS.COMPLETED:
      return "sealed";
    case DEAL_STATUS.CANCELLED:
    case DEAL_STATUS.VOIDED:
    case DEAL_STATUS.SUPERSEDED:
      // Closed/cancelled records are treated as neutral-draft-like in some lists,
      // but when explicitly disputed in future we will map to disputed.
      return "draft";
    default:
      return "draft";
  }
}

export function presentStatus(status: string): StatusPresentation {
  if (status === DEAL_STATUS.AWAITING_WITNESSES) {
    return {
      key: "awaiting_signature",
      label: "Awaiting witness",
      tone: "amber",
      description: "Waiting for required witness attestations.",
    };
  }
  // Future additive path: a deal flagged as disputed will map to "disputed".
  // For now, keep existing data behavior and derive from current status only.
  return presentations[toTargetStatus(status)];
}

export function isDisputableStatus(status: string) {
  return [
    DEAL_STATUS.EXECUTED,
    DEAL_STATUS.ACTIVE,
    DEAL_STATUS.COMPLETED,
  ].includes(status as never);
}