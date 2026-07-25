import { readJsonBody, validationError } from "@/lib/http";
import { normalizeGoalWeightFields } from "@/lib/goal-units";
import { createClient } from "@/lib/supabase/server";
import { goalSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = goalSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const value = normalizeGoalWeightFields(parsed.data);
  const recordGoal = ["repetitions", "hold_time", "added_weight"].includes(value.goalType);
  const exerciseLibraryId = recordGoal ? value.exerciseLibraryId ?? null : null;
  const skillId = recordGoal || value.goalType === "skill" ? value.skillId ?? null : null;
  const recordType =
    value.goalType === "repetitions"
      ? "repetitions"
      : value.goalType === "hold_time"
        ? "hold_seconds"
        : value.goalType === "added_weight"
          ? "added_weight"
          : undefined;
  const trackingConfig =
    value.trackingMode === "automatic"
      ? value.goalType === "workout_frequency"
        ? { source: "workouts", period: "iso_week", status: "completed" }
        : value.goalType === "workout_count"
          ? { source: "workouts", period: "goal_window", status: "completed" }
          : value.goalType === "skill"
            ? { source: "skill_entries", skillId }
            : {
                source: "personal_records",
                recordType,
                exerciseLibraryId,
                skillId,
              }
      : {};
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title: value.title,
      goal_type: value.goalType,
      exercise_library_id: exerciseLibraryId,
      skill_id: skillId,
      starting_value: value.startingValue,
      target_value: value.targetValue,
      current_value: value.currentValue,
      unit: value.unit,
      start_date: value.startDate,
      target_date: value.targetDate || null,
      status: value.status,
      notes: value.notes,
      visibility: value.visibility,
      tracking_mode: value.trackingMode,
      tracking_config: trackingConfig,
      completed_at: value.status === "completed" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error) return Response.json({ error: "Goal could not be created." }, { status: 400 });
  return Response.json({ data }, { status: 201 });
}
