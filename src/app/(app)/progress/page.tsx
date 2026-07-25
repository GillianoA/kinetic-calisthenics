import {
  addMonths,
  differenceInCalendarWeeks,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import {
  AnalyticsView,
  type MuscleDistributionItem,
} from "@/components/analytics-view";
import {
  ProgressSupplement,
  type BodyTrendPoint,
  type SkillMilestone,
} from "@/components/progress-supplement";
import { calculateStreak } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { getLiveDashboardData } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Progress & analytics" };

type SetRow = {
  repetitions: number | null;
  hold_seconds: number | null;
  added_weight: number | null;
  completed: boolean;
};

type ExerciseRow = {
  exercise_name: string;
  category: string;
  exercise_sets: SetRow[] | null;
};

type WorkoutRow = {
  id: string;
  user_id: string;
  workout_date: string;
  workout_type: string;
  status: string;
  workout_exercises: ExerciseRow[] | null;
};

type MeasurementRow = {
  measured_at: string;
  weight_kg: number | null;
  body_fat_percentage: number | null;
};

type SkillEntryRow = {
  id: string;
  skill_id: string;
  current_progression_id: string | null;
  status: string;
  achieved_on: string | null;
  recorded_at: string;
};

const categoryColors: Record<string, string> = {
  Pull: "#06b6d4",
  Push: "#8b5cf6",
  Core: "#22c55e",
  Legs: "#f59e0b",
  Mobility: "#94a3b8",
  Other: "#64748b",
};

function longestStreak(dates: string[]) {
  const days = [...new Set(dates.map((date) => date.slice(0, 10)))].sort();
  let longest = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const value of days) {
    const current = new Date(`${value}T12:00:00`);
    if (!previous) run = 1;
    else {
      const gap = Math.round(
        (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000),
      );
      run = gap === 1 ? run + 1 : 1;
    }
    longest = Math.max(longest, run);
    previous = current;
  }
  return longest;
}

function muscleLabel(category: string) {
  if (category === "pull") return "Pull";
  if (category === "push") return "Push";
  if (category === "core") return "Core";
  if (category === "legs") return "Legs";
  if (category === "mobility") return "Mobility";
  return "Other";
}

