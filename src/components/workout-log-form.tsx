"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Control,
  Controller,
  type FieldErrors,
  useFieldArray,
  useForm,
  type UseFormRegister,
} from "react-hook-form";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  GripVertical,
  ImagePlus,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Button,
  GlassCard,
  PageHeader,
  SectionHeader,
  StatusPill,
  cn,
} from "./ui/primitives";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { useUnitPreference } from "./unit-preference-provider";
import {
  displayDistanceToMeters,
  displayWeightToKilograms,
  distanceUnit,
  floorUnit,
  kilogramsToDisplay,
  metersToDisplay,
  type UnitPreference,
  weightUnit,
} from "@/lib/units";

const optionalBounded = (max: number) =>
  z.number().min(0).max(max).optional();

function maximumDisplayedWeight(preference: UnitPreference) {
  return floorUnit(kilogramsToDisplay(1000, preference, 6), 2);
}

function maximumDisplayedDistance(preference: UnitPreference) {
  return floorUnit(metersToDisplay(1_000_000, preference, 6), 2);
}

function optionalCanonicalBound(
  max: number,
  toCanonical: (value: number) => number,
  message: string,
) {
  return z
    .number()
    .min(0)
    .refine((value) => toCanonical(value) <= max, { message })
    .optional();
}

function createWorkoutFormSchema(preference: UnitPreference) {
  const displayedWeightMaximum = maximumDisplayedWeight(preference);
  const displayedDistanceMaximum = maximumDisplayedDistance(preference);
  const workoutSetSchema = z.object({
    id: z.string().uuid().optional(),
    repetitions: z.number().int().min(0).max(10000),
    holdDuration: optionalBounded(86400),
    addedWeight: optionalCanonicalBound(
      1000,
      (value) => displayWeightToKilograms(value, preference),
      `Use no more than ${displayedWeightMaximum} ${weightUnit(preference)}.`,
    ),
    assistanceWeight: optionalCanonicalBound(
      1000,
      (value) => displayWeightToKilograms(value, preference),
      `Use no more than ${displayedWeightMaximum} ${weightUnit(preference)}.`,
    ),
    distance: optionalCanonicalBound(
      1_000_000,
      (value) => displayDistanceToMeters(value, preference),
      `Use no more than ${displayedDistanceMaximum} ${distanceUnit(preference)}.`,
    ),
    restDuration: optionalBounded(86400),
    tempo: z.string().trim().max(30).optional(),
    bandLevel: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(500).optional(),
    completed: z.boolean(),
    personalRecord: z.boolean(),
  });

  const workoutExerciseSchema = z.object({
    id: z.string().uuid().optional(),
    exerciseLibraryId: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Choose or enter an exercise."),
    category: z.string().trim().min(1, "Choose a category."),
    notes: z.string().trim().max(1000).optional(),
    sets: z
      .array(workoutSetSchema)
      .min(1, "Add at least one set.")
      .max(100, "Use no more than 100 sets per exercise."),
  });

  return z.object({
    name: z.string().trim().min(2, "Workout name is required.").max(100),
    type: z.string().min(1, "Choose a workout type."),
    date: z.string().min(1, "Choose a date."),
    startTime: z.string().min(1, "Add a start time."),
    endTime: z.string().min(1, "Add an end time."),
    status: z.enum(["completed", "planned", "skipped"]),
    visibility: z.enum(["private", "partner"]),
    difficulty: z.number().int().min(1).max(10),
    energy: z.number().int().min(1).max(10),
    location: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(1500).optional(),
    photo: z.custom<FileList>().optional(),
    removePhoto: z.boolean(),
    exercises: z
      .array(workoutExerciseSchema)
      .min(1, "Add at least one exercise.")
      .max(40),
  });
}

export const workoutFormSchema = createWorkoutFormSchema("metric");

export type WorkoutFormValues = z.infer<typeof workoutFormSchema>;
export type WorkoutSetFormValue =
  WorkoutFormValues["exercises"][number]["sets"][number];

export type WorkoutTemplate = {
  id: string;
  name: string;
  type: string;
  exercises: WorkoutFormValues["exercises"];
};

export type ExerciseCatalogItem = {
  id: string;
  name: string;
};

const emptySet: WorkoutSetFormValue = {
  repetitions: 8,
  holdDuration: 0,
  addedWeight: 0,
  assistanceWeight: 0,
  distance: 0,
  restDuration: 90,
  tempo: "",
  bandLevel: "",
  notes: "",
  completed: true,
  personalRecord: false,
};

