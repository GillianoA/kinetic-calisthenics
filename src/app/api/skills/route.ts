import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { skillEntrySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = skillEntrySchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const value = parsed.data;
  const { data, error } = await supabase
    .from("skill_entries")
    .insert({
      user_id: user.id,
      skill_id: value.skillId,
      current_progression_id: value.progressionId,
      target_progression_id: value.targetProgressionId,
      best_hold_seconds: value.bestHoldSeconds,
      max_repetitions: value.maxRepetitions,
      assistance_level: value.assistanceLevel,
      added_weight: value.addedWeight,
      achieved_on: value.achievedAt || null,
      confidence_rating: value.confidenceRating,
      technique_rating: value.techniqueRating,
      notes: value.notes,
      media_path: value.mediaPath,
      status: value.status,
      visibility: value.visibility,
    })
    .select("*")
    .single();

  if (error) return Response.json({ error: "Skill progress could not be saved." }, { status: 400 });
  return Response.json({ data }, { status: 201 });
}
