import { notFound } from "next/navigation";
import { WorkoutFormContainer } from "@/components/forms/workout-form-container";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function timeInZone(value: string | null, timezone: string) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const metadata = { title: "Edit workout" };

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: workout }, { data: profile }, { data: exerciseCatalog }] =
    await Promise.all([
    supabase
      .from("workouts")
      .select(
        "id,user_id,name,workout_type,workout_date,start_time,end_time,status,notes,perceived_difficulty,energy_level,location,photo_path,visibility,workout_exercises(id,exercise_library_id,exercise_name,category,position,notes,exercise_sets(id,set_number,repetitions,hold_seconds,added_weight,assistance_weight,distance_meters,rest_seconds,tempo,band_level,notes,completed,is_personal_record))",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
    supabase.from("exercise_library").select("id,name").order("name"),
  ]);
  if (!workout) notFound();
  const timezone = profile?.timezone ?? "UTC";
  const initialValues = {
    name: workout.name,
    type: titleCase(workout.workout_type),
    date: workout.workout_date,
    startTime: timeInZone(workout.start_time, timezone),
    endTime: timeInZone(workout.end_time, timezone),
    status: workout.status,
    visibility: workout.visibility,
    difficulty: workout.perceived_difficulty ?? 5,
    energy: workout.energy_level ?? 5,
    location: workout.location ?? "",
    notes: workout.notes ?? "",
    exercises: [...workout.workout_exercises]
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
          id: exercise.id,
          exerciseLibraryId: exercise.exercise_library_id ?? undefined,
          name: exercise.exercise_name,
          category: titleCase(exercise.category),
          notes: exercise.notes ?? "",
          sets: [...exercise.exercise_sets]
            .sort((a, b) => a.set_number - b.set_number)
            .map((set) => ({
              id: set.id,
              repetitions: set.repetitions ?? 0,
              holdDuration: set.hold_seconds ?? 0,
              addedWeight: set.added_weight ?? 0,
              assistanceWeight: set.assistance_weight ?? 0,
              distance: set.distance_meters ?? 0,
              restDuration: set.rest_seconds ?? 90,
              tempo: set.tempo ?? "",
              bandLevel: set.band_level ?? "",
              notes: set.notes ?? "",
              completed: set.completed,
              personalRecord: set.is_personal_record,
            })),
        })),
  };

  return (
    <WorkoutFormContainer
      workoutId={workout.id}
      initialValues={initialValues}
      existingPhotoPath={workout.photo_path ?? undefined}
      initialVisibility={workout.visibility}
      exerciseCatalog={exerciseCatalog ?? []}
    />
  );
}
