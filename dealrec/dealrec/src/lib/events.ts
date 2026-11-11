import type { Prisma } from "@prisma/client";
import { sha256 } from "./crypto";

type EventClient = Pick<Prisma.TransactionClient, "dealEvent">;

export type EventInput = {
  dealId: string;
  eventType: string;
  description: string;
  actorPartyId?: string | null;
  metadata?: Record<string, unknown>;
};

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

export async function appendEvent(client: EventClient, input: EventInput) {
  const previous = await client.dealEvent.findFirst({
    where: { dealId: input.dealId },
    orderBy: { sequence: "desc" },
    select: { sequence: true, eventHash: true },
  });

  const sequence = (previous?.sequence ?? 0) + 1;
  const previousEventHash = previous?.eventHash ?? null;
  const createdAt = new Date();
  const metadataJson = stableStringify(input.metadata ?? {});

  const eventHash = sha256(
    stableStringify({
      dealId: input.dealId,
      sequence,
      eventType: input.eventType,
      description: input.description,
      actorPartyId: input.actorPartyId ?? null,
      metadata: JSON.parse(metadataJson),
      createdAt: createdAt.toISOString(),
      previousEventHash,
    }),
  );

  return client.dealEvent.create({
    data: {
      dealId: input.dealId,
      sequence,
      eventType: input.eventType,
      description: input.description,
      actorPartyId: input.actorPartyId ?? null,
      metadataJson,
      createdAt,
      previousEventHash,
      eventHash,
    },
  });
}

export async function verifyEventChain(dealId: string) {
  const { db } = await import("./db");
  const events = await db.dealEvent.findMany({
    where: { dealId },
    orderBy: { sequence: "asc" },
  });

  let previousEventHash: string | null = null;
  let previousSequence = 0;

  for (const event of events) {
    if (event.sequence !== previousSequence + 1) {
      return { valid: false, reason: `Missing event sequence ${previousSequence + 1}` };
    }
    if ((event.previousEventHash ?? null) !== previousEventHash) {
      return { valid: false, reason: `Broken hash link at event ${event.sequence}` };
    }
    const expected = sha256(
      stableStringify({
        dealId: event.dealId,
        sequence: event.sequence,
        eventType: event.eventType,
        description: event.description,
        actorPartyId: event.actorPartyId,
        metadata: JSON.parse(event.metadataJson || "{}"),
        createdAt: event.createdAt.toISOString(),
        previousEventHash: event.previousEventHash,
      }),
    );
    if (expected !== event.eventHash) {
      return { valid: false, reason: `Event ${event.sequence} hash does not match` };
    }
    previousEventHash = event.eventHash;
    previousSequence = event.sequence;
  }

  return { valid: true, count: events.length };
}
