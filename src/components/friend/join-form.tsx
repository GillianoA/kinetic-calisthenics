"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Link2, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { invitationCodeSchema } from "@/lib/validation";

const formSchema = z.object({ code: invitationCodeSchema });
type FormValues = z.infer<typeof formSchema>;

export function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: searchParams.get("code") ?? "" },
  });

  const submit = async (values: FormValues) => {
    const response = await fetch("/api/friends/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      toast.error("Couldn’t connect", { description: result.error });
      return;
    }
    toast.success("Accountability partner connected");
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold">Invitation code</span>
        <div className="relative">
          <Link2
            className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"
            size={18}
            aria-hidden="true"
          />
          <input
            className="field pl-12 font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(errors.code)}
            {...register("code")}
          />
        </div>
        {errors.code && (
          <p className="mt-1.5 text-sm font-medium text-rose-600" role="alert">
            {errors.code.message}
          </p>
        )}
      </label>
      <button className="button-primary w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
        ) : (
          <CheckCircle2 size={18} aria-hidden="true" />
        )}
        Connect accounts
      </button>
    </form>
  );
}
