"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  WorkoutLogForm,
  type ExerciseCatalogItem,
  type WorkoutFormValues,
  type WorkoutTemplate,
} from "@/components/workout-log-form";
import { createClient } from "@/lib/supabase/client";
import { buildPrivateMediaPath, validateMediaFile } from "@/lib/uploads";
import { mapWorkoutExercises } from "@/lib/workout-form-mapping";
import { useUnitPreference } from "@/components/unit-preference-provider";
import {
  displayDistanceToMeters,
  displayWeightToKilograms,
  kilogramsToDisplay,
  metersToDisplay,
  type UnitPreference,
} from "@/lib/units";

function workoutType(value: string) {
  const normalized = value.toLowerCase();
  if (["skill", "mobility", "conditioning", "recovery", "mixed"].includes(normalized)) {
    return normalized;
  }
  return "strength";
}

function localDateTimeToIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function exercisesForDisplay(
  exercises: WorkoutFormValues["exercises"],
  preference: UnitPreference,
) {
  return exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({
      ...set,
      addedWeight:
        set.addedWeight == null
          ? undefined
          : kilogramsToDisplay(set.addedWeight, preference, 2),
      assistanceWeight:
        set.assistanceWeight == null
          ? undefined
          : kilogramsToDisplay(set.assistanceWeight, preference, 2),
      distance:
        set.distance == null
          ? undefined
          : metersToDisplay(set.distance, preference, 2),
    })),
  }));
}

