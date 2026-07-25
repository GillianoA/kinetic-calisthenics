import "server-only";

import {
  addDays,
  format,
  isAfter,
  isSameDay,
  startOfWeek,
  subDays,
} from "date-fns";
import { calculateStreak } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";
import type { ActivityItem, SkillSummary, WorkoutSummary } from "@/lib/demo-data";

type ProfileRecord = {
  id: string;
  display_name: string;
};

type SetRecord = {
  repetitions: number | null;
  hold_seconds: number | null;
  added_weight: number | null;
  completed: boolean;
  is_personal_record: boolean;
};

type ExerciseRecord = {
  id: string;
  exercise_sets: SetRecord[] | null;
};

type WorkoutRecord = {
  id: string;
  user_id: string;
  name: string;
  workout_type: string;
  workout_date: string;
  start_time: string | null;
  end_time: string | null;
  perceived_difficulty: number | null;
  status: string;
  workout_exercises: ExerciseRecord[] | null;
};

function normalizeSkillCategory(value: string): SkillSummary["category"] {
  if (["push", "pull", "core", "balance", "legs"].includes(value)) {
    return value as SkillSummary["category"];
  }
  if (value === "dynamic") return "pull";
  if (value === "mobility") return "balance";
  return "core";
}

function normalizeActivityKind(value: string): ActivityItem["kind"] {
  if (value === "workout_completed") return "workout";
  if (value === "personal_record") return "record";
  if (value === "skill_progress" || value === "skill_achieved") return "skill";
  if (value === "goal_completed") return "goal";
  if (value === "challenge_joined") return "challenge";
  return "encouragement";
}

