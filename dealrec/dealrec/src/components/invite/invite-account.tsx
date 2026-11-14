"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, CheckCircle2, Link2, LogIn, UserPlus } from "lucide-react";
import { createInvitationAccountAction, claimInvitationAction } from "@/server/actions/invite";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Field, Input } from "@/components/ui/field";
import { buttonStyles } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionMessage } from "@/components/ui/action-message";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

type AccountMode = "signedOut" | "linked" | "linkedOther" | "claimable" | "mismatch";

export function InviteAccount({
  token,
  dealId,
  contact,
  email,
  defaultName,
  verified,
  emailAccountReady,
  emailAccountExists,
  mode,
}: {
  token: string;
  dealId: string;
  contact: string;
  email?: string | null;
  defaultName: string;
  verified: boolean;
  emailAccountReady: boolean;
  emailAccountExists: boolean;
  mode: AccountMode;
}) {
  const [createState, createAction] = useActionState(createInvitationAccountAction, null);
  const [claimState, claimAction] = useActionState(claimInvitationAction, null);
  const next = `/invite/${token}`;
  const authQuery = new URLSearchParams({ next });
  if (email) authQuery.set("email", email);
  const signInHref = `/sign-in?${authQuery.toString()}`;
  const signUpHref = `/sign-up?${authQuery.toString()}`;
  const forgotQuery = new URLSearchParams({ next });
  if (email) forgotQuery.set("email", email);
  const forgotHref = `/forgot-password?${forgotQuery.toString()}`;

  if (mode === "linked") {
    return (
      <Card className="border-brand-200 bg-brand-50">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
            <div>
              <p className="text-[13px] font-bold text-brand-900">Linked to your account</p>
              <p className="mt-0.5 text-[12px] leading-5 text-brand-800/80">
                This agreement is already available in your dashboard.
              </p>
            </div>
          </div>
          <Link href={`/deals/${dealId}`} className={buttonStyles({ size: "sm" })}>
            Open deal workspace
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </CardBody>
      </Card>
    );
  }

  if (mode !== "signedOut" && mode !== "claimable" && mode !== "linkedOther" && mode !== "mismatch") {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Link2 className="h-4 w-4 text-brand-600" aria-hidden />
            Keep access to this deal
          </span>
        }
        description="An account lets you return to this agreement, comment, record payments and manage obligations."
      />
      <CardBody className="space-y-3">
        <ActionMessage state={createState} />

        {mode === "signedOut" ? (
          <>
            {!verified ? (
              <p className="text-[12px] leading-5 text-ink-600">
                Verify <span className="font-semibold text-ink-800">{contact}</span> above first. You
                can review and sign with this link, then create an account here without another code.
              </p>
            ) : emailAccountReady ? (
              emailAccountExists ? (
                <div className="space-y-3">
                  <p className="text-[12px] leading-5 text-ink-600">
                    This email already has a dealrec account. Sign in and we will link this deal
                    automatically.
                  </p>
                  <SignInForm
                    next={next}
                    email={email ?? undefined}
                    lockEmail
                    forgotHref={forgotHref}
                  />
                </div>
              ) : (
                <form action={createAction} className="space-y-3">
                  <input type="hidden" name="token" value={token} />
                  <p className="text-[12px] leading-5 text-ink-600">
                    Your email is already verified by this invitation. Set a password to save this
                    deal to your account.
                  </p>
                  <Field label="Your full name" htmlFor="inviteFullName" required>
                    <Input
                      id="inviteFullName"
                      name="fullName"
                      autoComplete="name"
                      defaultValue={defaultName}
                      maxLength={120}
                      required
                    />
                  </Field>
                  <Field label="Email address" htmlFor="inviteEmail" required>
                    <Input
                      id="inviteEmail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      defaultValue={email ?? ""}
                      readOnly
                    />
                  </Field>
                  <Field
                    label="Create a password"
                    htmlFor="invitePassword"
                    required
                    hint="At least 8 characters. Use a mix of letters and numbers."
                  >
                    <Input
                      id="invitePassword"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </Field>
                  <SubmitButton className="w-full" pendingLabel="Creating account...">
                    Create account and continue
                  </SubmitButton>
                  <p className="text-[11px] leading-5 text-ink-500">
                    Already have an account with this email?{" "}
                    <Link href={signInHref} className="font-semibold text-brand-700 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              )
            ) : (
              <>
                <p className="text-[12px] leading-5 text-ink-600">
                  Sign in or create an account using{" "}
                  <span className="font-semibold text-ink-800">{contact}</span>. Once that contact is
                  verified, this deal is added to your dashboard automatically.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={signInHref} className={buttonStyles({ size: "sm" })}>
                    <LogIn className="h-4 w-4" aria-hidden />
                    Sign in
                  </Link>
                  <Link href={signUpHref} className={buttonStyles({ variant: "outline", size: "sm" })}>
                    <UserPlus className="h-4 w-4" aria-hidden />
                    Create an account
                  </Link>
                </div>
                <p className="text-[11px] leading-5 text-ink-500">
                  Use the same email or phone this invitation was sent to. You will return here after
                  signing in.
                </p>
              </>
            )}
          </>
        ) : null}

        {mode === "claimable" ? (
          <>
            <p className="text-[12px] leading-5 text-ink-600">
              Your verified account contact matches this invitation. Link it now to open the deal from
              your workspace.
            </p>
            <form action={claimAction}>
              <input type="hidden" name="token" value={token} />
              <ActionMessage state={claimState} />
              <SubmitButton size="sm" pendingLabel="Linking...">
                Link this deal to my account
              </SubmitButton>
            </form>
          </>
        ) : null}

        {mode === "linkedOther" ? (
          <p className="text-[12px] leading-5 text-ink-600">
            This invitation is already linked to another dealrec account. Sign in with the account that
            claimed it to manage the deal.
          </p>
        ) : null}

        {mode === "mismatch" ? (
          <>
            <p className="text-[12px] leading-5 text-ink-600">
              Your current account does not have the verified email or phone this invitation was sent to
              (<span className="font-semibold text-ink-800">{contact}</span>). Add and verify that contact
              in your profile, or sign in with the matching account.
            </p>
            <Link href="/profile" className={buttonStyles({ variant: "outline", size: "sm" })}>
              Open profile
            </Link>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