export function WorkoutFormContainer({
  workoutId,
  initialValues,
  templates,
  exerciseCatalog = [],
  existingPhotoPath,
  initialVisibility = "partner",
}: {
  workoutId?: string;
  initialValues?: Partial<WorkoutFormValues>;
  templates?: WorkoutTemplate[];
  exerciseCatalog?: ExerciseCatalogItem[];
  existingPhotoPath?: string;
  initialVisibility?: "private" | "partner";
}) {
  const router = useRouter();
  const unitPreference = useUnitPreference();
  const displayedInitialValues = useMemo(
    () =>
      initialValues
        ? {
            ...initialValues,
            ...(initialValues.exercises
              ? {
                  exercises: exercisesForDisplay(
                    initialValues.exercises,
                    unitPreference,
                  ),
                }
              : {}),
          }
        : undefined,
    [initialValues, unitPreference],
  );
  const displayedTemplates = useMemo(
    () =>
      templates?.map((template) => ({
        ...template,
        exercises: exercisesForDisplay(
          template.exercises,
          unitPreference,
        ),
      })),
    [templates, unitPreference],
  );
  const canonicalExercises = (values: WorkoutFormValues) =>
    mapWorkoutExercises(values, exerciseCatalog).map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        addedWeight:
          set.addedWeight == null
            ? undefined
            : displayWeightToKilograms(
                set.addedWeight,
                unitPreference,
              ),
        assistanceWeight:
          set.assistanceWeight == null
            ? undefined
            : displayWeightToKilograms(
                set.assistanceWeight,
                unitPreference,
              ),
        distanceMeters:
          set.distanceMeters == null
            ? undefined
            : displayDistanceToMeters(
                set.distanceMeters,
                unitPreference,
              ),
      })),
    }));

  const save = async (values: WorkoutFormValues) => {
    const supabase = createClient();
    let photoPath = values.removePhoto ? undefined : existingPhotoPath;
    let uploadedPhotoPath: string | undefined;
    const photo = values.photo?.item(0);
    const desiredStorageVisibility =
      values.visibility === "partner" ? "shared" : "private";
    if (photo) {
      const validation = validateMediaFile(photo);
      if (!validation.valid) {
        toast.error(validation.error);
        throw new Error(validation.error);
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");
      photoPath = buildPrivateMediaPath(
        user.id,
        photo,
        desiredStorageVisibility,
      );
      uploadedPhotoPath = photoPath;
      const { error } = await supabase.storage.from("progress-media").upload(photoPath, photo, {
        cacheControl: "3600",
        contentType: photo.type,
        upsert: false,
      });
      if (error) {
        toast.error("Photo upload failed");
        throw error;
      }
    } else if (
      photoPath &&
      photoPath.split("/")[1] !== desiredStorageVisibility
    ) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");

      const { data: existingMedia, error: downloadError } = await supabase.storage
        .from("progress-media")
        .download(photoPath);
      if (downloadError || !existingMedia) {
        toast.error("Current media could not be moved to the new privacy level.");
        throw downloadError ?? new Error("Current media could not be downloaded.");
      }

      const copiedMedia = new File(
        [existingMedia],
        photoPath.split("/").at(-1) ?? "workout-media",
        { type: existingMedia.type || "application/octet-stream" },
      );
      photoPath = buildPrivateMediaPath(
        user.id,
        copiedMedia,
        desiredStorageVisibility,
      );
      uploadedPhotoPath = photoPath;
      const { error: copyError } = await supabase.storage
        .from("progress-media")
        .upload(photoPath, copiedMedia, {
          cacheControl: "3600",
          contentType: copiedMedia.type,
          upsert: false,
        });
      if (copyError) {
        toast.error("Current media could not be moved to the new privacy level.");
        throw copyError;
      }
    }

    const payload = {
      workoutDate: values.date,
      startTime: localDateTimeToIso(values.date, values.startTime),
      endTime: localDateTimeToIso(values.date, values.endTime),
      name: values.name,
      workoutType: workoutType(values.type),
      notes: values.notes,
      perceivedDifficulty: values.difficulty,
      energyLevel: values.energy,
      location: values.location,
      // Preserve an explicit removal through JSON.stringify; `undefined` would
      // omit the key and the update endpoint would correctly interpret that as
      // "keep the existing photo."
      photoPath: values.removePhoto && !uploadedPhotoPath ? "" : photoPath,
      visibility: values.visibility,
      status: values.status,
      exercises: canonicalExercises(values),
    };
    let response: Response;
    try {
      response = await fetch(
        workoutId ? `/api/workouts/${workoutId}` : "/api/workouts",
        {
          method: workoutId ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
    } catch (error) {
      if (uploadedPhotoPath) {
        await supabase.storage.from("progress-media").remove([uploadedPhotoPath]);
      }
      toast.error(workoutId ? "Workout update failed" : "Workout save failed", {
        description: "Check your connection and try again.",
      });
      throw error;
    }
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      id?: string;
      mediaCleanupPending?: boolean;
    };
    if (!response.ok) {
      if (uploadedPhotoPath) {
        await supabase.storage.from("progress-media").remove([uploadedPhotoPath]);
      }
      toast.error(workoutId ? "Workout update failed" : "Workout save failed", {
        description: result.error,
      });
      throw new Error(result.error ?? "Workout save failed");
    }
    toast.success(workoutId ? "Workout updated" : "Workout saved", {
      description: "Your training data is synced across devices.",
    });
    if (result.mediaCleanupPending) {
      toast.warning("Workout saved; old media cleanup will need to be retried.");
    }
    router.push(`/workouts/${result.id ?? workoutId}`);
    router.refresh();
  };

  const saveTemplate = async (values: WorkoutFormValues) => {
    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        workoutType: workoutType(values.type),
        notes: values.notes,
        visibility: "private",
        exercises: canonicalExercises(values),
      }),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      toast.error("Template save failed", { description: result.error });
      throw new Error(result.error ?? "Template save failed");
    }
    toast.success("Workout template saved");
    router.refresh();
  };

  return (
    <WorkoutLogForm
      initialValues={{
        ...displayedInitialValues,
        visibility:
          displayedInitialValues?.visibility ?? initialVisibility,
      }}
      templates={displayedTemplates}
      exerciseCatalog={exerciseCatalog}
      onSubmit={save}
      onSaveTemplate={saveTemplate}
      onCancel={() => router.back()}
      submitLabel={workoutId ? "Update workout" : "Save workout"}
      hasExistingPhoto={Boolean(existingPhotoPath)}
    />
  );
}
