import Link from "next/link";
import { BadgeCheck, LogOut, MailCheck, ShieldCheck, Smartphone } from "lucide-react";
import { getSessionsForUser, requireUser } from "@/lib/auth";
import { formatDateTime, maskPhone } from "@/lib/utils";
import { logoutAllAction } from "@/server/actions/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile/profile-form";
import { PhoneVerify } from "@/components/profile/phone-verify";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const sessions = await getSessionsForUser(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Profile & security</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Keep your contact details accurate. They appear on deals you create and help verify signing.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Your details" description="Changes are reflected on future deal records." />
          <CardBody>
            <ProfileForm fullName={user.fullName} phoneNumber={user.phoneNumber} email={user.email} />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Verification" description="One-time codes prove control of a contact channel." />
            <CardBody className="space-y-4">
              <div className="flex items-start justify-between gap-3 rounded-xl border border-ink-100 p-3">
                <div className="flex gap-3">
                  <MailCheck className="mt-0.5 h-4 w-4 text-ink-500" aria-hidden />
                  <div>
                    <p className="text-[12px] font-semibold text-ink-800">Email</p>
                    <p className="text-[11px] text-ink-500">{user.email}</p>
                  </div>
                </div>
                {user.emailVerifiedAt ? <Badge tone="success">Verified</Badge> : (
                  <Link href="/verify-account" className="text-[11px] font-semibold text-brand-700">Verify</Link>
                )}
              </div>

              <div className="rounded-xl border border-ink-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <Smartphone className="mt-0.5 h-4 w-4 text-ink-500" aria-hidden />
                    <div>
                      <p className="text-[12px] font-semibold text-ink-800">Phone</p>
                      <p className="text-[11px] text-ink-500">
                        {user.phoneNumber ? maskPhone(user.phoneNumber) : "Not added"}
                      </p>
                    </div>
                  </div>
                  {user.phoneVerifiedAt ? <Badge tone="success">Verified</Badge> : <Badge tone="neutral">Unverified</Badge>}
                </div>
                <div className="mt-3">
                  <PhoneVerify hasPhone={Boolean(user.phoneNumber)} />
                </div>
              </div>

              <p className="text-[10px] leading-4 text-ink-400">
                Verification proves control of the contact at that time. It is not a national identity
                verification or a guarantee that the person is who they claim to be.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Active sessions" description={`${sessions.length} current session${sessions.length === 1 ? "" : "s"}`} />
            <CardBody className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2">
                  <div>
                    <p className="text-[11px] font-semibold text-ink-800">
                      {session.ipAddress ?? "Unknown IP"}
                    </p>
                    <p className="text-[10px] text-ink-400">{formatDateTime(session.createdAt)}</p>
                  </div>
                  <Badge tone="neutral">Active</Badge>
                </div>
              ))}
              <form action={logoutAllAction}>
                <button type="submit" className={buttonStyles({ variant: "outline", size: "sm", className: "w-full" })}>
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Sign out other sessions
                </button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>

      <Alert tone="info" title="Your data">
        dealrec stores your account details, deal records, signatures, comments and audit events. Do not
        upload sensitive information that is not needed for the agreement. For deletion or correction
        requests, contact the platform administrator.
      </Alert>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3 text-[12px] text-ink-500">
          <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden />
          Signed in as <span className="font-semibold text-ink-800">{user.fullName}</span>
          {user.isAdmin ? <Badge tone="brand"><BadgeCheck className="h-3 w-3" aria-hidden /> Admin</Badge> : null}
          {user.isAdmin ? <Link href="/admin" className="font-semibold text-brand-700">Open admin</Link> : null}
        </CardBody>
      </Card>
    </div>
  );
}
