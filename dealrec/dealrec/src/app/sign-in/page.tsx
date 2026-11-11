import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  const { reset } = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your deals, payments and pending signatures."
      footer={
        <>
          New to dealrec?{" "}
          <Link href="/sign-up" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm reset={reset === "1"} />
    </AuthShell>
  );
}