export default async function ProgressPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const today = new Date();
  const yearAgo = subDays(today, 365).toISOString().slice(0, 10);

  const [dashboard, workoutsResult, measurementsResult, skillEntriesResult, skillsResult, progressionsResult] =
    await Promise.all([
      getLiveDashboardData(user.id),
      supabase
        .from("workouts")
        .select(
          "id,user_id,workout_date,workout_type,status,workout_exercises(exercise_name,category,exercise_sets(repetitions,hold_seconds,added_weight,completed))",
        )
        .gte("workout_date", yearAgo)
        .order("workout_date"),
      supabase
        .from("body_measurements")
        .select("measured_at,weight_kg,body_fat_percentage")
        .eq("user_id", user.id)
        .gte("measured_at", `${yearAgo}T00:00:00.000Z`)
        .order("measured_at"),
      supabase
        .from("skill_entries")
        .select(
          "id,skill_id,current_progression_id,status,achieved_on,recorded_at",
        )
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(30),
      supabase.from("skills").select("id,name"),
      supabase.from("skill_progressions").select("id,name"),
    ]);

  const workouts = (workoutsResult.data ?? []) as unknown as WorkoutRow[];
  const completed = workouts.filter((workout) => workout.status === "completed");
  const own = completed.filter((workout) => workout.user_id === user.id);
  const friendId = dashboard.friend.id;
  const friend = completed.filter(
    (workout) => friendId && workout.user_id === friendId,
  );

  const months = Array.from({ length: 12 }, (_, index) =>
    startOfMonth(addMonths(today, index - 11)),
  );
  const monthlyTrend = months.map((month) => {
    const monthKey = format(month, "yyyy-MM");
    return {
      label: format(month, "MMM"),
      current: own.filter((workout) =>
        workout.workout_date.startsWith(monthKey),
      ).length,
      friend: friend.filter((workout) =>
        workout.workout_date.startsWith(monthKey),
      ).length,
    };
  });

  const exerciseTrend = months.map((month) => {
    const monthKey = format(month, "yyyy-MM");
    const exercises = own
      .filter((workout) => workout.workout_date.startsWith(monthKey))
      .flatMap((workout) => workout.workout_exercises ?? []);
    const pullUpSets = exercises
      .filter((exercise) => /pull[\s-]?up/i.test(exercise.exercise_name))
      .flatMap((exercise) => exercise.exercise_sets ?? []);
    const dipSets = exercises
      .filter((exercise) => /\bdip/i.test(exercise.exercise_name))
      .flatMap((exercise) => exercise.exercise_sets ?? []);
    const allSets = exercises.flatMap(
      (exercise) => exercise.exercise_sets ?? [],
    );
    return {
      label: format(month, "MMM"),
      pullUps: Math.max(0, ...pullUpSets.map((set) => Number(set.repetitions ?? 0))),
      dips: Math.max(0, ...dipSets.map((set) => Number(set.repetitions ?? 0))),
      hold: Math.max(0, ...allSets.map((set) => Number(set.hold_seconds ?? 0))),
      addedWeight: Math.max(
        0,
        ...allSets.map((set) => Number(set.added_weight ?? 0)),
      ),
    };
  });

  const heatmapStart = subDays(today, 83);
  const ownCounts = new Map<string, number>();
  for (const workout of own) {
    ownCounts.set(
      workout.workout_date,
      (ownCounts.get(workout.workout_date) ?? 0) + 1,
    );
  }
  const heatmap = Array.from({ length: 84 }, (_, day) => {
    const date = subDays(today, 83 - day);
    const count = ownCounts.get(format(date, "yyyy-MM-dd")) ?? 0;
    return {
      day: day + 1,
      intensity:
        date < heatmapStart ? 0 : Math.min(3, count),
    };
  });

  const categoryCounts = new Map<string, number>();
  for (const exercise of own.flatMap(
    (workout) => workout.workout_exercises ?? [],
  )) {
    const category = muscleLabel(exercise.category);
    const count = (exercise.exercise_sets ?? []).filter(
      (set) => set.completed,
    ).length;
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + count);
  }
  const totalSets = [...categoryCounts.values()].reduce(
    (total, count) => total + count,
    0,
  );
  const muscleDistribution: MuscleDistributionItem[] = [...categoryCounts]
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({
      name,
      value: totalSets ? Math.round((count / totalSets) * 100) : 0,
      color: categoryColors[name] ?? categoryColors.Other,
    }));

  const thirtyDaysAgo = subDays(today, 30);
  const sixtyDaysAgo = subDays(today, 60);
  const repsInRange = (from: Date, to: Date) =>
    own
      .filter((workout) => {
        const date = new Date(`${workout.workout_date}T12:00:00`);
        return date >= from && date < to;
      })
      .flatMap((workout) => workout.workout_exercises ?? [])
      .flatMap((exercise) => exercise.exercise_sets ?? [])
      .reduce((total, set) => total + Number(set.repetitions ?? 0), 0);
  const currentVolume = repsInRange(thirtyDaysAgo, addMonths(today, 1));
  const previousVolume = repsInRange(sixtyDaysAgo, thirtyDaysAgo);
  const volumeChange =
    previousVolume === 0
      ? currentVolume > 0
        ? "+100%"
        : "0%"
      : `${Math.round(((currentVolume - previousVolume) / previousVolume) * 100)}%`;
  const workoutDates = own.map((workout) => workout.workout_date);
  const historyWeeks = Math.max(
    1,
    differenceInCalendarWeeks(
      today,
      new Date(`${own[0]?.workout_date ?? yearAgo}T12:00:00`),
    ) + 1,
  );
  const currentStreak = calculateStreak(workoutDates, today);
  const skillEntries = (skillEntriesResult.data ?? []) as SkillEntryRow[];
  const latestBySkill = new Map<string, SkillEntryRow>();
  for (const entry of skillEntries) {
    if (!latestBySkill.has(entry.skill_id)) latestBySkill.set(entry.skill_id, entry);
  }
  const latestSkills = [...latestBySkill.values()];
  const achievedSkills = latestSkills.filter(
    (entry) => entry.status === "achieved" || entry.status === "mastered",
  );

  const measurements = (measurementsResult.data ?? []) as MeasurementRow[];
  const bodyTrend: BodyTrendPoint[] = measurements.map((measurement) => ({
    label: format(new Date(measurement.measured_at), "MMM d"),
    weight:
      measurement.weight_kg === null ? null : Number(measurement.weight_kg),
    bodyFat:
      measurement.body_fat_percentage === null
        ? null
        : Number(measurement.body_fat_percentage),
  }));

  const skillNames = new Map(
    (skillsResult.data ?? []).map((skill) => [skill.id, skill.name]),
  );
  const progressionNames = new Map(
    (progressionsResult.data ?? []).map((stage) => [stage.id, stage.name]),
  );
  const skillMilestones: SkillMilestone[] = skillEntries.slice(0, 10).map(
    (entry) => ({
      id: entry.id,
      skill: skillNames.get(entry.skill_id) ?? "Custom skill",
      progression: entry.current_progression_id
        ? progressionNames.get(entry.current_progression_id) ?? "Progression updated"
        : "Baseline recorded",
      date: format(
        new Date(entry.achieved_on ?? entry.recorded_at),
        "MMM d, yyyy",
      ),
      status: entry.status,
    }),
  );

  return (
    <div className="space-y-5">
      <AnalyticsView
        monthlyTrend={monthlyTrend}
        exerciseTrend={exerciseTrend}
        heatmap={heatmap}
        records={dashboard.records}
        muscleDistribution={muscleDistribution}
        friendName={dashboard.friend.displayName}
        summary={{
          weeklyAverage: (own.length / historyWeeks).toFixed(1),
          volumeChange,
          longestStreak: `${longestStreak(workoutDates)} d`,
          currentStreak: `${currentStreak} days`,
          skillsAchieved: String(achievedSkills.length),
          skillsThisPeriod: String(
            achievedSkills.filter(
              (entry) =>
                new Date(entry.achieved_on ?? entry.recorded_at) >=
                startOfWeek(addMonths(today, -6)),
            ).length,
          ),
        }}
        empty={own.length < 2}
      />
      {own.length >= 2 ? (
        <ProgressSupplement
          bodyTrend={bodyTrend}
          skillMilestones={skillMilestones}
        />
      ) : null}
    </div>
  );
}
