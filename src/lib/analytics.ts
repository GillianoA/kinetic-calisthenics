import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

export const ACCOUNTABILITY_WEIGHTS = {
  plannedWorkoutsCompleted: 40,
  consistency: 25,
  skillPractice: 20,
  workoutLogging: 15,
} as const;

export type AccountabilityInputs = {
  plannedWorkouts: number;
  completedPlannedWorkouts: number;
  weeklyWorkoutTarget: number;
  workoutsCompleted: number;
  weeklySkillPracticeTarget: number;
  skillPracticeSessions: number;
  workoutsRequiringLogs: number;
  workoutsLogged: number;
};

const ratio = (value: number, target: number) => {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, value / target));
};

export function calculateAccountabilityScore(input: AccountabilityInputs) {
  const components = {
    plannedWorkoutsCompleted:
      ratio(input.completedPlannedWorkouts, input.plannedWorkouts) *
      ACCOUNTABILITY_WEIGHTS.plannedWorkoutsCompleted,
    consistency:
      ratio(input.workoutsCompleted, input.weeklyWorkoutTarget) *
      ACCOUNTABILITY_WEIGHTS.consistency,
    skillPractice:
      ratio(input.skillPracticeSessions, input.weeklySkillPracticeTarget) *
      ACCOUNTABILITY_WEIGHTS.skillPractice,
    workoutLogging:
      ratio(input.workoutsLogged, input.workoutsRequiringLogs) *
      ACCOUNTABILITY_WEIGHTS.workoutLogging,
  };

  return {
    score: Math.round(
      components.plannedWorkoutsCompleted +
        components.consistency +
        components.skillPractice +
        components.workoutLogging,
    ),
    components,
    explanation:
      "40% planned sessions completed + 25% weekly workout target + 20% skill-practice target + 15% completed workout logs. Each component is capped at its weight.",
  };
}

export type ProgressionStage = {
  id: string;
  order: number;
};

export function calculateProgressionPercent(
  stages: ProgressionStage[],
  currentStageId?: string | null,
) {
  if (stages.length === 0 || !currentStageId) return null;
  const ordered = [...stages].sort((a, b) => a.order - b.order);
  const currentIndex = ordered.findIndex((stage) => stage.id === currentStageId);
  if (currentIndex < 0) return null;
  return Math.round(((currentIndex + 1) / ordered.length) * 100);
}

export function calculateStreak(dateValues: string[], today = new Date()) {
  const uniqueDays = [...new Set(dateValues.map((value) => value.slice(0, 10)))]
    .map((value) => startOfDay(parseISO(value)))
    .sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDays.length === 0) return 0;

  const firstGap = differenceInCalendarDays(startOfDay(today), uniqueDays[0]);
  if (firstGap > 1) return 0;

  let streak = 1;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    if (differenceInCalendarDays(uniqueDays[index - 1], uniqueDays[index]) !== 1) break;
    streak += 1;
  }

  return streak;
}
