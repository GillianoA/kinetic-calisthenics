import { z } from "zod";
import { normalizeGoalWeightFields } from "@/lib/goal-units";
import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { goalSchema } from "@/lib/validation";

async function parseId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return z.string().uuid().safeParse(id);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await parseId(context);
  if (!id.success) return Response.json({ error: "Invalid goal ID." }, { status: 400 });
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
  const completedAt = value.status === "completed" ? new Date().toISOString() : null;
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
    .update({
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
      completed_at: completedAt,
    })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("*")
    .single();
  if (error) return Response.json({ error: "Goal could not be updated." }, { status: 400 });
  return Response.json({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const id = await parseId(context);
  if (!id.success) return Response.json({ error: "Invalid goal ID." }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id);
  if (error) return Response.json({ error: "Goal could not be deleted." }, { status: 400 });
  return new Response(null, { status: 204 });
}
