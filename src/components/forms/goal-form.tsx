"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useUnitPreference } from "@/components/unit-preference-provider";
import { GlassCard, PageHeader } from "@/components/ui/primitives";
import { localDateInputValue } from "@/lib/local-date";
import {
  displayWeightToKilograms,
  storedWeightToDisplay,
  weightUnit,
} from "@/lib/units";

const numeric = z.preprocess(
  (value) => Number(value),
  z.number({ error: "Enter a valid number" }).finite("Enter a valid number"),
);
const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().uuid().optional(),
);
const schema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Use at least 2 characters")
      .max(140, "Use 140 characters or fewer"),
    goalType: z.enum([
      "repetitions",
      "hold_time",
      "workout_frequency",
      "workout_count",
      "added_weight",
      "skill",
      "body_measurement",
      "custom",
    ]),
    exerciseLibraryId: optionalUuid,
    skillId: optionalUuid,
    startingValue: numeric,
    targetValue: numeric.refine((value) => value > 0, "Target must be positive"),
    currentValue: numeric,
    unit: z.string().trim().max(30, "Use 30 characters or fewer").optional(),
    startDate: z.string().min(1, "Choose a start date"),
    targetDate: z.string().optional(),
    status: z.enum(["active", "paused", "completed", "cancelled"]),
    notes: z.string().trim().max(3000, "Use 3,000 characters or fewer").optional(),
    visibility: z.enum(["private", "partner"]),
    trackingMode: z.enum(["automatic", "manual"]),
  })
  .refine((value) => !value.targetDate || value.targetDate >= value.startDate, {
    message: "Target date must follow the start date",
    path: ["targetDate"],
  })
  .superRefine((value, context) => {
    if (value.trackingMode !== "automatic") return;

    if (["body_measurement", "custom"].includes(value.goalType)) {
      context.addIssue({
        code: "custom",
        message: "This goal type supports manual tracking only",
        path: ["trackingMode"],
      });
    }

    if (["repetitions", "hold_time", "added_weight"].includes(value.goalType)) {
      const bindingCount = Number(Boolean(value.exerciseLibraryId)) + Number(Boolean(value.skillId));
      if (bindingCount !== 1) {
        context.addIssue({
          code: "custom",
          message: "Choose exactly one exercise or skill",
          path: ["exerciseLibraryId"],
        });
      }
    }

    if (value.goalType === "skill") {
      if (!value.skillId) {
        context.addIssue({
          code: "custom",
          message: "Choose a skill",
          path: ["skillId"],
        });
      }
      if (value.targetValue !== 1) {
        context.addIssue({
          code: "custom",
          message: "Automatic skill milestones use a target value of 1",
          path: ["targetValue"],
        });
      }
    }
  });

type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;
export type GoalCatalogOption = { id: string; name: string };

