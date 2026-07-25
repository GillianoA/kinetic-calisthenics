"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/env";
import { safeInternalPath } from "@/lib/redirects";
import { createClient } from "@/lib/supabase/client";
import {
  passwordResetRequestSchema,
  passwordUpdateSchema,
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation";
import { z } from "zod";

type ResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;

function ConfigurationNotice() {
  return (
    <div className="mb-5 rounded-2xl border border-amber-300/40 bg-amber-50/65 p-4 text-sm leading-6 text-amber-950">
      Cloud sign-in becomes active after the Supabase environment variables are
      configured. You can review the complete interface in the{" "}
      <Link href="/demo" className="font-bold underline underline-offset-2">
        live demo
      </Link>
      .
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm font-medium text-rose-600" role="alert">
      {message}
    </p>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = safeInternalPath(searchParams.get("next"));
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInInput) => {
    if (!isSupabaseConfigured) return;
    const { error } = await createClient().auth.signInWithPassword(values);
    if (error) {
      toast.error("We couldn’t sign you in", { description: error.message });
      return;
    }

    toast.success("Welcome back");
    router.replace(safeNext);
    router.refresh();
  };

  return (
    <>
      {!isSupabaseConfigured && <ConfigurationNotice />}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Email address</span>
          <input
            className="field"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </label>
        <label className="block">
          <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold">
            Password
            <Link
              href="/forgot-password"
              className="font-medium text-blue-700 hover:underline"
            >
              Forgot password?
            </Link>
          </span>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </label>
        <button
          className="button-primary w-full"
          type="submit"
          disabled={isSubmitting || !isSupabaseConfigured}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <ArrowRight size={18} aria-hidden="true" />
          )}
          Sign in
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-[var(--muted)]">
        New to Kinetic?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(safeNext)}`}
          className="font-bold text-blue-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}

export function RegisterForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [verificationEmail, setVerificationEmail] = useState<string>();
  const safeNext = safeInternalPath(nextPath);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: SignUpInput) => {
    if (!isSupabaseConfigured) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { data, error } = await createClient().auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        data: {
          display_name: values.displayName,
        },
      },
    });

    if (error) {
      toast.error("We couldn’t create your account", { description: error.message });
      return;
    }

    if (data.session) {
      router.replace(safeNext);
      router.refresh();
      return;
    }
    setVerificationEmail(values.email);
  };

  if (verificationEmail) {
    return (
      <div className="rounded-[22px] border border-emerald-300/35 bg-emerald-50/65 p-5">
        <CheckCircle2 className="text-emerald-600" size={28} aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold">Check your inbox</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-950/75">
          We sent a secure verification link to <strong>{verificationEmail}</strong>.
          Open it on any device to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <>
      {!isSupabaseConfigured && <ConfigurationNotice />}
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Display name</span>
          <input
            className="field"
            autoComplete="name"
            placeholder="How your partner will know you"
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
          />
          <FieldError message={errors.displayName?.message} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Email address</span>
          <input
            className="field"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Password</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
          <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
            At least 10 characters with upper- and lowercase letters and a number.
          </p>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Confirm password</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </label>
        <button
          className="button-primary mt-2 w-full"
          type="submit"
          disabled={isSubmitting || !isSupabaseConfigured}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <ArrowRight size={18} aria-hidden="true" />
          )}
          Create account
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(safeNext)}`}
          className="font-bold text-blue-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: ResetRequestInput) => {
    if (!isSupabaseConfigured) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });

    if (error) {
      toast.error("We couldn’t send the reset link", { description: error.message });
      return;
    }
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <div className="rounded-[22px] border border-blue-300/35 bg-blue-50/60 p-5">
        <Mail className="text-blue-700" size={28} aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold">Reset link sent</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          If an account exists for <strong>{sentTo}</strong>, its secure reset link
          will arrive shortly.
        </p>
      </div>
    );
  }

  return (
    <>
      {!isSupabaseConfigured && <ConfigurationNotice />}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Email address</span>
          <input
            className="field"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </label>
        <button
          className="button-primary w-full"
          type="submit"
          disabled={isSubmitting || !isSupabaseConfigured}
        >
          {isSubmitting && (
            <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
          )}
          Send secure reset link
        </button>
      </form>
      <Link
        href="/login"
        className="mt-6 block text-center text-sm font-bold text-blue-700 hover:underline"
      >
        Back to sign in
      </Link>
    </>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordUpdateInput>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ password }: PasswordUpdateInput) => {
    if (!isSupabaseConfigured) return;
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      toast.error("We couldn’t update your password", { description: error.message });
      return;
    }
    toast.success("Password updated");
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <>
      {!isSupabaseConfigured && <ConfigurationNotice />}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">New password</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Confirm password</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </label>
        <button
          className="button-primary w-full"
          type="submit"
          disabled={isSubmitting || !isSupabaseConfigured}
        >
          {isSubmitting && (
            <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
          )}
          Update password
        </button>
      </form>
    </>
  );
}
