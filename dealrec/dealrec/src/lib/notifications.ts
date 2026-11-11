import { db } from "./db";
import { sendEmail, sendSms } from "./mail";

type NotificationInput = {
  type: string;
  title: string;
  body: string;
  dealId?: string | null;
};

export async function notifyUser(userId: string, input: NotificationInput) {
  return db.notification.create({
    data: {
      userId,
      dealId: input.dealId ?? null,
      type: input.type,
      channel: "IN_APP",
      title: input.title,
      body: input.body,
    },
  });
}

export async function notifyParty(partyId: string, input: NotificationInput) {
  return db.notification.create({
    data: {
      partyId,
      dealId: input.dealId ?? null,
      type: input.type,
      channel: "IN_APP",
      title: input.title,
      body: input.body,
    },
  });
}

export async function notifyDealParties(
  dealId: string,
  input: NotificationInput & { excludePartyId?: string; email?: boolean },
) {
  const parties = await db.dealParty.findMany({ where: { dealId } });
  const created = [];

  for (const party of parties) {
    if (input.excludePartyId && party.id === input.excludePartyId) continue;
    if (party.userId) {
      created.push(await notifyUser(party.userId, input));
    } else {
      created.push(await notifyParty(party.id, input));
    }
    if (input.email && party.email) {
      await sendEmail({
        to: party.email,
        subject: `dealrec: ${input.title}`,
        html: `<p>${input.body}</p><p style="color:#64748b;font-size:13px">Open your dealrec account or invitation link to view the full record.</p>`,
        text: input.body,
      });
    }
  }

  return created;
}

export async function notifyDealPartiesSms(
  dealId: string,
  message: string,
  excludePartyId?: string,
) {
  const parties = await db.dealParty.findMany({ where: { dealId } });
  for (const party of parties) {
    if (excludePartyId && party.id === excludePartyId) continue;
    if (party.phoneNumber) await sendSms(party.phoneNumber, message);
  }
}
