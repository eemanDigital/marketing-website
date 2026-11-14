import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; next?: string; email?: string }>;
}) {
  const user = await getSessionUser();
  const { reset, next: rawNext, email: rawEmail } = await searchParams;
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
  const signUpHref = query.toString() ? `/sign-up?${query.toString()}` : "/sign-up";
  const forgotHref = query.toString() ? `/forgot-password?${query.toString()}` : "/forgot-password";

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        next?.startsWith("/invite/")
          ? "Sign in to return to your invitation and keep access to the deal."
          : "Sign in to see your deals, payments and pending signatures."
      }
      footer={
        <>
          New to dealrec?{" "}
          <Link href={signUpHref} className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm reset={reset === "1"} next={next} email={email} forgotHref={forgotHref} />
    </AuthShell>
  );
}