function normalizeReaction(
  value: string,
): ActivityItem["reactions"][number]["label"] {
  if (value === "new_record") return "New record";
  if (value === "keep_going") return "Keep going";
  if (value === "respect") return "Respect";
  return "Strong work";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function durationMinutes(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

function summarizeWorkout(workout: WorkoutRecord, viewerId: string): WorkoutSummary {
  const sets = (workout.workout_exercises ?? []).flatMap(
    (exercise) => exercise.exercise_sets ?? [],
  );
  return {
    id: workout.id,
    userId: workout.user_id,
    userRole: workout.user_id === viewerId ? "current" : "friend",
    title: workout.name,
    type: workout.workout_type.replaceAll("_", " "),
    date: workout.start_time ?? `${workout.workout_date}T12:00:00.000Z`,
    durationMinutes: durationMinutes(workout.start_time, workout.end_time),
    exerciseCount: workout.workout_exercises?.length ?? 0,
    totalSets: sets.filter((set) => set.completed).length,
    totalReps: sets.reduce((total, set) => total + Number(set.repetitions ?? 0), 0),
    difficulty: workout.perceived_difficulty ?? 0,
    isPersonalRecord: sets.some((set) => set.is_personal_record),
  };
}

export async function getLiveDashboardData(viewerId: string) {
  const supabase = await createClient();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const historyStart = subDays(today, 365).toISOString().slice(0, 10);

  const [
    profilesResult,
    workoutsResult,
    measurementsResult,
    skillsResult,
    progressionsResult,
    skillEntriesResult,
    recordsResult,
    activityResult,
    totalWorkoutsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("workouts")
      .select(
        "id,user_id,name,workout_type,workout_date,start_time,end_time,perceived_difficulty,status,workout_exercises(id,exercise_sets(repetitions,hold_seconds,added_weight,completed,is_personal_record))",
      )
      .gte("workout_date", historyStart)
      .order("workout_date", { ascending: false }),
    supabase
      .from("body_measurements")
      .select("user_id,measured_at,weight_kg")
      .eq("user_id", viewerId)
      .not("weight_kg", "is", null)
      .order("measured_at", { ascending: false })
      .limit(1),
    supabase.from("skills").select("id,name,category,difficulty_order"),
    supabase
      .from("skill_progressions")
      .select("id,skill_id,name,stage_order")
      .order("stage_order"),
    supabase
      .from("skill_entries")
      .select(
        "id,user_id,skill_id,current_progression_id,target_progression_id,best_hold_seconds,max_repetitions,added_weight,confidence_rating,technique_rating,status,recorded_at",
      )
      .order("recorded_at", { ascending: false }),
    supabase
      .from("personal_records")
      .select(
        "id,user_id,record_name,record_type,value,previous_value,unit,achieved_at",
      )
      .order("achieved_at", { ascending: false })
      .limit(20),
    supabase
      .from("activity_feed")
      .select(
        "id,user_id,activity_type,title,message,metadata,occurred_at,reactions(reaction,user_id)",
      )
      .order("occurred_at", { ascending: false })
      .limit(30),
    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", viewerId)
      .eq("status", "completed"),
  ]);

  const profiles = (profilesResult.data ?? []) as ProfileRecord[];
  const currentProfile =
    profiles.find((profile) => profile.id === viewerId) ??
    ({ id: viewerId, display_name: "Athlete" } satisfies ProfileRecord);
  const friendProfile = profiles.find((profile) => profile.id !== viewerId);
  const workouts = (workoutsResult.data ?? []) as unknown as WorkoutRecord[];
  const ownWorkouts = workouts.filter(
    (workout) => workout.user_id === viewerId && workout.status === "completed",
  );
  const recentWorkouts = workouts
    .filter((workout) => workout.status === "completed")
    .map((workout) => summarizeWorkout(workout, viewerId));
  const planned = workouts.find(
    (workout) =>
      workout.user_id === viewerId &&
      workout.status === "planned" &&
      isAfter(new Date(`${workout.workout_date}T23:59:59`), today),
  );

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const workoutTrend = weekDays.map((day) => ({
    label: format(day, "EEE").slice(0, 3),
    current: workouts.filter(
      (workout) =>
        workout.user_id === viewerId &&
        workout.status === "completed" &&
        isSameDay(new Date(`${workout.workout_date}T12:00:00`), day),
    ).length,
    friend: friendProfile
      ? workouts.filter(
          (workout) =>
            workout.user_id === friendProfile.id &&
            workout.status === "completed" &&
            isSameDay(new Date(`${workout.workout_date}T12:00:00`), day),
        ).length
      : 0,
    volume: workouts
      .filter(
        (workout) =>
          workout.user_id === viewerId &&
          isSameDay(new Date(`${workout.workout_date}T12:00:00`), day),
      )
      .flatMap((workout) => workout.workout_exercises ?? [])
      .flatMap((exercise) => exercise.exercise_sets ?? [])
      .reduce((total, set) => total + Number(set.repetitions ?? 0), 0),
  }));

  const skillDefinitions = new Map(
    ((skillsResult.data ?? []) as Array<{
      id: string;
      name: string;
      category: SkillSummary["category"] | "other";
    }>).map((skill) => [skill.id, skill]),
  );
  const stagesBySkill = new Map<
    string,
    Array<{ id: string; name: string; stage_order: number }>
  >();
  for (const stage of (progressionsResult.data ?? []) as Array<{
    id: string;
    skill_id: string;
    name: string;
    stage_order: number;
  }>) {
    const stages = stagesBySkill.get(stage.skill_id) ?? [];
    stages.push(stage);
    stagesBySkill.set(stage.skill_id, stages);
  }

  const seenSkills = new Set<string>();
  const skillSummaries: SkillSummary[] = [];
  for (const entry of (skillEntriesResult.data ?? []) as Array<{
    id: string;
    user_id: string;
    skill_id: string;
    current_progression_id: string | null;
    target_progression_id: string | null;
    best_hold_seconds: number | null;
    max_repetitions: number | null;
    added_weight: number | null;
    confidence_rating: number | null;
    technique_rating: number | null;
    status: SkillSummary["status"];
    recorded_at: string;
  }>) {
    if (entry.user_id !== viewerId || seenSkills.has(entry.skill_id)) continue;
    seenSkills.add(entry.skill_id);
    const definition = skillDefinitions.get(entry.skill_id);
    if (!definition) continue;
    const stages = (stagesBySkill.get(entry.skill_id) ?? []).sort(
      (a, b) => a.stage_order - b.stage_order,
    );
    const currentIndex = stages.findIndex((stage) => stage.id === entry.current_progression_id);
    const currentStage = stages[currentIndex];
    const targetStage = stages.find((stage) => stage.id === entry.target_progression_id);
    const bestLabel = entry.best_hold_seconds
      ? `${entry.best_hold_seconds} sec`
      : entry.max_repetitions
        ? `${entry.max_repetitions} reps`
        : entry.added_weight
          ? `+${entry.added_weight} kg`
          : currentStage?.name ?? "Baseline";
    skillSummaries.push({
      id: entry.skill_id,
      userId: viewerId,
      name: definition.name,
      category: normalizeSkillCategory(definition.category),
      progression: currentStage?.name ?? "Not started",
      target: targetStage?.name ?? stages.at(-1)?.name ?? "Define a target",
      completedStages: Math.max(0, currentIndex + 1),
      totalStages: stages.length,
      bestLabel,
      confidence: entry.confidence_rating ?? 0,
      technique: entry.technique_rating ?? 0,
      status: entry.status,
      updatedAt: entry.recorded_at.slice(0, 10),
      milestones: stages.map((stage, index) => ({
        label: stage.name,
        complete: index <= currentIndex,
      })),
    });
  }

  const activities: ActivityItem[] = (
    (activityResult.data ?? []) as Array<{
      id: string;
      user_id: string;
      activity_type: string;
      title: string;
      message: string | null;
      metadata: Record<string, unknown>;
      occurred_at: string;
      reactions: Array<{ reaction: string; user_id: string }>;
    }>
  ).map((activity) => {
    const actor =
      profiles.find((profile) => profile.id === activity.user_id) ?? currentProfile;
    const reactionGroups = new Map<
      ActivityItem["reactions"][number]["label"],
      { count: number; reacted: boolean }
    >();
    for (const reaction of activity.reactions ?? []) {
      const label = normalizeReaction(reaction.reaction);
      const current = reactionGroups.get(label) ?? {
        count: 0,
        reacted: false,
      };
      current.count += 1;
      current.reacted ||= reaction.user_id === viewerId;
      reactionGroups.set(label, current);
    }
    const recordType = String(activity.metadata?.recordType ?? "");
    const recordValue = Number(activity.metadata?.value);
    const recordUnit: NonNullable<ActivityItem["recordMetric"]>["unit"] =
      recordType === "hold_seconds"
        ? "sec"
        : recordType === "added_weight" ||
            recordType === "assistance_weight"
          ? "kg"
          : recordType === "distance"
            ? "m"
            : "reps";
    return {
      id: activity.id,
      userId: activity.user_id,
      userRole: activity.user_id === viewerId ? "current" : "friend",
      userName: actor.display_name,
      userInitials: initials(actor.display_name),
      kind: normalizeActivityKind(activity.activity_type),
      title: activity.title,
      detail: activity.message ?? "",
      recordMetric:
        activity.activity_type === "personal_record" &&
        Number.isFinite(recordValue)
          ? { value: recordValue, unit: recordUnit }
          : undefined,
      createdAt: activity.occurred_at,
      reactions: [...reactionGroups.entries()].map(([label, values]) => ({
        label,
        ...values,
      })),
    };
  });

  const records = (
    (recordsResult.data ?? []) as Array<{
      id: string;
      user_id: string;
      record_name: string;
      record_type: string;
      value: number;
      previous_value: number | null;
      unit: string;
      achieved_at: string;
    }>
  ).map((record) => ({
    id: record.id,
    userId: record.user_id,
    userRole: record.user_id === viewerId ? ("current" as const) : ("friend" as const),
    exercise: record.record_name,
    value: Number(record.value),
    unit:
      record.record_type === "hold_seconds"
        ? ("sec" as const)
        : record.record_type === "added_weight" ||
            record.record_type === "assistance_weight"
          ? ("kg" as const)
          : record.record_type === "distance"
            ? ("m" as const)
            : ("reps" as const),
    date: record.achieved_at.slice(0, 10),
    delta:
      record.previous_value == null
        ? undefined
        : Number(record.value) - Number(record.previous_value),
  }));

  const ownWeekWorkouts = workoutTrend.reduce((sum, day) => sum + day.current, 0);
  const weeklyVolume = workoutTrend.reduce((sum, day) => sum + day.volume, 0);
  const skillProgressValues = skillSummaries
    .filter((skill) => skill.totalStages > 0)
    .map((skill) => skill.completedStages / skill.totalStages);

  return {
    currentUser: {
      id: viewerId,
      displayName: currentProfile.display_name,
      initials: initials(currentProfile.display_name),
      role: "current" as const,
      accent: "cyan" as const,
      joinedAt: "",
    },
    friend: friendProfile
      ? {
          id: friendProfile.id,
          displayName: friendProfile.display_name,
          initials: initials(friendProfile.display_name),
          role: "friend" as const,
          accent: "violet" as const,
          joinedAt: "",
        }
      : {
          id: "unconnected",
          displayName: "Your future partner",
          initials: "YP",
          role: "friend" as const,
          accent: "violet" as const,
          joinedAt: "",
        },
    stats: {
      streak: calculateStreak(ownWorkouts.map((workout) => workout.workout_date), today),
      workoutsThisWeek: ownWeekWorkouts,
      totalWorkouts: totalWorkoutsResult.count ?? ownWorkouts.length,
      currentWeight: Number(measurementsResult.data?.[0]?.weight_kg ?? 0),
      weeklyVolume,
      skillProgress:
        skillProgressValues.length === 0
          ? 0
          : Math.round(
              (skillProgressValues.reduce((sum, value) => sum + value, 0) /
                skillProgressValues.length) *
                100,
            ),
    },
    upcomingWorkout: planned
      ? {
          title: planned.name,
          dateLabel: format(new Date(`${planned.workout_date}T12:00:00`), "EEE, MMM d"),
          durationLabel: `${durationMinutes(planned.start_time, planned.end_time) || 60} min`,
        }
      : {
          title: "Plan your next session",
          dateLabel: "No planned workout yet",
          durationLabel: "Set a training time",
        },
    workoutTrend,
    workouts: recentWorkouts,
    skills: skillSummaries,
    records,
    activities,
  };
}
