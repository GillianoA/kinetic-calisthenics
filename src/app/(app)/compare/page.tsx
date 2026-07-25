import { startOfWeek } from "date-fns";
import {
  ComparePageClient,
  type PlainComparisonMetric,
} from "@/components/compare-page-client";
import { calculateAccountabilityScore, calculateStreak } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { getLiveDashboardData } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeSummary } from "@/lib/demo-data";

export const metadata = { title: "Compare progress" };

type WorkoutRow = {
  user_id: string;
  workout_date: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  workout_exercises: Array<{ exercise_sets: Array<{ id: string }> }>;
};

export default async function ComparePage() {
  const user = await requireUser();
  const [dashboard, supabase] = await Promise.all([
    getLiveDashboardData(user.id),
    createClient(),
  ]);
  const friendId = dashboard.friend.id;
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().slice(0, 10);
  const [
    { data: workoutRows },
    { data: skillRows },
    { data: targetRows },
    { data: challengeRows },
  ] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "user_id,workout_date,status,start_time,end_time,workout_exercises(exercise_sets(id))",
      )
      .order("workout_date", { ascending: false }),
    supabase
      .from("skill_entries")
      .select("user_id,skill_id,status,recorded_at")
      .order("recorded_at", { ascending: false }),
    supabase
      .rpc("get_accountability_targets"),
    supabase
      .from("challenges")
      .select(
        "id,title,description,starts_on,ends_on,target_value,unit,challenge_members(user_id,current_value)",
      )
      .order("created_at", { ascending: false }),
  ]);
  const workouts = (workoutRows ?? []) as WorkoutRow[];
  const users = [user.id, friendId];
  const values = new Map<
    string,
    {
      weekly: number;
      streak: number;
      total: number;
      pullups: number;
      pushups: number;
      dips: number;
      hold: number;
      skills: number;
    }
  >();
  const accountability = new Map<string, ReturnType<typeof calculateAccountabilityScore>>();

  for (const id of users) {
    const personWorkouts = workouts.filter((workout) => workout.user_id === id);
    const completed = personWorkouts.filter((workout) => workout.status === "completed");
    const records = dashboard.records.filter((record) => record.userId === id);
    const maxRecord = (pattern: RegExp, unit?: string) =>
      Math.max(
        0,
        ...records
          .filter((record) => pattern.test(record.exercise) && (!unit || record.unit === unit))
          .map((record) => record.value),
      );
    const seenSkills = new Set<string>();
    let achievedSkills = 0;
    for (const entry of skillRows ?? []) {
      if (entry.user_id !== id || seenSkills.has(entry.skill_id)) continue;
      seenSkills.add(entry.skill_id);
      if (entry.status === "achieved" || entry.status === "mastered") achievedSkills += 1;
    }
    values.set(id, {
      weekly: completed.filter((workout) => workout.workout_date >= weekStart).length,
      streak: calculateStreak(completed.map((workout) => workout.workout_date)),
      total: completed.length,
      pullups: maxRecord(/pull[\s-]?up/i, "reps"),
      pushups: maxRecord(/push[\s-]?up/i, "reps"),
      dips: maxRecord(/\bdip/i, "reps"),
      hold: Math.max(
        0,
        ...records.filter((record) => record.unit === "sec").map((record) => record.value),
      ),
      skills: achievedSkills,
    });

    const weekly = personWorkouts.filter((workout) => workout.workout_date >= weekStart);
    const completedWeekly = weekly.filter((workout) => workout.status === "completed");
    const targets = (
      (targetRows ?? []) as Array<{
        user_id: string;
        weekly_workout_target: number;
        weekly_skill_practice_target: number;
      }>
    ).find((row) => row.user_id === id);
    const workoutTarget = Number(targets?.weekly_workout_target ?? 4);
    const skillTarget = Number(targets?.weekly_skill_practice_target ?? 2);
    const skillPractice = (skillRows ?? []).filter(
      (entry) => entry.user_id === id && entry.recorded_at.slice(0, 10) >= weekStart,
    ).length;
    const logged = completedWeekly.filter(
      (workout) =>
        workout.start_time &&
        workout.end_time &&
        workout.workout_exercises.some((exercise) => exercise.exercise_sets.length > 0),
    ).length;
    accountability.set(
      id,
      calculateAccountabilityScore({
        plannedWorkouts: workoutTarget,
        completedPlannedWorkouts: completedWeekly.length,
        weeklyWorkoutTarget: workoutTarget,
        workoutsCompleted: new Set(
          completedWeekly.map((workout) => workout.workout_date),
        ).size,
        weeklySkillPracticeTarget: skillTarget,
        skillPracticeSessions: skillPractice,
        workoutsRequiringLogs: completedWeekly.length,
        workoutsLogged: logged,
      }),
    );
  }

  const mine = values.get(user.id)!;
  const friend = values.get(friendId) ?? {
    weekly: 0,
    streak: 0,
    total: 0,
    pullups: 0,
    pushups: 0,
    dips: 0,
    hold: 0,
    skills: 0,
  };
  const plainMetrics: PlainComparisonMetric[] = [
    { key: "weekly", current: String(mine.weekly), friend: String(friend.weekly), context: "Completed since Monday" },
    { key: "streak", current: `${mine.streak} days`, friend: `${friend.streak} days`, context: "Consecutive training days" },
    { key: "total", current: String(mine.total), friend: String(friend.total), context: "All completed logs" },
    { key: "pullups", current: `${mine.pullups} reps`, friend: `${friend.pullups} reps`, context: "Strict-form personal best" },
    { key: "pushups", current: `${mine.pushups} reps`, friend: `${friend.pushups} reps`, context: "Logged personal best" },
    { key: "dips", current: `${mine.dips} reps`, friend: `${friend.dips} reps`, context: "Logged personal best" },
    { key: "hold", current: `${mine.hold} sec`, friend: `${friend.hold} sec`, context: "Longest static record" },
    { key: "skills", current: String(mine.skills), friend: String(friend.skills), context: "Latest achieved or mastered status" },
  ];
  const componentScores = (id: string) => {
    const result = accountability.get(id);
    const asPercent = (points: number | undefined, weight: number) =>
      Math.round(((points ?? 0) / weight) * 100);
    return {
      score: result?.score ?? 0,
      planned: asPercent(
        result?.components.plannedWorkoutsCompleted,
        40,
      ),
      consistency: asPercent(result?.components.consistency, 25),
      skillPractice: asPercent(result?.components.skillPractice, 20),
      logging: asPercent(result?.components.workoutLogging, 15),
    };
  };
  const challenges: ChallengeSummary[] = (challengeRows ?? []).map((challenge) => ({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description ?? "",
    startDate: challenge.starts_on,
    endDate: challenge.ends_on,
    currentUserProgress: Number(
      challenge.challenge_members.find((member) => member.user_id === user.id)?.current_value ?? 0,
    ),
    friendProgress: Number(
      challenge.challenge_members.find((member) => member.user_id === friendId)?.current_value ?? 0,
    ),
    target: Number(challenge.target_value),
    unit: challenge.unit,
    members: challenge.challenge_members.length,
  }));

  return (
    <ComparePageClient
      currentProfile={dashboard.currentUser}
      friendProfile={dashboard.friend}
      plainMetrics={plainMetrics}
      accountabilityData={{
        explanation:
          "40% weekly workout target completion, 25% distinct training days against that target, 20% skill check-ins against the user’s weekly skill target, and 15% completed workouts with start/end times and at least one logged set. Weekly targets are user-defined in Settings.",
        current: componentScores(user.id),
        friend: componentScores(friendId),
      }}
      challenges={challenges}
      records={dashboard.records}
      activityItems={dashboard.activities}
    />
  );
}
