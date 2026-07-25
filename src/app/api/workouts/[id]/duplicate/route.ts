import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const id = z.string().uuid().safeParse(rawId);
  if (!id.success) return Response.json({ error: "Invalid workout ID." }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: workout, error: loadError } = await supabase
    .from("workouts")
    .select(
      "name,workout_type,custom_workout_type,notes,perceived_difficulty,energy_level,location,visibility,workout_exercises(exercise_library_id,exercise_name,category,position,notes,exercise_sets(set_number,repetitions,hold_seconds,added_weight,assistance_weight,distance_meters,rest_seconds,tempo,band_level,notes,completed,is_personal_record))",
    )
    .eq("id", id.data)
    .single();
  if (loadError || !workout) {
    return Response.json({ error: "Workout is unavailable." }, { status: 404 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    workoutDate: today,
    name: `${workout.name} copy`,
    workoutType: workout.workout_type,
    customWorkoutType: workout.custom_workout_type,
    status: "completed",
    notes: workout.notes,
    perceivedDifficulty: workout.perceived_difficulty,
    energyLevel: workout.energy_level,
    location: workout.location,
    visibility: workout.visibility,
    exercises: (workout.workout_exercises ?? []).map((exercise) => ({
      exerciseLibraryId: exercise.exercise_library_id,
      exerciseName: exercise.exercise_name,
      category: exercise.category,
      position: exercise.position,
      notes: exercise.notes,
      sets: (exercise.exercise_sets ?? []).map((set) => ({
        setNumber: set.set_number,
        repetitions: set.repetitions,
        holdSeconds: set.hold_seconds,
        addedWeight: set.added_weight,
        assistanceWeight: set.assistance_weight,
        distanceMeters: set.distance_meters,
        restSeconds: set.rest_seconds,
        tempo: set.tempo,
        bandLevel: set.band_level,
        notes: set.notes,
        completed: set.completed,
        isPersonalRecord: false,
      })),
    })),
  };
  const { data, error } = await supabase.rpc("save_workout_with_exercises", {
    p_payload: payload,
    p_workout_uuid: null,
  });
  if (error) return Response.json({ error: "Workout could not be duplicated." }, { status: 400 });
  return Response.json({ id: data }, { status: 201 });
}
