import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Choose new password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use a strong password you don’t reuse anywhere else."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
