import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = { title: "Create an account" };

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start putting your everyday deals and agreements on record."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