function createSets(
  count: number,
  values: Partial<WorkoutSetFormValue> = {},
): WorkoutSetFormValue[] {
  return Array.from({ length: count }, () => ({ ...emptySet, ...values }));
}

const emptyExercise: WorkoutFormValues["exercises"][number] = {
  name: "",
  category: "Pull",
  notes: "",
  sets: createSets(3),
};

const defaultTemplates: WorkoutTemplate[] = [
  {
    id: "template-pull",
    name: "Pull strength",
    type: "Pull",
    exercises: [
      {
        ...emptyExercise,
        name: "Strict pull-up",
        category: "Pull",
        sets: createSets(5, { repetitions: 6, restDuration: 120 }),
      },
      {
        ...emptyExercise,
        name: "Advanced tuck front lever",
        category: "Skill",
        sets: createSets(5, {
          repetitions: 0,
          holdDuration: 10,
          restDuration: 90,
        }),
      },
      {
        ...emptyExercise,
        name: "Ring row",
        category: "Pull",
        sets: createSets(4, { repetitions: 10 }),
      },
    ],
  },
  {
    id: "template-push",
    name: "Push volume",
    type: "Push",
    exercises: [
      {
        ...emptyExercise,
        name: "Ring dip",
        category: "Push",
        sets: createSets(5, { repetitions: 8 }),
      },
      {
        ...emptyExercise,
        name: "Pike push-up",
        category: "Push",
        sets: createSets(4, { repetitions: 10 }),
      },
      {
        ...emptyExercise,
        name: "Diamond push-up",
        category: "Push",
        sets: createSets(3, { repetitions: 14 }),
      },
    ],
  },
];

const fieldClass =
  "focus-ring h-12 w-full rounded-2xl border border-white/65 bg-white/55 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:focus:border-cyan-400/40 dark:focus:ring-cyan-400/10";
const compactFieldClass =
  "focus-ring h-11 w-full rounded-xl border border-white/65 bg-white/55 px-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:focus:ring-cyan-400/10";

