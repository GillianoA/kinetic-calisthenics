import { notFound } from "next/navigation";
import { GoalForm } from "@/components/forms/goal-form";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit goal" };

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: goal }, { data: exercises }, { data: skills }] = await Promise.all([
    supabase
      .from("goal_progress_live")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("exercise_library")
      .select("id,name")
      .or(`owner_id.is.null,owner_id.eq.${user.id}`)
      .order("name"),
    supabase
      .from("skills")
      .select("id,name")
      .or(`owner_id.is.null,owner_id.eq.${user.id}`)
      .order("difficulty_order")
      .order("name"),
  ]);
  if (!goal) notFound();
  return (
    <GoalForm
      goalId={goal.id}
      exerciseOptions={exercises ?? []}
      skillOptions={skills ?? []}
      initialValues={{
        title: goal.title,
        goalType: goal.goal_type,
        exerciseLibraryId: goal.exercise_library_id ?? "",
        skillId: goal.skill_id ?? "",
        startingValue: Number(goal.starting_value ?? 0),
        targetValue: Number(goal.target_value),
        currentValue: Number(
          goal.effective_current_value ?? goal.current_value ?? 0,
        ),
        unit: goal.unit ?? "",
        startDate: goal.start_date,
        targetDate: goal.target_date ?? "",
        status:
          goal.status === "not_started" ? "active" : goal.status,
        notes: goal.notes ?? "",
        visibility: goal.visibility,
        trackingMode: goal.tracking_mode,
      }}
    />
  );
}
