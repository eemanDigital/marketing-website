import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { EVENT } from "./constants";
import { appendEvent } from "./events";

type VerifiedContactUser = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  phoneNumber: string | null;
  phoneVerifiedAt: Date | null;
};

type LinkableParty = {
  id: string;
  dealId: string;
  userId: string | null;
  joinedAt: Date | null;
  email: string | null;
  phoneNumber: string | null;
};

export function partyContactMatchesUser(
  party: Pick<LinkableParty, "email" | "phoneNumber">,
  user: VerifiedContactUser,
) {
  const emailMatches = Boolean(
    user.emailVerifiedAt &&
      party.email &&
      user.email &&
      party.email.toLowerCase() === user.email.toLowerCase(),
  );
  const phoneMatches = Boolean(
    user.phoneVerifiedAt &&
      party.phoneNumber &&
      user.phoneNumber &&
      party.phoneNumber === user.phoneNumber,
  );
  return emailMatches || phoneMatches;
}

async function linkParty(input: {
  party: LinkableParty;
  user: VerifiedContactUser;
  method: "verified_contact" | "invitation_claim";
  invitationId?: string;
}) {
  const { party, user, method, invitationId } = input;
  const joinedAt = party.joinedAt ?? new Date();

  return db.$transaction(async (tx) => {
    const updated = await tx.dealParty.updateMany({
      where: { id: party.id, userId: null },
      data: { userId: user.id, joinedAt },
    });
    if (updated.count === 0) return false;

    await tx.notification.updateMany({
      where: { partyId: party.id, userId: null },
      data: { userId: user.id },
    });

    await appendEvent(tx, {
      dealId: party.dealId,
      eventType: EVENT.PARTY_ACCOUNT_LINKED,
      description:
        method === "invitation_claim"
          ? "The invited party linked this agreement to their account."
          : "The invited party's verified contact was linked to their account.",
      actorPartyId: party.id,
      metadata: { method, invitationId: invitationId ?? null },
    });

    return true;
  });
}

export async function linkVerifiedParties(user: VerifiedContactUser) {
  const contacts: Prisma.DealPartyWhereInput[] = [];
  if (user.emailVerifiedAt && user.email) {
    contacts.push({ email: { equals: user.email, mode: "insensitive" } });
  }
  if (user.phoneVerifiedAt && user.phoneNumber) contacts.push({ phoneNumber: user.phoneNumber });
  if (contacts.length === 0) return 0;

  const parties = await db.dealParty.findMany({
    where: { userId: null, OR: contacts },
    select: {
      id: true,
      dealId: true,
      userId: true,
      joinedAt: true,
      email: true,
      phoneNumber: true,
    },
  });

  let linked = 0;
  for (const party of parties) {
    if (!partyContactMatchesUser(party, user)) continue;
    if (await linkParty({ party, user, method: "verified_contact" })) linked += 1;
  }
  return linked;
}

export async function claimInvitationParty(input: {
  party: LinkableParty;
  user: VerifiedContactUser;
  invitationId: string;
}) {
  const { party, user, invitationId } = input;
  if (party.userId === user.id) return true;
  if (party.userId) return false;
  if (!partyContactMatchesUser(party, user)) return false;
  return linkParty({ party, user, method: "invitation_claim", invitationId });
}
