import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyAccountForm } from "@/components/auth/verify-account-form";

export const metadata = { title: "Verify your email" };

export default async function VerifyAccountPage() {
  const user = await requireUser();
  if (user.emailVerifiedAt) redirect("/dashboard");

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${user.email}. Verify it to create and sign deals.`}
    >
      <VerifyAccountForm />
    </AuthShell>
  );
}
