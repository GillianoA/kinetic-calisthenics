"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, LoaderCircle, Medal, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GlassCard, PageHeader } from "@/components/ui/primitives";
import { useUnitPreference } from "@/components/unit-preference-provider";
import { createClient } from "@/lib/supabase/client";
import { buildPrivateMediaPath, validateMediaFile } from "@/lib/uploads";
import {
  displayWeightToKilograms,
  floorUnit,
  kilogramsToDisplay,
  type UnitPreference,
  weightUnit,
} from "@/lib/units";

export type SkillCatalogItem = {
  id: string;
  name: string;
  category: string;
  stages: Array<{ id: string; name: string; order: number }>;
};

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z
      .number({ error: "Enter a valid number" })
      .min(min, `Must be at least ${min}`)
      .max(max, `Must be ${max} or less`)
      .optional(),
  );

function maximumDisplayedWeight(preference: UnitPreference) {
  return floorUnit(kilogramsToDisplay(1000, preference, 6), 2);
}

function createFormSchema(preference: UnitPreference) {
  const displayedMaximum = maximumDisplayedWeight(preference);
  const addedWeight = z
    .preprocess(
      (value) => (value === "" || value == null ? undefined : Number(value)),
      z
        .number({ error: "Enter a valid number" })
        .min(0, "Must be at least 0")
        .optional(),
    )
    .refine(
      (value) =>
        value === undefined ||
        displayWeightToKilograms(value, preference) <= 1000,
      {
        message: `Must be ${displayedMaximum} ${weightUnit(preference)} or less`,
      },
    );

  return z.object({
    skillId: z.string().optional(),
    customName: z
      .string()
      .trim()
      .max(120, "Use 120 characters or fewer")
      .optional(),
    customCategory: z
      .enum(["push", "pull", "core", "balance", "legs", "static", "dynamic", "mobility", "other"])
      .default("other"),
    customStages: z.string().max(1000, "Use 1,000 characters or fewer").optional(),
    progressionId: z.string().optional(),
    targetProgressionId: z.string().optional(),
    bestHoldSeconds: optionalNumber(0, 86400),
    maxRepetitions: optionalNumber(0, 10000),
    assistanceLevel: z
      .string()
      .trim()
      .max(100, "Use 100 characters or fewer")
      .optional(),
    addedWeight,
    achievedAt: z.string().optional(),
    confidenceRating: optionalNumber(1, 10),
    techniqueRating: optionalNumber(1, 10),
    notes: z.string().trim().max(3000, "Use 3,000 characters or fewer").optional(),
    status: z.enum(["not_started", "learning", "developing", "achieved", "mastered"]),
    visibility: z.enum(["private", "partner"]),
    media: z.custom<FileList>().optional(),
  });
}

type FormInput = z.input<ReturnType<typeof createFormSchema>>;
type FormOutput = z.output<ReturnType<typeof createFormSchema>>;

