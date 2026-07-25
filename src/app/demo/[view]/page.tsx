import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ActivityFeed,
  AnalyticsView,
  CompareView,
  DashboardView,
  GoalsView,
  MeasurementsView,
  SettingsView,
  SkillsView,
} from "@/components";
import { ProgressSupplement } from "@/components/progress-supplement";
import {
  WorkoutHistoryView,
  type WorkoutHistoryItem,
} from "@/components/workouts/workout-history-view";
import {
  activities,
  currentUser,
  friendUser,
  measurements,
  skills,
  workouts,
} from "@/lib/demo-data";

const demoViews = [
  "dashboard",
  "workouts",
  "skills",
  "progress",
  "compare",
  "measurements",
  "goals",
  "activity",
  "settings",
] as const;

export const dynamicParams = false;

type DemoView = (typeof demoViews)[number];

const viewTitles: Record<DemoView, string> = {
  dashboard: "Dashboard demo",
  workouts: "Workout history demo",
  skills: "Skill progress demo",
  progress: "Training analytics demo",
  compare: "Partner comparison demo",
  measurements: "Body measurements demo",
  goals: "Goals and challenges demo",
  activity: "Activity feed demo",
  settings: "Settings demo",
};

const demoExercises: Record<string, string[]> = {
  "workout-001": [
    "Strict pull-up",
    "Advanced tuck front lever",
    "Ring row",
  ],
  "workout-002": ["Freestanding handstand", "Wall handstand", "Pike push-up"],
  "workout-003": ["Weighted dip", "Diamond push-up", "Pseudo planche push-up"],
  "workout-004": ["Pistol squat", "Nordic curl", "Single-leg calf raise"],
};

const workoutHistory: WorkoutHistoryItem[] = workouts.map((workout) => ({
  id: workout.id,
  userId: workout.userId,
  ownerName:
    workout.userRole === "current"
      ? currentUser.displayName
      : friendUser.displayName,
  isOwner: workout.userRole === "current",
  name: workout.title,
  type: workout.type,
  date: workout.date,
  durationMinutes: workout.durationMinutes,
  difficulty: workout.difficulty,
  location: workout.userRole === "current" ? "Riverside bars" : "Home studio",
  exercises: demoExercises[workout.id] ?? [],
  totalSets: workout.totalSets,
  totalReps: workout.totalReps,
  hasPersonalRecord: Boolean(workout.isPersonalRecord),
}));

const bodyTrend = measurements.map((measurement) => ({
  label: new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${measurement.date}T00:00:00Z`)),
  weight: measurement.weight,
  bodyFat: measurement.bodyFat ?? null,
}));

const skillMilestones = skills
  .flatMap((skill) =>
    skill.milestones
      .filter(
        (
          milestone,
        ): milestone is typeof milestone & { date: string } =>
          milestone.complete && Boolean(milestone.date),
      )
      .map((milestone, index) => ({
        id: `${skill.id}-${index}`,
        skill: skill.name,
        progression: milestone.label,
        date: milestone.date,
        status: skill.status,
      })),
  )
  .sort((left, right) => right.date.localeCompare(left.date))
  .slice(0, 6);

function isDemoView(view: string): view is DemoView {
  return demoViews.some((candidate) => candidate === view);
}

export function generateStaticParams() {
  return demoViews.map((view) => ({ view }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ view: string }>;
}): Promise<Metadata> {
  const { view } = await params;
  return {
    title: isDemoView(view) ? viewTitles[view] : "Demo",
  };
}

export default async function DemoViewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!isDemoView(view)) notFound();

  switch (view) {
    case "dashboard":
      return <DashboardView />;
    case "workouts":
      return <WorkoutHistoryView workouts={workoutHistory} readOnly />;
    case "skills":
      return <SkillsView />;
    case "progress":
      return (
        <div className="space-y-5">
          <AnalyticsView friendName={friendUser.displayName} />
          <ProgressSupplement
            bodyTrend={bodyTrend}
            skillMilestones={skillMilestones}
          />
        </div>
      );
    case "compare":
      return <CompareView />;
    case "measurements":
      return <MeasurementsView />;
    case "goals":
      return <GoalsView friendName={friendUser.displayName} />;
    case "activity":
      return (
        <ActivityFeed
          items={activities}
          friendName={friendUser.displayName}
        />
      );
    case "settings":
      return <SettingsView />;
  }
}
