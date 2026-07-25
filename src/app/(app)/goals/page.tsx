import { GoalsPageClient } from "@/components/goals-page-client";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeSummary, GoalSummary } from "@/lib/demo-data";

export const metadata = { title: "Goals & challenges" };

function goalType(value: string): GoalSummary["type"] {
  if (value === "repetitions") return "repetitions";
  if (value === "hold_time") return "hold";
  if (value === "workout_frequency" || value === "workout_count") return "frequency";
  if (value === "added_weight") return "weight";
  return "milestone";
}

export default async function GoalsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: goalRows }, { data: challengeRows }, { data: profileRows }] = await Promise.all([
    supabase
      .from("goal_progress_live")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("challenges")
      .select(
        "id,title,description,starts_on,ends_on,target_value,unit,challenge_members(user_id,current_value,status)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,display_name"),
  ]);
  const goals: GoalSummary[] = (goalRows ?? []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    type: goalType(goal.goal_type),
    currentValue: Number(
      goal.effective_current_value ??
        goal.current_value ??
        goal.starting_value ??
        0,
    ),
    targetValue: Number(goal.target_value),
    unit: goal.unit ?? "",
    targetDate: goal.target_date ?? "",
    status:
      goal.status === "completed"
        ? "completed"
        : goal.status === "paused"
          ? "paused"
          : "active",
    tracking: goal.tracking_mode,
    visibility: goal.visibility === "partner" ? "friend" : "private",
  }));
  const challenges: ChallengeSummary[] = (challengeRows ?? []).map((challenge) => {
    const mine = challenge.challenge_members.find((member) => member.user_id === user.id);
    const friend = challenge.challenge_members.find((member) => member.user_id !== user.id);
    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description ?? "",
      startDate: challenge.starts_on,
      endDate: challenge.ends_on,
      currentUserProgress: Number(mine?.current_value ?? 0),
      friendProgress: Number(friend?.current_value ?? 0),
      target: Number(challenge.target_value),
      unit: challenge.unit,
      members: challenge.challenge_members.length,
    };
  });
  const friendName =
    profileRows?.find((profile) => profile.id !== user.id)?.display_name ??
    "Partner";
  return (
    <GoalsPageClient
      goals={goals}
      challenges={challenges}
      friendName={friendName}
    />
  );
}
