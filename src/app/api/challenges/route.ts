import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { challengeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = challengeSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { data: partnerId } = await supabase.rpc("get_my_partner_id");
  if (!partnerId) {
    return Response.json(
      { error: "Connect an accountability partner before creating a shared challenge." },
      { status: 409 },
    );
  }
  const value = parsed.data;
  const today = new Date().toISOString().slice(0, 10);
  if (value.endsOn < today) {
    return Response.json(
      { error: "A new challenge must end today or later." },
      { status: 400 },
    );
  }
  const status = value.startsOn > today ? "upcoming" : "active";
  const automatic = value.metricKey === "workouts_completed";
  const unit =
    value.metricKey === "workouts_completed"
      ? "workouts"
      : value.metricKey === "pull_up_repetitions"
        ? "reps"
        : "seconds";
  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({
      created_by: user.id,
      title: value.title,
      description: value.description,
      challenge_type: value.challengeType,
      metric_key: value.metricKey,
      target_value: value.targetValue,
      unit,
      starts_on: value.startsOn,
      ends_on: value.endsOn,
      status,
      visibility: value.visibility,
      scoring_rules: {
        trackingMode: automatic ? "automatic" : "manual",
        calculation: automatic
          ? "Count partner-visible completed workouts dated inside the challenge window."
          : "Each member enters their own cumulative progress. The target comparison has no hidden bonuses.",
        hiddenBonuses: false,
      },
    })
    .select("id")
    .single();
  if (error || !challenge) {
    return Response.json({ error: "Challenge could not be created." }, { status: 400 });
  }

  const { error: memberError } = await supabase.from("challenge_members").insert([
    { challenge_id: challenge.id, user_id: user.id },
    { challenge_id: challenge.id, user_id: partnerId },
  ]);
  if (memberError) {
    await supabase.from("challenges").delete().eq("id", challenge.id).eq("created_by", user.id);
    return Response.json({ error: "Challenge members could not be added." }, { status: 400 });
  }
  return Response.json({ id: challenge.id }, { status: 201 });
}