export function GoalForm({
  goalId,
  initialValues,
  exerciseOptions = [],
  skillOptions = [],
}: {
  goalId?: string;
  initialValues?: Partial<Input>;
  exerciseOptions?: GoalCatalogOption[];
  skillOptions?: GoalCatalogOption[];
}) {
  const router = useRouter();
  const unitPreference = useUnitPreference();
  const today = localDateInputValue();
  const displayInitialValues: Partial<Input> =
    initialValues?.goalType === "added_weight"
      ? {
          ...initialValues,
          startingValue: storedWeightToDisplay(
            Number(initialValues.startingValue ?? 0),
            String(initialValues.unit ?? "kg"),
            unitPreference,
            3,
          ),
          targetValue: storedWeightToDisplay(
            Number(initialValues.targetValue ?? 0),
            String(initialValues.unit ?? "kg"),
            unitPreference,
            3,
          ),
          currentValue: storedWeightToDisplay(
            Number(initialValues.currentValue ?? 0),
            String(initialValues.unit ?? "kg"),
            unitPreference,
            3,
          ),
          unit: weightUnit(unitPreference),
        }
      : initialValues ?? {};
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
      goalType: "repetitions",
      exerciseLibraryId: "",
      skillId: "",
      startingValue: 0,
      targetValue: 10,
      currentValue: 0,
      unit: "reps",
      startDate: today,
      targetDate: "",
      status: "active",
      notes: "",
      visibility: "partner",
      trackingMode: "manual",
      ...displayInitialValues,
    },
  });
  const goalType = useWatch({ control, name: "goalType" }) ?? "repetitions";
  const trackingMode = useWatch({ control, name: "trackingMode" }) ?? "manual";
  const recordGoal = ["repetitions", "hold_time", "added_weight"].includes(goalType);
  const automaticSupported = !["body_measurement", "custom"].includes(goalType);
  const needsBinding = trackingMode === "automatic" && (recordGoal || goalType === "skill");
  const fixedUnit =
    goalType === "repetitions"
      ? "reps"
      : goalType === "hold_time"
        ? "seconds"
        : goalType === "workout_frequency"
          ? "workouts/week"
          : goalType === "workout_count"
            ? "workouts"
            : goalType === "added_weight"
              ? weightUnit(unitPreference)
              : goalType === "skill"
                ? "skill"
                : null;
  const exerciseRegistration = register("exerciseLibraryId");
  const skillRegistration = register("skillId");
  const previousGoalType = useRef(goalType);

  useEffect(() => {
    if (
      previousGoalType.current !== goalType &&
      ["body_measurement", "custom"].includes(goalType)
    ) {
      setValue("unit", "", { shouldValidate: true });
    }
    previousGoalType.current = goalType;
    if (fixedUnit) {
      setValue("unit", fixedUnit, { shouldValidate: true });
    }
    if (!automaticSupported && trackingMode === "automatic") {
      setValue("trackingMode", "manual", { shouldValidate: true });
    }
    if (trackingMode === "automatic" && goalType === "skill") {
      setValue("targetValue", 1, { shouldValidate: true });
      setValue("unit", "skill");
      setValue("exerciseLibraryId", "");
    }
    if (trackingMode === "automatic" && ["workout_count", "workout_frequency"].includes(goalType)) {
      setValue("exerciseLibraryId", "");
      setValue("skillId", "");
    }
  }, [automaticSupported, fixedUnit, goalType, setValue, trackingMode]);

  const submit = async (values: Output) => {
    const storageValues =
      values.goalType === "added_weight"
        ? {
            ...values,
            startingValue: displayWeightToKilograms(
              values.startingValue,
              unitPreference,
            ),
            targetValue: displayWeightToKilograms(
              values.targetValue,
              unitPreference,
            ),
            currentValue: displayWeightToKilograms(
              values.currentValue,
              unitPreference,
            ),
            unit: "kg",
          }
        : values;
    const response = await fetch(goalId ? `/api/goals/${goalId}` : "/api/goals", {
      method: goalId ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(storageValues),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      toast.error("Goal could not be saved", { description: result.error });
      throw new Error(result.error ?? "Save failed");
    }
    toast.success(goalId ? "Goal updated" : "Goal created");
    router.push("/goals");
    router.refresh();
  };
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Goal"
        title={goalId ? "Update your target" : "Set a clear target"}
        description="Use automatic tracking for metrics Kinetic can derive from logged workouts, or update progress manually."
      />
      <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        <GlassCard className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <Label
            title="Goal title"
            className="sm:col-span-2"
            error={errors.title?.message}
            errorId="goal-title-error"
          >
            <input
              className="field"
              placeholder="Hold an L-sit for 20 seconds"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "goal-title-error" : undefined}
              {...register("title")}
            />
          </Label>
          <Label title="Goal type">
            <select className="field" {...register("goalType")}>
              <option value="repetitions">Repetitions</option>
              <option value="hold_time">Hold time</option>
              <option value="workout_frequency">Weekly frequency</option>
              <option value="workout_count">Workout count</option>
              <option value="added_weight">Added weight</option>
              <option value="skill">Skill milestone</option>
              <option value="body_measurement">Body measurement</option>
              <option value="custom">Custom</option>
            </select>
          </Label>
          <Label title="Unit" error={errors.unit?.message} errorId="goal-unit-error">
            <input
              className="field"
              placeholder={`reps, seconds, ${weightUnit(unitPreference)}…`}
              readOnly={Boolean(fixedUnit)}
              aria-invalid={Boolean(errors.unit)}
              aria-describedby={errors.unit ? "goal-unit-error" : undefined}
              {...register("unit")}
            />
          </Label>
          <Label
            title="Starting value"
            error={errors.startingValue?.message}
            errorId="goal-starting-value-error"
          >
            <input
              className="field"
              type="number"
              step="0.1"
              aria-invalid={Boolean(errors.startingValue)}
              aria-describedby={
                errors.startingValue ? "goal-starting-value-error" : undefined
              }
              {...register("startingValue")}
            />
          </Label>
          <Label
            title="Current value"
            error={errors.currentValue?.message}
            errorId="goal-current-value-error"
          >
            <input
              className="field"
              type="number"
              step="0.1"
              readOnly={trackingMode === "automatic"}
              aria-invalid={Boolean(errors.currentValue)}
              aria-describedby={
                [
                  trackingMode === "automatic" && "automatic-current-help",
                  errors.currentValue && "goal-current-value-error",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              {...register("currentValue")}
            />
            {trackingMode === "automatic" && (
              <span id="automatic-current-help" className="mt-1 block text-xs text-[var(--muted)]">
                Updated from qualifying logs.
              </span>
            )}
          </Label>
          <Label
            title="Target value"
            error={errors.targetValue?.message}
            errorId="goal-target-value-error"
          >
            <input
              className="field"
              type="number"
              step="0.1"
              aria-invalid={Boolean(errors.targetValue)}
              aria-describedby={
                errors.targetValue ? "goal-target-value-error" : undefined
              }
              {...register("targetValue")}
            />
          </Label>
          <Label
            title="Tracking"
            error={errors.trackingMode?.message}
            errorId="goal-tracking-error"
          >
            <select
              className="field"
              aria-invalid={Boolean(errors.trackingMode)}
              aria-describedby={
                errors.trackingMode ? "goal-tracking-error" : undefined
              }
              {...register("trackingMode")}
            >
              <option value="manual">Manual progress</option>
              <option value="automatic" disabled={!automaticSupported}>
                Automatic from logs
              </option>
            </select>
          </Label>
          {needsBinding && recordGoal && (
            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
              <Label
                title="Exercise source"
                error={errors.exerciseLibraryId?.message}
                errorId="goal-exercise-source-error"
              >
                <select
                  className="field"
                  aria-invalid={Boolean(errors.exerciseLibraryId)}
                  aria-describedby={
                    errors.exerciseLibraryId
                      ? "goal-exercise-source-error"
                      : undefined
                  }
                  {...exerciseRegistration}
                  onChange={(event) => {
                    exerciseRegistration.onChange(event);
                    if (event.target.value) {
                      setValue("skillId", "", { shouldValidate: true });
                    }
                  }}
                >
                  <option value="">Choose an exercise</option>
                  {exerciseOptions.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </select>
              </Label>
              <Label
                title="Or skill source"
                error={errors.skillId?.message}
                errorId="goal-skill-source-error"
              >
                <select
                  className="field"
                  aria-invalid={Boolean(errors.skillId)}
                  aria-describedby={
                    errors.skillId ? "goal-skill-source-error" : undefined
                  }
                  {...skillRegistration}
                  onChange={(event) => {
                    skillRegistration.onChange(event);
                    if (event.target.value) {
                      setValue("exerciseLibraryId", "", { shouldValidate: true });
                    }
                  }}
                >
                  <option value="">Choose a skill</option>
                  {skillOptions.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </Label>
              <p className="text-xs leading-5 text-[var(--muted)] sm:col-span-2">
                Choose one source. Automatic progress uses the best matching personal record
                inside the goal dates.
              </p>
            </div>
          )}
          {needsBinding && goalType === "skill" && (
            <Label
              title="Skill milestone"
              className="sm:col-span-2"
              error={errors.skillId?.message}
              errorId="goal-skill-milestone-error"
            >
              <select
                className="field"
                aria-invalid={Boolean(errors.skillId)}
                aria-describedby={
                  errors.skillId ? "goal-skill-milestone-error" : undefined
                }
                {...skillRegistration}
              >
                <option value="">Choose a skill</option>
                {skillOptions.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Reaches 1 when the selected skill is marked achieved or mastered.
              </span>
            </Label>
          )}
          <Label
            title="Start date"
            error={errors.startDate?.message}
            errorId="goal-start-date-error"
          >
            <input
              className="field"
              type="date"
              aria-invalid={Boolean(errors.startDate)}
              aria-describedby={
                errors.startDate ? "goal-start-date-error" : undefined
              }
              {...register("startDate")}
            />
          </Label>
          <Label
            title="Target date"
            error={errors.targetDate?.message}
            errorId="goal-target-date-error"
          >
            <input
              className="field"
              type="date"
              aria-invalid={Boolean(errors.targetDate)}
              aria-describedby={
                errors.targetDate ? "goal-target-date-error" : undefined
              }
              {...register("targetDate")}
            />
          </Label>
          <Label title="Status">
            <select className="field" {...register("status")}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Label>
          <Label title="Visibility">
            <select className="field" {...register("visibility")}>
              <option value="partner">Connected partner</option>
              <option value="private">Only me</option>
            </select>
          </Label>
          <Label
            title="Notes"
            className="sm:col-span-2"
            error={errors.notes?.message}
            errorId="goal-notes-error"
          >
            <textarea
              className="field min-h-28 resize-y"
              aria-invalid={Boolean(errors.notes)}
              aria-describedby={errors.notes ? "goal-notes-error" : undefined}
              {...register("notes")}
            />
          </Label>
          {Object.keys(errors).length > 0 && (
            <p className="text-sm font-medium text-rose-600 sm:col-span-2" role="alert">
              Review the goal values and dates before saving.
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
            Save goal
          </button>
        </div>
      </form>
    </div>
  );
}

function Label({
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
        <Target size={14} className="text-blue-600" aria-hidden="true" />
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
