import { FileText, MessageSquare } from "lucide-react";
import type { FullDeal } from "@/lib/deals";
import { cn, formatDateTime, titleCase } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CommentForm } from "@/components/deals/comment-form";
import { CommentActions } from "@/components/deals/comment-actions";

const PARTY_THEMES = [
  {
    card: "border-l-brand-500 bg-brand-50/30",
    avatar: "bg-brand-600 text-white",
    badge: "border-brand-200 bg-brand-50 text-brand-800",
    dot: "bg-brand-500",
  },
  {
    card: "border-l-sky-500 bg-sky-50/40",
    avatar: "bg-sky-600 text-white",
    badge: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
  },
  {
    card: "border-l-amber-500 bg-amber-50/40",
    avatar: "bg-amber-500 text-white",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  {
    card: "border-l-violet-500 bg-violet-50/40",
    avatar: "bg-violet-600 text-white",
    badge: "border-violet-200 bg-violet-50 text-violet-800",
    dot: "bg-violet-500",
  },
] as const;

export function CommentThread({
  dealId,
  comments,
  parties,
  currentPartyId,
  isClosed,
}: {
  dealId: string;
  comments: FullDeal["comments"];
  parties: FullDeal["parties"];
  currentPartyId: string | null;
  isClosed: boolean;
}) {
  const orderedParties = [...parties].sort((a, b) => {
    if (a.isCreator !== b.isCreator) return a.isCreator ? -1 : 1;
    return a.fullName.localeCompare(b.fullName);
  });
  const usedLabels = new Set<string>();
  const identities = orderedParties.map((party) => {
    const explicit = party.role.match(/^party\s+([a-z])$/i)?.[1]?.toUpperCase();
    let letter = explicit && !usedLabels.has(explicit) ? explicit : "";
    if (!letter) {
      let code = 65;
      while (usedLabels.has(String.fromCharCode(code))) code += 1;
      letter = String.fromCharCode(code);
    }
    usedLabels.add(letter);
    return {
      ...party,
      label: `Party ${letter}`,
      theme: PARTY_THEMES[letter.charCodeAt(0) - 65] ?? PARTY_THEMES[0],
    };
  });
  const identityById = new Map(identities.map((identity) => [identity.id, identity]));
  const currentIdentity = currentPartyId ? identityById.get(currentPartyId) : undefined;

  return (
    <Card>
      <CardHeader
        title="Comments and change requests"
        description="Ask questions, clarify terms, or request a change. Both parties can see this thread."
        action={<Badge tone="neutral">{comments.length}</Badge>}
      />
      <CardBody className="space-y-4">
        {identities.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/70 px-3 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-ink-400">In this thread</span>
            {identities.map((identity) => (
              <span key={identity.id} className="inline-flex items-center gap-1.5 text-[11px] text-ink-600">
                <span className={cn("h-2 w-2 rounded-full", identity.theme.dot)} aria-hidden />
                <span className="font-semibold text-ink-800">{identity.label}</span>
                <span className="truncate">{identity.fullName}</span>
              </span>
            ))}
          </div>
        ) : null}

        {comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-5 py-8 text-center">
            <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
              <MessageSquare className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-3 text-[13px] font-semibold text-ink-800">Start the conversation</p>
            <p className="mx-auto mt-1 max-w-md text-[12px] leading-5 text-ink-500">
              Ask a question, clarify a term, or request a change before signing. Keep the thread
              factual because it becomes part of the deal record.
            </p>
          </div>
        ) : (
          <ol className="space-y-3" aria-label="Comment thread">
            {comments.map((comment) => {
              const identity = identityById.get(comment.authorParty.id);
              const theme = identity?.theme ?? PARTY_THEMES[0];
              const roleDetail =
                identity && identity.role.toLowerCase() !== identity.label.toLowerCase()
                  ? identity.role
                  : null;
              const isMine = comment.authorParty.id === currentPartyId;

              return (
                <li
                  key={comment.id}
                  className={cn("rounded-2xl border border-ink-100 border-l-4 p-3.5 sm:p-4", theme.card)}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar
                      name={comment.authorParty.fullName}
                      size="sm"
                      className={theme.avatar}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-[12px] font-bold text-ink-900">
                          {comment.authorParty.fullName}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold",
                            theme.badge,
                          )}
                        >
                          {identity?.label ?? "Party"}
                        </span>
                        {isMine ? (
                          <span className="rounded-full bg-ink-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            You
                          </span>
                        ) : null}
                        {comment.retractedAt ? (
                          <Badge tone="danger">Retracted</Badge>
                        ) : comment.editedAt ? (
                          <Badge tone="neutral">Edited</Badge>
                        ) : null}
                        {comment.kind !== "COMMENT" ? (
                          <Badge tone="warning" className="ml-auto">
                            {comment.kind === "CHANGE_REQUESTED"
                              ? "Change requested"
                              : titleCase(comment.kind)}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[10px] text-ink-400">
                        {roleDetail ? `${roleDetail} · ` : ""}
                        <time dateTime={comment.createdAt.toISOString()}>
                          {formatDateTime(comment.createdAt)}
                        </time>
                        {comment.editedAt ? ` · edited ${formatDateTime(comment.editedAt)}` : ""}
                      </p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "mt-2.5 whitespace-pre-line text-[13px] leading-6 text-ink-700",
                      comment.retractedAt && "text-ink-400 line-through decoration-red-300",
                    )}
                  >
                    {comment.message}
                  </p>
                  {comment.retractedAt ? (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-1.5 text-[11px] leading-5 text-red-800">
                      Retracted {formatDateTime(comment.retractedAt)}
                      {comment.retractionReason ? ` · ${comment.retractionReason}` : ""}. The message
                      remains in the audit record and evidence pack.
                    </div>
                  ) : null}
                  {comment.attachment ? (
                    <a
                      href={`/deals/${dealId}/documents/${comment.attachment.id}`}
                      className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 hover:border-brand-200 hover:bg-brand-50"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">
                        {comment.attachment.originalName ?? "Attachment"}
                      </span>
                    </a>
                  ) : null}
                  <CommentActions
                    dealId={dealId}
                    comment={{
                      id: comment.id,
                      message: comment.message,
                      revision: comment.revision,
                    }}
                    canManage={Boolean(isMine && !isClosed && !comment.retractedAt)}
                  />
                </li>
              );
            })}
          </ol>
        )}

        {isClosed ? (
          <div className="rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-[11px] leading-5 text-ink-500">
            This deal is closed, so new comments are disabled. The thread remains available for the
            record.
          </div>
        ) : currentIdentity ? (
          <div className="rounded-2xl border border-ink-200 bg-ink-50/50 p-3.5 sm:p-4">
            <CommentForm
              dealId={dealId}
              authorName={currentIdentity.fullName}
              authorLabel={currentIdentity.label}
              authorBadgeClassName={currentIdentity.theme.badge}
            />
          </div>
        ) : (
          <p className="rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-[11px] leading-5 text-ink-500">
            Only deal parties can add comments.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