function Field({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label}
        {optional ? (
          <span className="font-normal text-slate-400">Optional</span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 block text-xs text-rose-600 dark:text-rose-300">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function ExerciseCard({
  index,
  count,
  register,
  control,
  error,
  onMove,
  onDuplicate,
  onRemove,
}: {
  index: number;
  count: number;
  register: UseFormRegister<WorkoutFormValues>;
  control: Control<WorkoutFormValues>;
  error?: FieldErrors<WorkoutFormValues["exercises"][number]>;
  onMove: (from: number, to: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const unitPreference = useUnitPreference();
  const displayedWeightUnit = weightUnit(unitPreference);
  const displayedDistanceUnit = distanceUnit(unitPreference);
  const maxDisplayedWeight = maximumDisplayedWeight(unitPreference);
  const maxDisplayedDistance = maximumDisplayedDistance(unitPreference);
  const {
    fields: setFields,
    append: appendSet,
    insert: insertSet,
    remove: removeSet,
  } = useFieldArray({
    control,
    name: `exercises.${index}.sets`,
    keyName: "fieldKey",
  });

  return (
    <article className="exercise-card rounded-[24px] border border-white/60 bg-white/42 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.78)] sm:p-5 dark:border-white/9 dark:bg-white/[0.035]">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="cursor-grab text-slate-300 dark:text-slate-600">
          <GripVertical aria-hidden className="size-5" />
        </span>
        <span className="grid size-9 place-items-center rounded-xl bg-sky-100 text-xs font-bold text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-300">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="text-sm font-semibold text-slate-950 dark:text-white">
          Exercise
        </p>
        <div className="flex w-full items-center justify-end gap-1 min-[390px]:ml-auto min-[390px]:w-auto">
          <button
            type="button"
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
            aria-label={`Move exercise ${index + 1} up`}
            className="focus-ring grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-white/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-30 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <ArrowUp aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, index + 1)}
            disabled={index === count - 1}
            aria-label={`Move exercise ${index + 1} down`}
            className="focus-ring grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-white/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-30 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <ArrowDown aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            aria-label={`Duplicate exercise ${index + 1}`}
            className="focus-ring grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-white/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <Copy aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove exercise ${index + 1}`}
            className="focus-ring grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(140px,.6fr)]">
        <Field label="Exercise name" error={error?.name?.message}>
          <input
            {...register(`exercises.${index}.name`)}
            className={fieldClass}
            placeholder="e.g. Strict pull-up"
            list="exercise-library"
          />
        </Field>
        <Field label="Category">
          <div className="relative">
            <select
              {...register(`exercises.${index}.category`)}
              className={cn(fieldClass, "appearance-none pr-10")}
            >
              <option>Push</option>
              <option>Pull</option>
              <option>Core</option>
              <option>Skill</option>
              <option>Legs</option>
              <option>Mobility</option>
              <option>Cardio</option>
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
          </div>
        </Field>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Sets
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Each row is stored independently.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => appendSet({ ...emptySet })}
            className="min-h-11 px-3 text-xs"
          >
            <Plus aria-hidden className="size-3.5" />
            Add set
          </Button>
        </div>

        {typeof error?.sets?.message === "string" ? (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
            {error.sets.message}
          </p>
        ) : null}

        {setFields.map((setField, setIndex) => {
          const setError = Array.isArray(error?.sets)
            ? error.sets[setIndex]
            : undefined;
          return (
            <section
              key={setField.fieldKey}
              className="rounded-2xl border border-slate-200/70 bg-white/35 p-3 dark:border-white/8 dark:bg-white/[0.025]"
              aria-label={`Set ${setIndex + 1}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="grid size-8 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                  {setIndex + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      insertSet(setIndex + 1, {
                        ...setField,
                        id: undefined,
                      })
                    }
                    aria-label={`Duplicate set ${setIndex + 1}`}
                    className="focus-ring grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-white/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
                  >
                    <Copy aria-hidden className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSet(setIndex)}
                    disabled={setFields.length === 1}
                    aria-label={`Remove set ${setIndex + 1}`}
                    className="focus-ring grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Field
                  label="Reps"
                  error={
                    setError && "repetitions" in setError
                      ? setError.repetitions?.message
                      : undefined
                  }
                >
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    {...register(
                      `exercises.${index}.sets.${setIndex}.repetitions`,
                      { valueAsNumber: true },
                    )}
                    className={compactFieldClass}
                  />
                </Field>
                <Field
                  label="Hold (sec)"
                  error={setError?.holdDuration?.message}
                >
                  <input
                    type="number"
                    min={0}
                    max={86400}
                    aria-invalid={Boolean(setError?.holdDuration)}
                    {...register(
                      `exercises.${index}.sets.${setIndex}.holdDuration`,
                      { valueAsNumber: true },
                    )}
                    className={compactFieldClass}
                  />
                </Field>
                <Field
                  label={`Added (${displayedWeightUnit})`}
                  error={setError?.addedWeight?.message}
                >
                  <input
                    type="number"
                    min={0}
                    max={maxDisplayedWeight}
                    step="0.01"
                    aria-invalid={Boolean(setError?.addedWeight)}
                    {...register(
                      `exercises.${index}.sets.${setIndex}.addedWeight`,
                      { valueAsNumber: true },
                    )}
                    className={compactFieldClass}
                  />
                </Field>
                <Field
                  label={`Assist (${displayedWeightUnit})`}
                  error={setError?.assistanceWeight?.message}
                >
                  <input
                    type="number"
                    min={0}
                    max={maxDisplayedWeight}
                    step="0.01"
                    aria-invalid={Boolean(setError?.assistanceWeight)}
                    {...register(
                      `exercises.${index}.sets.${setIndex}.assistanceWeight`,
                      { valueAsNumber: true },
                    )}
                    className={compactFieldClass}
                  />
                </Field>
                <Field
                  label="Rest (sec)"
                  error={setError?.restDuration?.message}
                >
                  <input
                    type="number"
                    min={0}
                    max={86400}
                    step="5"
                    aria-invalid={Boolean(setError?.restDuration)}
                    {...register(
                      `exercises.${index}.sets.${setIndex}.restDuration`,
                      { valueAsNumber: true },
                    )}
                    className={compactFieldClass}
                  />
                </Field>
              </div>

              <details className="group mt-3 rounded-xl border border-slate-200/60 bg-white/25 p-3 dark:border-white/8 dark:bg-white/[0.02]">
                <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 rounded-lg text-xs font-semibold text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300">
                  <Plus
                    aria-hidden
                    className="size-3.5 transition group-open:rotate-45 motion-reduce:transition-none"
                  />
                  Distance, tempo, band and notes
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field
                    label={`Distance (${displayedDistanceUnit})`}
                    error={setError?.distance?.message}
                    optional
                  >
                    <input
                      type="number"
                      min={0}
                      max={maxDisplayedDistance}
                      step="0.01"
                      aria-invalid={Boolean(setError?.distance)}
                      {...register(
                        `exercises.${index}.sets.${setIndex}.distance`,
                        { valueAsNumber: true },
                      )}
                      className={compactFieldClass}
                    />
                  </Field>
                  <Field label="Tempo" optional>
                    <input
                      {...register(
                        `exercises.${index}.sets.${setIndex}.tempo`,
                      )}
                      className={compactFieldClass}
                      placeholder="3-1-X-1"
                    />
                  </Field>
                  <Field label="Band level" optional>
                    <input
                      {...register(
                        `exercises.${index}.sets.${setIndex}.bandLevel`,
                      )}
                      className={compactFieldClass}
                      placeholder={`Light / 10 ${displayedWeightUnit}`}
                    />
                  </Field>
                  <Field label="Set note" optional>
                    <input
                      {...register(
                        `exercises.${index}.sets.${setIndex}.notes`,
                      )}
                      className={compactFieldClass}
                      placeholder="Technique cue"
                    />
                  </Field>
                </div>
              </details>

              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    {...register(
                      `exercises.${index}.sets.${setIndex}.completed`,
                    )}
                    className="size-4 rounded border-slate-300 accent-cyan-600"
                  />
                  Completed
                </label>
                <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    {...register(
                      `exercises.${index}.sets.${setIndex}.personalRecord`,
                    )}
                    className="size-4 rounded border-slate-300 accent-amber-500"
                  />
                  Personal record
                </label>
              </div>
            </section>
          );
        })}

        <Field label="Exercise notes" optional>
          <textarea
            {...register(`exercises.${index}.notes`)}
            rows={2}
            className={cn(compactFieldClass, "h-auto min-h-20 py-3")}
            placeholder="Cues that apply to the whole exercise"
          />
        </Field>
      </div>
    </article>
  );
}

export function WorkoutLogForm({
  initialValues,
  templates = defaultTemplates,
  exerciseCatalog = [],
  onSubmit,
  onSaveTemplate,
  onCancel,
  submitLabel = "Save workout",
  hasExistingPhoto = false,
}: {
  initialValues?: Partial<WorkoutFormValues>;
  templates?: WorkoutTemplate[];
  exerciseCatalog?: ExerciseCatalogItem[];
  onSubmit?: (values: WorkoutFormValues) => void | Promise<void>;
  onSaveTemplate?: (values: WorkoutFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  hasExistingPhoto?: boolean;
}) {
  const unitPreference = useUnitPreference();
  const today = new Date().toISOString().slice(0, 10);
  const activeWorkoutFormSchema = useMemo(
    () => createWorkoutFormSchema(unitPreference),
    [unitPreference],
  );
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(
    null,
  );
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const defaultValues = useMemo<WorkoutFormValues>(
    () => ({
      name: initialValues?.name ?? "",
      type: initialValues?.type ?? "Strength",
      date: initialValues?.date ?? today,
      startTime: initialValues?.startTime ?? "18:00",
      endTime: initialValues?.endTime ?? "19:00",
      status: initialValues?.status ?? "completed",
      visibility: initialValues?.visibility ?? "partner",
      difficulty: initialValues?.difficulty ?? 7,
      energy: initialValues?.energy ?? 7,
      location: initialValues?.location ?? "",
      notes: initialValues?.notes ?? "",
      photo: undefined,
      removePhoto: false,
      exercises:
        initialValues?.exercises?.length
          ? initialValues.exercises
          : [
              {
                ...emptyExercise,
                sets: emptyExercise.sets.map((set) => ({ ...set })),
              },
            ],
    }),
    [initialValues, today],
  );

  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<WorkoutFormValues>({
    resolver: zodResolver(activeWorkoutFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const { fields, append, insert, remove, move, replace } = useFieldArray({
    control,
    name: "exercises",
  });

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const submitForm = handleSubmit(async (values) => {
    if (onSubmit) {
      await onSubmit(values);
    } else {
      toast.success("Workout saved", {
        description: "Your training data is now synced across devices.",
      });
    }
    reset(values);
  });

  const applyTemplate = () => {
    const template = templates.find((item) => item.id === selectedTemplate);
    if (!template) return;
    replace(
      template.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({ ...set, id: undefined })),
      })),
    );
    toast.success(`${template.name} loaded`);
  };

  return (
    <div className="workout-log-form space-y-7">
      <PageHeader
        eyebrow="Workout log"
        title={initialValues ? "Edit your session" : "Capture the work"}
        description="Log enough detail to make the next session smarter. You can fine-tune individual sets later."
        action={
          isDirty ? (
            <StatusPill tone="warning">Unsaved changes</StatusPill>
          ) : (
            <StatusPill tone="success">All changes saved</StatusPill>
          )
        }
      />

      <form onSubmit={submitForm} noValidate className="space-y-5">
        <GlassCard className="p-5 sm:p-7">
          <SectionHeader
            title="Session details"
            description="When, where, and how the session felt"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <Field label="Workout name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  className={fieldClass}
                  placeholder="e.g. Pull strength + front lever"
                  autoComplete="off"
                />
              </Field>
            </div>
            <Field label="Workout type" error={errors.type?.message}>
              <div className="relative">
                <select
                  {...register("type")}
                  className={cn(fieldClass, "appearance-none pr-10")}
                >
                  <option>Strength</option>
                  <option>Push</option>
                  <option>Pull</option>
                  <option>Skill</option>
                  <option>Legs</option>
                  <option>Mobility</option>
                  <option>Conditioning</option>
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
              </div>
            </Field>
            <Field label="Session status">
              <div className="relative">
                <select
                  {...register("status")}
                  className={cn(fieldClass, "appearance-none pr-10")}
                >
                  <option value="completed">Completed workout</option>
                  <option value="planned">Planned session</option>
                  <option value="skipped">Skipped session</option>
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
              </div>
            </Field>
            <Field label="Who can see this?">
              <div className="relative">
                <select
                  {...register("visibility")}
                  className={cn(fieldClass, "appearance-none pr-10")}
                >
                  <option value="partner">Accountability partner</option>
                  <option value="private">Only me</option>
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
              </div>
            </Field>
            <Field label="Date" error={errors.date?.message}>
              <input type="date" {...register("date")} className={fieldClass} />
            </Field>
            <Field label="Start time" error={errors.startTime?.message}>
              <input
                type="time"
                {...register("startTime")}
                className={fieldClass}
              />
            </Field>
            <Field label="End time" error={errors.endTime?.message}>
              <input
                type="time"
                {...register("endTime")}
                className={fieldClass}
              />
            </Field>
            <Field label="Difficulty · 1–10">
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/65 bg-white/55 px-4 dark:border-white/10 dark:bg-white/[0.055]">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      className="h-1.5 flex-1 cursor-pointer accent-cyan-600"
                      aria-label="Perceived difficulty"
                    />
                    <span className="w-5 text-right text-sm font-bold">
                      {field.value}
                    </span>
                  </div>
                )}
              />
            </Field>
            <Field label="Energy · 1–10">
              <Controller
                control={control}
                name="energy"
                render={({ field }) => (
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/65 bg-white/55 px-4 dark:border-white/10 dark:bg-white/[0.055]">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      className="h-1.5 flex-1 cursor-pointer accent-violet-600"
                      aria-label="Energy level"
                    />
                    <span className="w-5 text-right text-sm font-bold">
                      {field.value}
                    </span>
                  </div>
                )}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Location" optional>
                <input
                  {...register("location")}
                  className={fieldClass}
                  placeholder="Home setup, park, gym…"
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Progress photo" optional>
                <div className="space-y-2">
                  <label className="focus-within:ring-sky-500 flex h-12 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-4 text-xs font-semibold text-sky-700 focus-within:ring-2 dark:border-cyan-300/20 dark:bg-cyan-300/[0.05] dark:text-cyan-300">
                    <ImagePlus aria-hidden className="size-4" />
                    {hasExistingPhoto
                      ? "Keep current media or choose a replacement"
                      : "Add JPG, PNG, WebP or AVIF"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      {...register("photo")}
                      className="sr-only"
                    />
                  </label>
                  {hasExistingPhoto ? (
                    <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        {...register("removePhoto")}
                        className="size-4 rounded border-slate-300 accent-rose-500"
                      />
                      Remove current media when this workout is saved
                    </label>
                  ) : null}
                </div>
              </Field>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <Field label="Session notes" optional>
                <textarea
                  {...register("notes")}
                  rows={3}
                  className={cn(fieldClass, "h-auto min-h-24 py-3")}
                  placeholder="How did the session feel? What should change next time?"
                />
              </Field>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                Exercises
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Reorder, duplicate, or expand any exercise for more detail.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-48">
                <span className="sr-only">Choose workout template</span>
                <select
                  value={selectedTemplate}
                  onChange={(event) => setSelectedTemplate(event.target.value)}
                  className={cn(fieldClass, "h-11 appearance-none pr-10 text-xs")}
                >
                  <option value="">Choose a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                />
              </label>
              <Button
                variant="secondary"
                onClick={applyTemplate}
                disabled={!selectedTemplate}
                className="h-11"
              >
                <Sparkles aria-hidden className="size-4" />
                Load template
              </Button>
            </div>
          </div>

          <datalist id="exercise-library">
            {(exerciseCatalog.length
              ? exerciseCatalog
              : [
                  { id: "push-up", name: "Push-Up" },
                  { id: "pull-up", name: "Pull-Up" },
                  { id: "chin-up", name: "Chin-Up" },
                  { id: "dip", name: "Dip" },
                  { id: "pike-push-up", name: "Pike Push-Up" },
                  { id: "l-sit", name: "L-Sit Hold" },
                  { id: "pistol-squat", name: "Pistol Squat" },
                  { id: "nordic-curl", name: "Nordic Curl" },
                ]
            ).map((exercise) => (
              <option key={exercise.id} value={exercise.name} />
            ))}
          </datalist>

          {errors.exercises?.root?.message ? (
            <p role="alert" className="mb-4 text-sm text-rose-600 dark:text-rose-300">
              {errors.exercises.root.message}
            </p>
          ) : null}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <ExerciseCard
                key={field.id}
                index={index}
                count={fields.length}
                register={register}
                control={control}
                error={errors.exercises?.[index]}
                onMove={move}
                onDuplicate={() =>
                  insert(index + 1, {
                    ...getValues(`exercises.${index}`),
                    id: undefined,
                    sets: getValues(`exercises.${index}.sets`).map((set) => ({
                      ...set,
                      id: undefined,
                    })),
                  })
                }
                onRemove={() => setPendingRemoveIndex(index)}
              />
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={() =>
              append({
                ...emptyExercise,
                sets: emptyExercise.sets.map((set) => ({ ...set })),
              })
            }
            className="mt-5 w-full border-dashed"
          >
            <Plus aria-hidden className="size-4" />
            Add exercise
          </Button>
        </GlassCard>

        <GlassCard className="sticky bottom-[82px] z-20 p-3 sm:static sm:p-4 lg:bottom-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex dark:text-slate-400">
              <Check aria-hidden className="size-4 text-emerald-500" />
              Your record remains private unless your sharing rules allow it.
            </div>
            <div className="flex flex-1 gap-2 sm:flex-initial">
              <Button
                variant="ghost"
                onClick={() => {
                  if (!isDirty || window.confirm("Discard unsaved changes?")) {
                    onCancel?.();
                  }
                }}
                className="flex-1 sm:flex-initial"
              >
                <ArrowLeft aria-hidden className="size-4" />
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  const values = getValues();
                  if (onSaveTemplate) await onSaveTemplate(values);
                  else toast.success("Workout template saved");
                }}
                className="hidden sm:inline-flex"
              >
                <Copy aria-hidden className="size-4" />
                Save template
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:min-w-40"
              >
                <Save aria-hidden className="size-4" />
                {isSubmitting ? "Saving…" : submitLabel}
              </Button>
            </div>
          </div>
        </GlassCard>
      </form>

      <ConfirmDialog
        open={pendingRemoveIndex !== null}
        title="Remove this exercise?"
        description="This removes the exercise and its set details from the current workout. The change is not saved until you save the workout."
        confirmLabel="Remove exercise"
        destructive
        onCancel={() => setPendingRemoveIndex(null)}
        onConfirm={() => {
          if (pendingRemoveIndex !== null) remove(pendingRemoveIndex);
          setPendingRemoveIndex(null);
        }}
      />
    </div>
  );
}
