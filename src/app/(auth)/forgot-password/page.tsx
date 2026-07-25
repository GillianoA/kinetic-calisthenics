import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="We’ll email you a secure, time-limited link to choose a new password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
