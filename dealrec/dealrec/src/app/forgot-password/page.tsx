import Link from "next/link";
import { safeNextPath } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email: rawEmail, next: rawNext } = await searchParams;
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const next = safeNextPath(rawNext);
  const query = new URLSearchParams();
  if (email) query.set("email", email);
  if (next) query.set("next", next);
  const signInHref = query.toString() ? `/sign-in?${query.toString()}` : "/sign-in";

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address on your account and we will send a reset code."
      footer={
        <>
          Remembered it?{" "}
          <Link href={signInHref} className="font-semibold text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm initialEmail={email} next={next} />
      <p className="mt-4 text-center text-[11px] leading-5 text-ink-500">
        Were you invited to a deal but never created an account? Open the invitation link from your
        email and create your account there. You do not need a password reset.
      </p>
    </AuthShell>
  );
}
