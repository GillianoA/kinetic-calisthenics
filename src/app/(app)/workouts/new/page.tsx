import { WorkoutFormContainer } from "@/components/forms/workout-form-container";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Log workout" };

export default async function NewWorkoutPage() {
  await requireUser();
  const supabase = await createClient();
  const [{ data }, { data: exerciseCatalog }] = await Promise.all([
    supabase
      .from("workout_templates")
      .select(
        "id,name,workout_type,workout_template_exercises(exercise_library_id,exercise_name,category,position,notes,workout_template_sets(set_number,repetitions,hold_seconds,added_weight,assistance_weight,distance_meters,rest_seconds,tempo,band_level,notes))",
      )
      .order("updated_at", { ascending: false }),
    supabase.from("exercise_library").select("id,name").order("name"),
  ]);

  const templates = (data ?? []).map((template) => ({
    id: template.id,
    name: template.name,
    type: template.workout_type,
    exercises: [...template.workout_template_exercises]
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
          exerciseLibraryId: exercise.exercise_library_id ?? undefined,
          name: exercise.exercise_name,
          category:
            exercise.category.charAt(0).toUpperCase() +
            exercise.category.slice(1),
          notes: exercise.notes ?? "",
          sets: [...exercise.workout_template_sets]
            .sort((a, b) => a.set_number - b.set_number)
            .map((set) => ({
              repetitions: set.repetitions ?? 0,
              holdDuration: set.hold_seconds ?? 0,
              addedWeight: set.added_weight ?? 0,
              assistanceWeight: set.assistance_weight ?? 0,
              distance: set.distance_meters ?? 0,
              restDuration: set.rest_seconds ?? 90,
              tempo: set.tempo ?? "",
              bandLevel: set.band_level ?? "",
              notes: set.notes ?? "",
              completed: true,
              personalRecord: false,
            })),
        })),
  }));

  return (
    <WorkoutFormContainer
      templates={templates}
      exerciseCatalog={exerciseCatalog ?? []}
    />
  );
}
