"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GlassCard, PageHeader } from "@/components/ui/primitives";

const schema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Use at least 2 characters")
      .max(160, "Use 160 characters or fewer"),
    description: z
      .string()
      .trim()
      .max(5000, "Use 5,000 characters or fewer")
      .optional(),
    challengeType: z.enum(["consistency", "race", "cumulative", "shared_target"]),
    metricKey: z.enum([
      "workouts_completed",
      "pull_up_repetitions",
      "handstand_hold_seconds",
      "skill_practice_seconds",
    ]),
    targetValue: z.coerce
      .number({ error: "Enter a valid target" })
      .positive("Target must be greater than zero"),
    unit: z.string().trim().min(1, "Choose a metric").max(40),
    startsOn: z.string().min(1, "Choose a start date"),
    endsOn: z.string().min(1, "Choose an end date"),
    visibility: z.literal("partner"),
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    path: ["endsOn"],
    message: "End date must follow start date",
  });
type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;
const metricDetails = {
  workouts_completed: {
    unit: "workouts",
    help: "Automatic: counts partner-visible completed workouts dated inside the challenge window.",
  },
  pull_up_repetitions: {
    unit: "reps",
    help: "Manual: each partner enters their cumulative strict pull-up repetitions.",
  },
  handstand_hold_seconds: {
    unit: "seconds",
    help: "Manual: each partner enters their cumulative handstand hold seconds.",
  },
  skill_practice_seconds: {
    unit: "seconds",
    help: "Manual: each partner enters their cumulative skill-practice time.",
  },
} as const;

export function ChallengeForm() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const nextMonthDate = new Date();
  nextMonthDate.setUTCDate(nextMonthDate.getUTCDate() + 30);
  const nextMonth = nextMonthDate.toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      challengeType: "consistency",
      metricKey: "workouts_completed",
      targetValue: 12,
      unit: "workouts",
      startsOn: today,
      endsOn: nextMonth,
      visibility: "partner",
    },
  });
  const metricKey =
    useWatch({ control, name: "metricKey" }) ?? "workouts_completed";
  useEffect(() => {
    setValue("unit", metricDetails[metricKey].unit);
  }, [metricKey, setValue]);
  const submit = async (values: Output) => {
    const response = await fetch("/api/challenges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = (await response.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
    };
    if (!response.ok) {
      toast.error("Challenge could not be created", { description: result.error });
      throw new Error(result.error ?? "Create failed");
    }
    toast.success("Shared challenge created");
    router.push(`/goals/challenges/${result.id}`);
    router.refresh();
  };
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Shared challenge"
        title="Build a shared target"
        description="Both connected partners join automatically. Workout totals sync from shared logs; practice metrics use transparent self-reported progress."
      />
      <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
        <GlassCard className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <Field
            title="Challenge title"
            className="sm:col-span-2"
            error={errors.title?.message}
            errorId="challenge-title-error"
          >
            <input
              className="field"
              placeholder="Complete 12 workouts this month"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={
                errors.title ? "challenge-title-error" : undefined
              }
              {...register("title")}
            />
          </Field>
          <Field title="Challenge style">
            <select className="field" {...register("challengeType")}>
              <option value="consistency">Consistency</option>
              <option value="race">First to target</option>
              <option value="cumulative">Cumulative progress</option>
              <option value="shared_target">Shared target</option>
            </select>
          </Field>
          <Field title="Metric">
            <select
              className="field"
              aria-describedby="challenge-metric-help"
              {...register("metricKey")}
            >
              <option value="workouts_completed">Workouts completed · automatic</option>
              <option value="pull_up_repetitions">Strict pull-up reps · manual</option>
              <option value="handstand_hold_seconds">Handstand hold seconds · manual</option>
              <option value="skill_practice_seconds">Skill-practice seconds · manual</option>
            </select>
            <span
              id="challenge-metric-help"
              className="mt-1 block text-xs leading-5 text-[var(--muted)]"
            >
              {metricDetails[metricKey].help}
            </span>
          </Field>
          <Field
            title="Target value"
            error={errors.targetValue?.message}
            errorId="challenge-target-error"
          >
            <input
              className="field"
              type="number"
              step="0.1"
              aria-invalid={Boolean(errors.targetValue)}
              aria-describedby={
                errors.targetValue ? "challenge-target-error" : undefined
              }
              {...register("targetValue")}
            />
          </Field>
          <Field title="Unit">
            <input className="field" readOnly {...register("unit")} />
          </Field>
          <Field
            title="Starts"
            error={errors.startsOn?.message}
            errorId="challenge-start-error"
          >
            <input
              className="field"
              type="date"
              aria-invalid={Boolean(errors.startsOn)}
              aria-describedby={
                errors.startsOn ? "challenge-start-error" : undefined
              }
              {...register("startsOn")}
            />
          </Field>
          <Field
            title="Ends"
            error={errors.endsOn?.message}
            errorId="challenge-end-error"
          >
            <input
              className="field"
              type="date"
              aria-invalid={Boolean(errors.endsOn)}
              aria-describedby={
                errors.endsOn ? "challenge-end-error" : undefined
              }
              {...register("endsOn")}
            />
          </Field>
          <Field
            title="Description"
            className="sm:col-span-2"
            error={errors.description?.message}
            errorId="challenge-description-error"
          >
            <textarea
              className="field min-h-28 resize-y"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "challenge-description-error" : undefined
              }
              {...register("description")}
            />
          </Field>
          {Object.keys(errors).length > 0 && (
            <p className="text-sm font-medium text-rose-600 sm:col-span-2" role="alert">
              Review the challenge values and dates.
            </p>
          )}
        </GlassCard>
        <div className="flex justify-end gap-3">
          <button type="button" className="button-secondary" onClick={() => router.back()}>
            Cancel
          </button>
          <button type="submit" className="button-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
            ) : (
              <Save size={17} aria-hidden="true" />
            )}
            Create challenge
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  title,
  children,
  className = "",
  error,
  errorId,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
  errorId?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Users size={14} className="text-blue-600" aria-hidden="true" />
        {title}
      </span>
      {children}
      {error ? (
        <span
          id={errorId}
          className="mt-1.5 block text-xs font-medium text-rose-600 dark:text-rose-300"
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}
