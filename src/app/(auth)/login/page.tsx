import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue training, pick up your streak, and see your partner’s latest progress."
    >
      <Suspense fallback={<div className="skeleton h-72 rounded-2xl" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
