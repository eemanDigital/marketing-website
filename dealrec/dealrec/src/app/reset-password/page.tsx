import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter the reset code we sent and choose a new password."
      footer={
        <>
          Need a new code?{" "}
          <Link href="/forgot-password" className="font-semibold text-brand-700 hover:underline">
            Request another
          </Link>
        </>
      }
    >
      <ResetPasswordForm email={email ?? ""} />
    </AuthShell>
  );
}
