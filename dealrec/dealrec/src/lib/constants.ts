export const APP_NAME = "dealrec";
export const APP_TAGLINE = "Put the deal on record.";
export const CURRENCY = "NGN";
export const TIME_ZONE = "Africa/Lagos";
export const CONSENT_TEXT_VERSION = "2026-01";
export const SESSION_COOKIE = "dealrec_session";
export const SESSION_DAYS = 30;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const INVITATION_DAYS = 14;
export const WITNESS_DAYS = 14;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_SIGNATURE_BYTES = 512 * 1024;

export const DEAL_STATUS = {
  DRAFT: "DRAFT",
  AWAITING_COUNTERPARTY: "AWAITING_COUNTERPARTY",
  UNDER_REVIEW: "UNDER_REVIEW",
  CHANGE_REQUESTED: "CHANGE_REQUESTED",
  AWAITING_CREATOR_SIGNATURE: "AWAITING_CREATOR_SIGNATURE",
  AWAITING_OTHER_SIGNATURES: "AWAITING_OTHER_SIGNATURES",
  AWAITING_WITNESSES: "AWAITING_WITNESSES",
  EXECUTED: "EXECUTED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
  VOIDED: "VOIDED",
  SUPERSEDED: "SUPERSEDED",
} as const;

export type DealStatus = (typeof DEAL_STATUS)[keyof typeof DEAL_STATUS];

export const CLOSED_STATUSES: DealStatus[] = [
  DEAL_STATUS.COMPLETED,
  DEAL_STATUS.CANCELLED,
  DEAL_STATUS.VOIDED,
  DEAL_STATUS.SUPERSEDED,
];

export const AUTH_LEVEL = {
  NONE: "NONE",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
  PHONE_OTP_VERIFIED: "PHONE_OTP_VERIFIED",
  ACCOUNT_SESSION: "ACCOUNT_SESSION",
  THIRD_PARTY_CHECKED: "THIRD_PARTY_CHECKED",
} as const;

export type AuthLevel = (typeof AUTH_LEVEL)[keyof typeof AUTH_LEVEL];

export const AUTH_LEVEL_LABEL: Record<string, string> = {
  NONE: "Not verified",
  EMAIL_VERIFIED: "Email verified",
  PHONE_OTP_VERIFIED: "Phone OTP verified",
  ACCOUNT_SESSION: "Signed in account (email verified)",
  THIRD_PARTY_CHECKED: "Checked by third-party provider",
};

export const INVITATION_STATUS = {
  PENDING: "PENDING",
  CREATED: "CREATED",
  SENT: "SENT",
  OPENED: "OPENED",
  VERIFIED: "VERIFIED",
  ACCEPTED: "ACCEPTED",
  CHANGE_REQUESTED: "CHANGE_REQUESTED",
  DECLINED: "DECLINED",
  SIGNED: "SIGNED",
} as const;

export const DOCUMENT_TYPE = {
  DRAFT: "draft",
  UPLOADED_ORIGINAL: "uploaded_original",
  EXECUTION_COPY: "execution_copy",
  AMENDMENT: "amendment",
  CERTIFICATE: "certificate",
  RECEIPT: "receipt",
  SIGNATURE: "signature",
} as const;

export const OBLIGATION_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  DISPUTED: "DISPUTED",
} as const;

export const WITNESS_STATUS = {
  INVITED: "INVITED",
  OPENED: "OPENED",
  VERIFIED: "VERIFIED",
  ATTESTED: "ATTESTED",
  REVOKED: "REVOKED",
  SUPERSEDED: "SUPERSEDED",
} as const;

export type WitnessStatus = (typeof WITNESS_STATUS)[keyof typeof WITNESS_STATUS];

export const WITNESS_STATUS_LABEL: Record<string, string> = {
  INVITED: "Invited",
  OPENED: "Link opened",
  VERIFIED: "Contact verified",
  ATTESTED: "Attested",
  REVOKED: "Revoked",
  SUPERSEDED: "Superseded",
};

