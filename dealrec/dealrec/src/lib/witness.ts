import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { sha256 } from "./crypto";
import { DEAL_STATUS, WITNESS_STATUS } from "./constants";

export const witnessInclude = {
  witnessedParty: true,
  addedByParty: true,
  document: true,
  deal: {
    include: {
      creator: true,
      parties: true,
      documents: { orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }] },
      signatures: { include: { party: true } },
    },
  },
} satisfies Prisma.DealWitnessInclude;

export type WitnessRecord = NonNullable<Awaited<ReturnType<typeof findWitness>>>;

export async function findWitness(token: string) {
  if (!token) return null;
  return db.dealWitness.findUnique({
    where: { tokenHash: sha256(token) },
    include: witnessInclude,
  });
}

export function witnessProblem(witness: WitnessRecord) {
  if (witness.revokedAt || witness.status === WITNESS_STATUS.REVOKED) {
    return "This witness link has been revoked.";
  }
  if (witness.status === WITNESS_STATUS.SUPERSEDED) {
    return "A newer document version replaced the version this witness was invited to attest.";
  }
  if (witness.expiresAt.getTime() < Date.now()) {
    return "This witness link has expired. Ask the inviting party to send a new link.";
  }
  if ([DEAL_STATUS.CANCELLED, DEAL_STATUS.VOIDED].includes(witness.deal.status as never)) {
    return "This deal is no longer open.";
  }
  if (!witness.document || witness.document.versionNumber !== witness.deal.currentVersion) {
    return "The document version this witness was invited to attest is no longer current.";
  }
  return null;
}

export function witnessChannel(witness: WitnessRecord) {
  if (witness.email) return { channel: "email" as const, target: witness.email };
  if (witness.phoneNumber) return { channel: "phone" as const, target: witness.phoneNumber };
  return null;
}

export function witnessedPartySigned(witness: WitnessRecord) {
  if (!witness.document) return false;
  return witness.deal.signatures.some(
    (signature) =>
      signature.documentId === witness.document?.id &&
      signature.partyId === witness.witnessedPartyId,
  );
}

export function witnessCanAttest(witness: WitnessRecord) {
  return (
    !witnessProblem(witness) &&
    witness.status !== WITNESS_STATUS.ATTESTED &&
    witnessedPartySigned(witness) &&
    witness.deal.status !== DEAL_STATUS.EXECUTED
  );
}
