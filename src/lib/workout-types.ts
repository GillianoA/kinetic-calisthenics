export const WORKOUT_TYPES = [
  "strength",
  "push",
  "pull",
  "skill",
  "legs",
  "mobility",
  "conditioning",
  "recovery",
  "mixed",
  "custom",
] as const;

export type WorkoutType = (typeof WORKOUT_TYPES)[number];

const workoutTypeSet = new Set<string>(WORKOUT_TYPES);

export function normalizeWorkoutType(value: string): WorkoutType | null {
  const normalized = value.trim().toLowerCase().replaceAll(" ", "_");
  return workoutTypeSet.has(normalized) ? (normalized as WorkoutType) : null;
}
