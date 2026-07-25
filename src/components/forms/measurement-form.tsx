"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, LoaderCircle, Ruler, Save, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { buildPrivateMediaPath, validateMediaFile } from "@/lib/uploads";
import { localDateInputValue } from "@/lib/local-date";
import { GlassCard, PageHeader } from "@/components/ui/primitives";
import { useUnitPreference } from "@/components/unit-preference-provider";
import {
  displayLengthToCentimeters,
  displayWeightToKilograms,
  lengthUnit,
  weightUnit,
  type UnitPreference,
} from "@/lib/units";

const optionalMetric = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    z.number().min(min).max(max).optional(),
  );

const optionalCanonicalMetric = (
  min: number,
  max: number,
  toCanonical: (value: number) => number,
  message: string,
) =>
  z
    .preprocess(
      (value) => (value === "" || value == null ? undefined : Number(value)),
      z.number().finite().optional(),
    )
    .refine(
      (value) =>
        value === undefined ||
        (toCanonical(value) >= min && toCanonical(value) <= max),
      { message },
    );

function createFormSchema(preference: UnitPreference) {
  const weight = (min: number, max: number) =>
    optionalCanonicalMetric(
      min,
      max,
      (value) => displayWeightToKilograms(value, preference),
      "Weight is outside the supported range.",
    );
  const length = (min: number, max: number) =>
    optionalCanonicalMetric(
      min,
      max,
      (value) => displayLengthToCentimeters(value, preference),
      "Measurement is outside the supported range.",
    );

  return z
    .object({
    measuredAt: z.string().min(1),
    weightKg: weight(20, 500),
    bodyFatPercentage: optionalMetric(1, 80),
    waistCm: length(20, 400),
    chestCm: length(20, 400),
    shouldersCm: length(20, 400),
    upperArmCm: length(5, 150),
    forearmCm: length(5, 100),
    thighCm: length(10, 200),
    calfCm: length(5, 120),
    notes: z.string().trim().max(2000).optional(),
    visibility: z.enum(["private", "partner"]),
    photos: z.custom<FileList>().optional(),
  })
  .refine(
    (value) =>
      [
        value.weightKg,
        value.bodyFatPercentage,
        value.waistCm,
        value.chestCm,
        value.shouldersCm,
        value.upperArmCm,
        value.forearmCm,
        value.thighCm,
        value.calfCm,
      ].some((item) => item !== undefined),
    { message: "Add at least one measurement", path: ["weightKg"] },
    );
}

type FormInput = z.input<ReturnType<typeof createFormSchema>>;
type FormOutput = z.output<ReturnType<typeof createFormSchema>>;

const fields = [
  { name: "weightKg", label: "Weight", kind: "weight", icon: Scale },
  { name: "bodyFatPercentage", label: "Body fat", unit: "%", icon: Ruler },
  { name: "waistCm", label: "Waist", kind: "length", icon: Ruler },
  { name: "chestCm", label: "Chest", kind: "length", icon: Ruler },
  { name: "shouldersCm", label: "Shoulders", kind: "length", icon: Ruler },
  { name: "upperArmCm", label: "Upper arm", kind: "length", icon: Ruler },
  { name: "forearmCm", label: "Forearm", kind: "length", icon: Ruler },
  { name: "thighCm", label: "Thigh", kind: "length", icon: Ruler },
  { name: "calfCm", label: "Calf", kind: "length", icon: Ruler },
] as const;