export const SEAL_STATUS = {
  ACTIVE: "ACTIVE",
  VOIDED: "VOIDED",
  SUPERSEDED: "SUPERSEDED",
  REVOKED: "REVOKED",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export const EVENT = {
  DEAL_CREATED: "DEAL_CREATED",
  DOCUMENT_VERSION_CREATED: "DOCUMENT_VERSION_CREATED",
  INVITATION_CREATED: "INVITATION_CREATED",
  PARTY_INVITED: "PARTY_INVITED",
  INVITATION_DELIVERED: "INVITATION_DELIVERED",
  INVITATION_OPENED: "INVITATION_OPENED",
  CONTACT_VERIFIED: "CONTACT_VERIFIED",
  DOCUMENT_VIEWED: "DOCUMENT_VIEWED",
  COMMENT_ADDED: "COMMENT_ADDED",
  CHANGE_REQUESTED: "CHANGE_REQUESTED",
  INVITATION_ACCEPTED: "INVITATION_ACCEPTED",
  INVITATION_DECLINED: "INVITATION_DECLINED",
  SIGNATURE_INTENT_CONFIRMED: "SIGNATURE_INTENT_CONFIRMED",
  PARTY_SIGNED: "PARTY_SIGNED",
  WITNESS_INVITED: "WITNESS_INVITED",
  WITNESS_OPENED: "WITNESS_OPENED",
  WITNESS_VERIFIED: "WITNESS_VERIFIED",
  WITNESS_ATTESTED: "WITNESS_ATTESTED",
  WITNESS_REVOKED: "WITNESS_REVOKED",
  WITNESS_SUPERSEDED: "WITNESS_SUPERSEDED",
  DEAL_EXECUTED: "DEAL_EXECUTED",
  DEAL_COMPLETED: "DEAL_COMPLETED",
  DEAL_CANCELLED: "DEAL_CANCELLED",
  DEAL_VOIDED: "DEAL_VOIDED",
  PAYMENT_RECORDED: "PAYMENT_RECORDED",
  RECEIPT_ATTACHED: "RECEIPT_ATTACHED",
  OBLIGATION_CREATED: "OBLIGATION_CREATED",
  OBLIGATION_COMPLETED: "OBLIGATION_COMPLETED",
  OBLIGATION_DISPUTED: "OBLIGATION_DISPUTED",
  EVIDENCE_PACK_GENERATED: "EVIDENCE_PACK_GENERATED",
  SEAL_REVOKED: "SEAL_REVOKED",
  ADMIN_ACTION: "ADMIN_ACTION",
} as const;

export const EVENT_LABEL: Record<string, string> = {
  DEAL_CREATED: "Deal created",
  DOCUMENT_VERSION_CREATED: "Document version created",
  INVITATION_CREATED: "Invitation created",
  PARTY_INVITED: "Party invited",
  INVITATION_DELIVERED: "Invitation delivered",
  INVITATION_OPENED: "Invitation opened",
  CONTACT_VERIFIED: "Contact verified",
  DOCUMENT_VIEWED: "Document viewed",
  COMMENT_ADDED: "Comment added",
  CHANGE_REQUESTED: "Change requested",
  INVITATION_ACCEPTED: "Invitation accepted",
  INVITATION_DECLINED: "Invitation declined",
  SIGNATURE_INTENT_CONFIRMED: "Signature intent confirmed",
  PARTY_SIGNED: "Party signed",
  DEAL_EXECUTED: "Deal fully executed",
  DEAL_COMPLETED: "Deal completed",
  DEAL_CANCELLED: "Deal cancelled",
  DEAL_VOIDED: "Deal voided",
  PAYMENT_RECORDED: "Payment recorded",
  RECEIPT_ATTACHED: "Receipt attached",
  OBLIGATION_CREATED: "Obligation created",
  OBLIGATION_COMPLETED: "Obligation completed",
  OBLIGATION_DISPUTED: "Obligation marked disputed",
  EVIDENCE_PACK_GENERATED: "Evidence pack generated",
  SEAL_REVOKED: "Seal revoked",
  ADMIN_ACTION: "Administrative action",
};

export const DEAL_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  AWAITING_COUNTERPARTY: "Awaiting other party",
  UNDER_REVIEW: "Under review",
  CHANGE_REQUESTED: "Change requested",
  AWAITING_CREATOR_SIGNATURE: "Awaiting creator signature",
  AWAITING_OTHER_SIGNATURES: "Awaiting signatures",
  AWAITING_WITNESSES: "Awaiting witnesses",
  EXECUTED: "Executed",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  VOIDED: "Voided",
  SUPERSEDED: "Superseded",
};

export const PAYMENT_METHODS = [
  "Bank transfer",
  "Cash",
  "Mobile money / USSD",
  "Card",
  "Cheque",
  "Other",
];

export const OTP_PURPOSE = {
  SIGNUP_EMAIL: "signup_email",
  INVITE_VERIFY: "invite_verify",
  WITNESS_VERIFY: "witness_verify",
  PHONE_VERIFY: "phone_verify",
  PASSWORD_RESET: "password_reset",
} as const;