export function SkillEntryForm({
  catalog,
  initialSkillId,
}: {
  catalog: SkillCatalogItem[];
  initialSkillId?: string;
}) {
  const router = useRouter();
  const unitPreference = useUnitPreference();
  const activeFormSchema = useMemo(
    () => createFormSchema(unitPreference),
    [unitPreference],
  );
  const [custom, setCustom] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(activeFormSchema),
    defaultValues: {
      skillId: initialSkillId ?? catalog[0]?.id ?? "",
      customName: "",
      customCategory: "other",
      customStages: "",
      progressionId: "",
      targetProgressionId: "",
      assistanceLevel: "",
      achievedAt: "",
      notes: "",
      status: "learning",
      visibility: "partner",
    },
  });
  const skillId = useWatch({ control, name: "skillId" });
  const selectedSkill = useMemo(
    () => catalog.find((skill) => skill.id === skillId),
    [catalog, skillId],
  );

  const submit = async (values: FormOutput) => {
    let activeSkillId = values.skillId;
    let createdCustomSkillId: string | undefined;
    let createdStages: Array<{ id: string; name: string; stage_order: number }> = [];
    if (custom) {
      if (!values.customName || values.customName.length < 2) {
        setError(
          "customName",
          { type: "manual", message: "Use at least 2 characters" },
          { shouldFocus: true },
        );
        toast.error("Name your custom skill");
        return;
      }
      const response = await fetch("/api/skills/custom", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.customName,
          category: values.customCategory,
          stages: (values.customStages ?? "")
            .split(/\r?\n|,/)
            .map((stage) => stage.trim())
            .filter(Boolean),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        id?: string;
        stages?: typeof createdStages;
        error?: string;
      };
      if (!response.ok || !result.id) {
        toast.error("Custom skill could not be created", { description: result.error });
        throw new Error(result.error ?? "Create failed");
      }
      activeSkillId = result.id;
      createdCustomSkillId = result.id;
      createdStages = result.stages ?? [];
    }
    if (!activeSkillId) {
      setError(
        "skillId",
        { type: "manual", message: "Choose a skill" },
        { shouldFocus: true },
      );
      toast.error("Choose a skill");
      return;
    }

    const supabase = createClient();
    const cleanupCreatedSkill = async () => {
      if (!createdCustomSkillId) return;
      await supabase
        .from("skills")
        .delete()
        .eq("id", createdCustomSkillId);
    };
    let mediaPath: string | undefined;
    const media = values.media?.item(0);
    if (media) {
      const validation = validateMediaFile(media, true);
      if (!validation.valid) {
        await cleanupCreatedSkill();
        setError(
          "media",
          { type: "manual", message: validation.error },
          { shouldFocus: true },
        );
        toast.error(validation.error);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        await cleanupCreatedSkill();
        throw new Error("Authentication required.");
      }
      mediaPath = buildPrivateMediaPath(
        user.id,
        media,
        values.visibility === "partner" ? "shared" : "private",
      );
      const { error } = await supabase.storage.from("progress-media").upload(mediaPath, media, {
        contentType: media.type,
        cacheControl: "3600",
      });
      if (error) {
        await cleanupCreatedSkill();
        throw error;
      }
    }

    let response: Response;
    try {
      response = await fetch("/api/skills", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          skillId: activeSkillId,
          progressionId: custom ? createdStages[0]?.id : values.progressionId || undefined,
          targetProgressionId: custom
            ? createdStages.at(-1)?.id
            : values.targetProgressionId || undefined,
          bestHoldSeconds: values.bestHoldSeconds,
          maxRepetitions: values.maxRepetitions,
          assistanceLevel: values.assistanceLevel,
          addedWeight:
            values.addedWeight == null
              ? undefined
              : displayWeightToKilograms(
                  values.addedWeight,
                  unitPreference,
                ),
          achievedAt: values.achievedAt,
          confidenceRating: values.confidenceRating,
          techniqueRating: values.techniqueRating,
          notes: values.notes,
          mediaPath,
          status: values.status,
          visibility: values.visibility,
        }),
      });
    } catch (error) {
      if (mediaPath) {
        await supabase.storage.from("progress-media").remove([mediaPath]);
      }
      await cleanupCreatedSkill();
      toast.error("Skill update could not be saved", {
        description: "Check your connection and try again.",
      });
      throw error;
    }
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      if (mediaPath) await supabase.storage.from("progress-media").remove([mediaPath]);
      await cleanupCreatedSkill();
      toast.error("Skill update could not be saved", { description: result.error });
      throw new Error(result.error ?? "Save failed");
    }
    toast.success("Skill progress updated");
    router.push("/skills");
    router.refresh();
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Skill progress"
        title="Record a skill milestone"
        description="Progress percentages only appear when this skill has a defined progression ladder."
      />
      <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        <GlassCard className="p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Skill and progression</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Choose from the ordered catalog or define your own ladder.
              </p>
            </div>
            <button
              className="button-secondary !min-h-10 text-sm"
              type="button"
              onClick={() => {
                clearErrors(["customName", "skillId"]);
                setCustom((value) => !value);
              }}
            >
              <Plus size={15} aria-hidden="true" />
              {custom ? "Use catalog" : "Custom skill"}
            </button>
          </div>
          {custom ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Custom skill name"
                error={errors.customName?.message}
                errorId="skill-custom-name-error"
              >
                <input
                  className="field"
                  aria-invalid={Boolean(errors.customName)}
                  aria-describedby={
                    errors.customName ? "skill-custom-name-error" : undefined
                  }
                  {...register("customName")}
                />
              </Field>
              <Field label="Category">
                <select className="field" {...register("customCategory")}>
                  {["push", "pull", "core", "balance", "legs", "static", "dynamic", "mobility", "other"].map(
                    (category) => (
                      <option key={category}>{category}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field
                label="Progression stages"
                className="md:col-span-2"
                error={errors.customStages?.message}
                errorId="skill-custom-stages-error"
              >
                <textarea
                  className="field min-h-28 resize-y"
                  placeholder={"One stage per line, easiest to hardest\nTuck\nAdvanced tuck\nStraddle\nFull"}
                  aria-invalid={Boolean(errors.customStages)}
                  aria-describedby={
                    [
                      "skill-custom-stages-help",
                      errors.customStages && "skill-custom-stages-error",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  {...register("customStages")}
                />
                <p
                  id="skill-custom-stages-help"
                  className="mt-2 text-xs text-[var(--muted)]"
                >
                  Optional. Without stages, Kinetic will show records and status but no percentage.
                </p>
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label="Skill"
                error={errors.skillId?.message}
                errorId="skill-catalog-error"
              >
                <select
                  className="field"
                  aria-invalid={Boolean(errors.skillId)}
                  aria-describedby={
                    errors.skillId ? "skill-catalog-error" : undefined
                  }
                  {...register("skillId")}
                >
                  {catalog.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Current progression">
                <select className="field" {...register("progressionId")}>
                  <option value="">Not selected</option>
                  {selectedSkill?.stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Target progression">
                <select className="field" {...register("targetProgressionId")}>
                  <option value="">Final stage</option>
                  {selectedSkill?.stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </GlassCard>

        <GlassCard className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
          <NumberField
            label="Best hold"
            unit="sec"
            registration={register("bestHoldSeconds")}
            error={errors.bestHoldSeconds?.message}
            errorId="skill-best-hold-error"
          />
          <NumberField
            label="Maximum reps"
            unit="reps"
            registration={register("maxRepetitions")}
            error={errors.maxRepetitions?.message}
            errorId="skill-max-reps-error"
          />
          <NumberField
            label="Added weight"
            unit={weightUnit(unitPreference)}
            registration={register("addedWeight")}
            error={errors.addedWeight?.message}
            errorId="skill-added-weight-error"
            max={maximumDisplayedWeight(unitPreference)}
            step="0.01"
          />
          <Field
            label="Assistance"
            error={errors.assistanceLevel?.message}
            errorId="skill-assistance-error"
          >
            <input
              className="field"
              placeholder="Light band, wall, spotter…"
              aria-invalid={Boolean(errors.assistanceLevel)}
              aria-describedby={
                errors.assistanceLevel ? "skill-assistance-error" : undefined
              }
              {...register("assistanceLevel")}
            />
          </Field>
          <NumberField
            label="Confidence"
            unit="/10"
            registration={register("confidenceRating")}
            error={errors.confidenceRating?.message}
            errorId="skill-confidence-error"
          />
          <NumberField
            label="Technique"
            unit="/10"
            registration={register("techniqueRating")}
            error={errors.techniqueRating?.message}
            errorId="skill-technique-error"
          />
          <Field label="Status">
            <select className="field" {...register("status")}>
              <option value="not_started">Not started</option>
              <option value="learning">Learning</option>
              <option value="developing">Developing</option>
              <option value="achieved">Achieved</option>
              <option value="mastered">Mastered</option>
            </select>
          </Field>
          <Field label="Date achieved">
            <input className="field" type="date" {...register("achievedAt")} />
          </Field>
        </GlassCard>

        <GlassCard className="grid gap-5 p-5 sm:p-7 md:grid-cols-2">
          <Field
            label="Image or video reference"
            error={errors.media?.message}
            errorId="skill-media-error"
          >
            <div className="relative">
              <Camera className="absolute left-4 top-4 text-blue-600" size={17} aria-hidden="true" />
              <input
                className="field pl-11 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                aria-invalid={Boolean(errors.media)}
                aria-describedby={errors.media ? "skill-media-error" : undefined}
                {...register("media")}
              />
            </div>
          </Field>
          <Field label="Visibility">
            <select className="field" {...register("visibility")}>
              <option value="partner">Connected partner</option>
              <option value="private">Only me</option>
            </select>
          </Field>
          <Field
            label="Technique notes"
            className="md:col-span-2"
            error={errors.notes?.message}
            errorId="skill-notes-error"
          >
            <textarea
              className="field min-h-28 resize-y"
              aria-invalid={Boolean(errors.notes)}
              aria-describedby={errors.notes ? "skill-notes-error" : undefined}
              {...register("notes")}
            />
          </Field>
        </GlassCard>

        {Object.keys(errors).length > 0 && (
          <p className="text-sm font-medium text-rose-600" role="alert">
            Review the highlighted values before saving.
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button className="button-secondary" type="button" onClick={() => router.back()}>
            Cancel
          </button>
          <button className="button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
            ) : (
              <Save size={17} aria-hidden="true" />
            )}
            Save milestone
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
  error,
  errorId,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
  errorId?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Medal size={14} className="text-blue-600" aria-hidden="true" />
        {label}
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

function NumberField({
  label,
  unit,
  registration,
  error,
  errorId,
  max,
  step = "0.1",
}: {
  label: string;
  unit: string;
  registration: ReturnType<ReturnType<typeof useForm<FormInput>>["register"]>;
  error?: string;
  errorId: string;
  max?: number;
  step?: string;
}) {
  return (
    <Field label={label} error={error} errorId={errorId}>
      <div className="relative">
        <input
          className="field pr-12"
          type="number"
          min="0"
          max={max}
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...registration}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--muted)]">
          {unit}
        </span>
      </div>
    </Field>
  );
}