export function MeasurementForm() {
  const router = useRouter();
  const unitPreference = useUnitPreference();
  const formSchema = useMemo(
    () => createFormSchema(unitPreference),
    [unitPreference],
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      measuredAt: localDateInputValue(),
      visibility: "private",
      notes: "",
    },
  });

  const submit = async (values: FormOutput) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    const photoPaths: string[] = [];

    for (const file of Array.from(values.photos ?? [])) {
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        throw new Error(validation.error);
      }
      const path = buildPrivateMediaPath(
        user.id,
        file,
        values.visibility === "partner" ? "shared" : "private",
      );
      const { error } = await supabase.storage.from("progress-media").upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        if (photoPaths.length) await supabase.storage.from("progress-media").remove(photoPaths);
        toast.error("Photo upload failed");
        throw error;
      }
      photoPaths.push(path);
    }

    const toCanonicalLength = (value: number | undefined) =>
      value == null
        ? undefined
        : displayLengthToCentimeters(value, unitPreference);
    const payload = {
      measuredAt: values.measuredAt,
      weightKg:
        values.weightKg == null
          ? undefined
          : displayWeightToKilograms(values.weightKg, unitPreference),
      bodyFatPercentage: values.bodyFatPercentage,
      waistCm: toCanonicalLength(values.waistCm),
      chestCm: toCanonicalLength(values.chestCm),
      shouldersCm: toCanonicalLength(values.shouldersCm),
      upperArmCm: toCanonicalLength(values.upperArmCm),
      forearmCm: toCanonicalLength(values.forearmCm),
      thighCm: toCanonicalLength(values.thighCm),
      calfCm: toCanonicalLength(values.calfCm),
      notes: values.notes,
      visibility: values.visibility,
    };
    let response: Response;
    try {
      response = await fetch("/api/measurements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, photoPaths }),
      });
    } catch (error) {
      if (photoPaths.length) {
        await supabase.storage.from("progress-media").remove(photoPaths);
      }
      toast.error("Measurement could not be saved", {
        description: "Check your connection and try again.",
      });
      throw error;
    }
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      if (photoPaths.length) await supabase.storage.from("progress-media").remove(photoPaths);
      toast.error("Measurement could not be saved", { description: result.error });
      throw new Error(result.error ?? "Save failed");
    }
    toast.success("Measurement saved");
    router.push("/measurements");
    router.refresh();
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Body measurements"
        title="Record a new check-in"
        description={`Add only the measurements that are useful today. Values are shown in ${unitPreference === "imperial" ? "imperial" : "metric"} units and stored canonically for reliable comparisons.`}
      />
      <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        <GlassCard className="p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Measurement date</span>
              <input className="field" type="date" {...register("measuredAt")} />
            </label>
            {fields.map(({ name, label, icon: Icon, ...field }) => {
              const unit =
                "unit" in field
                  ? field.unit
                  : field.kind === "weight"
                    ? weightUnit(unitPreference)
                    : lengthUnit(unitPreference);
              return (
              <label key={name} className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Icon size={15} className="text-blue-600" aria-hidden="true" />
                  {label}
                </span>
                <div className="relative">
                  <input
                    className="field pr-12"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    aria-invalid={Boolean(errors[name])}
                    {...register(name)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--muted)]">
                    {unit}
                  </span>
                </div>
                {errors[name] && (
                  <p className="mt-1 text-xs font-medium text-rose-600">
                    {errors[name]?.message as string}
                  </p>
                )}
              </label>
              );
            })}
          </div>
          {errors.weightKg?.message === "Add at least one measurement" && (
            <p className="mt-4 text-sm font-medium text-rose-600" role="alert">
              Add at least one body measurement.
            </p>
          )}
        </GlassCard>

        <GlassCard className="grid gap-5 p-5 sm:p-7 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Camera size={16} className="text-blue-600" aria-hidden="true" />
              Progress photos
            </span>
            <input
              className="field file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              {...register("photos")}
            />
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Up to 15 MB per image. Files remain in a private Storage bucket.
            </p>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Who can see this check-in?</span>
            <select className="field" {...register("visibility")}>
              <option value="private">Only me</option>
              <option value="partner">My connected partner</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold">Notes</span>
            <textarea className="field min-h-28 resize-y" {...register("notes")} />
          </label>
        </GlassCard>

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
            Save measurement
          </button>
        </div>
      </form>
    </div>
  );
}
