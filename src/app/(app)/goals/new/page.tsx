import { GoalForm } from "@/components/forms/goal-form";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Create goal" };

export default async function NewGoalPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: exercises }, { data: skills }] = await Promise.all([
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
  return (
    <GoalForm
      exerciseOptions={exercises ?? []}
      skillOptions={skills ?? []}
    />
  );
}
