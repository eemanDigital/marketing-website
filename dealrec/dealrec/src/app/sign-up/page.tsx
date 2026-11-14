import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = { title: "Create an account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string }>;
}) {
  const user = await getSessionUser();
  const { next: rawNext, email: rawEmail } = await searchParams;
  const next = safeNextPath(rawNext);
  const email = typeof rawEmail === "string" ? rawEmail.trim() : undefined;
  if (user) {
    if (!user.emailVerifiedAt && next) {
      redirect(`/verify-account?next=${encodeURIComponent(next)}`);
    }
    redirect(next ?? "/dashboard");
  }

  const query = new URLSearchParams();
  if (next) query.set("next", next);
  if (email) query.set("email", email);
  const signInHref = query.toString() ? `/sign-in?${query.toString()}` : "/sign-in";

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        next?.startsWith("/invite/")
          ? "Use the same email the invitation was sent to so the deal is linked to your account."
          : "Start putting your everyday deals and agreements on record."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href={signInHref} className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm next={next} email={email} />
    </AuthShell>
  );
}
