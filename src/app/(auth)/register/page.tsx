import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";
import { safeInternalPath } from "@/lib/redirects";

export const metadata = { title: "Create account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell
      title="Create your training space"
      description="Start privately, then invite one trusted accountability partner when you’re ready."
    >
      <RegisterForm nextPath={safeInternalPath(next)} />
    </AuthShell>
  );
}
