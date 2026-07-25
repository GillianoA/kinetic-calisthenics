import { z } from "zod";
import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { challengeProgressSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return Response.json({ error: "Invalid challenge ID." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = challengeProgressSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);

  const { data: challenge } = await supabase
    .from("challenges")
    .select("id,metric_key,target_value,starts_on,ends_on,status")
    .eq("id", id)
    .single();
  if (!challenge) {
    return Response.json({ error: "Challenge not found." }, { status: 404 });
  }
  if (challenge.metric_key === "workouts_completed") {
    return Response.json(
      { error: "Workout challenge progress is calculated from shared workout logs." },
      { status: 409 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  if (
    !["upcoming", "active"].includes(challenge.status) ||
    today < challenge.starts_on ||
    today > challenge.ends_on
  ) {
    return Response.json(
      { error: "Progress can only be updated during the active challenge window." },
      { status: 409 },
    );
  }

  const completed = parsed.data.currentValue >= Number(challenge.target_value);
  const { data, error } = await supabase
    .from("challenge_members")
    .update({
      current_value: parsed.data.currentValue,
      status: completed ? "completed" : "joined",
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("challenge_id", id)
    .eq("user_id", user.id)
    .select("current_value,status,completed_at")
    .single();

  if (error || !data) {
    return Response.json(
      { error: "Only a challenge member can update their own progress." },
      { status: 403 },
    );
  }
  return Response.json({ data });
}
