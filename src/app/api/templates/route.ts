import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { workoutTemplateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = workoutTemplateSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const value = parsed.data;

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({
      user_id: user.id,
      name: value.name,
      workout_type: value.workoutType,
      notes: value.notes,
    })
    .select("id")
    .single();
  if (templateError || !template) {
    return Response.json({ error: "Template could not be saved." }, { status: 400 });
  }

  try {
    for (const exercise of value.exercises) {
      const { data: savedExercise, error: exerciseError } = await supabase
        .from("workout_template_exercises")
        .insert({
          template_id: template.id,
          user_id: user.id,
          exercise_library_id: exercise.exerciseLibraryId,
          exercise_name: exercise.exerciseName,
          category: exercise.category ?? "other",
          position: exercise.position,
          notes: exercise.notes,
        })
        .select("id")
        .single();
      if (exerciseError || !savedExercise) throw new Error("exercise");

      const { error: setsError } = await supabase.from("workout_template_sets").insert(
        exercise.sets.map((set) => ({
          template_exercise_id: savedExercise.id,
          user_id: user.id,
          set_number: set.setNumber,
          repetitions: set.repetitions,
          hold_seconds: set.holdSeconds,
          added_weight: set.addedWeight,
          assistance_weight: set.assistanceWeight,
          distance_meters: set.distanceMeters,
          rest_seconds: set.restSeconds,
          tempo: set.tempo,
          band_level: set.bandLevel,
          notes: set.notes,
        })),
      );
      if (setsError) throw new Error("sets");
    }
  } catch {
    await supabase
      .from("workout_templates")
      .delete()
      .eq("id", template.id)
      .eq("user_id", user.id);
    return Response.json({ error: "Template could not be saved." }, { status: 400 });
  }

  return Response.json({ id: template.id }, { status: 201 });
}
