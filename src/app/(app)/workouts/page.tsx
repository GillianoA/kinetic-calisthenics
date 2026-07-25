import { WorkoutHistoryView, type WorkoutHistoryItem } from "@/components/workouts/workout-history-view";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Workouts" };

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireUser();
  const filters = await searchParams;
  const requestedStatus =
    filters.status === "planned" ? "planned" : "completed";
  const supabase = await createClient();
  const [{ data: workouts }, { data: profiles }] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "id,user_id,name,workout_type,workout_date,start_time,end_time,perceived_difficulty,location,workout_exercises(exercise_name,exercise_sets(repetitions,completed,is_personal_record))",
      )
      .eq("status", requestedStatus)
      .order("workout_date", { ascending: false })
      .limit(250),
    supabase.from("profiles").select("id,display_name"),
  ]);
  const names = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );
  const items: WorkoutHistoryItem[] = (workouts ?? []).map((workout) => {
    const sets = workout.workout_exercises.flatMap((exercise) => exercise.exercise_sets);
    return {
      id: workout.id,
      userId: workout.user_id,
      ownerName: names.get(workout.user_id) ?? "Partner",
      isOwner: workout.user_id === user.id,
      name: workout.name,
      type: workout.workout_type.replaceAll("_", " "),
      date: workout.start_time ?? `${workout.workout_date}T12:00:00Z`,
      durationMinutes:
        workout.start_time && workout.end_time
          ? Math.max(
              0,
              Math.round(
                (new Date(workout.end_time).getTime() -
                  new Date(workout.start_time).getTime()) /
                  60000,
              ),
            )
          : 0,
      difficulty: workout.perceived_difficulty,
      location: workout.location,
      exercises: workout.workout_exercises.map((exercise) => exercise.exercise_name),
      totalSets: sets.filter((set) => set.completed).length,
      totalReps: sets.reduce((total, set) => total + Number(set.repetitions ?? 0), 0),
      hasPersonalRecord: sets.some((set) => set.is_personal_record),
    };
  });

  return (
    <WorkoutHistoryView
      workouts={items}
      initialQuery={filters.q?.slice(0, 120) ?? ""}
    />
  );
}
