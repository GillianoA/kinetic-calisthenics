import type { WorkoutFormValues } from "@/components/workout-log-form";

export type CanonicalWorkoutExercise = {
  exerciseLibraryId?: string;
  exerciseName: string;
  category: string;
  position: number;
  notes?: string;
  sets: Array<{
    setNumber: number;
    repetitions: number;
    holdSeconds?: number;
    addedWeight?: number;
    assistanceWeight?: number;
    distanceMeters?: number;
    restSeconds?: number;
    tempo?: string;
    bandLevel?: string;
    notes?: string;
    completed: boolean;
    isPersonalRecord: boolean;
  }>;
};

function exerciseCategory(value: string) {
  const normalized = value.toLowerCase();
  if (
    ["push", "pull", "legs", "core", "balance", "mobility", "conditioning"].includes(
      normalized,
    )
  ) {
    return normalized;
  }
  if (normalized === "skill") return "balance";
  if (normalized === "cardio") return "conditioning";
  return "other";
}

export function mapWorkoutExercises(
  values: Pick<WorkoutFormValues, "exercises">,
  exerciseCatalog: Array<{ id: string; name: string }> = [],
): CanonicalWorkoutExercise[] {
  const catalogByName = new Map(
    exerciseCatalog.map((exercise) => [
      exercise.name.trim().toLocaleLowerCase(),
      exercise.id,
    ]),
  );
  const catalogById = new Map(exerciseCatalog.map((exercise) => [exercise.id, exercise]));

  return values.exercises.map((exercise, exerciseIndex) => {
    const normalizedName = exercise.name.trim().toLocaleLowerCase();
    const explicitCatalogItem = exercise.exerciseLibraryId
      ? catalogById.get(exercise.exerciseLibraryId)
      : undefined;

    return {
      exerciseLibraryId:
        explicitCatalogItem?.name.trim().toLocaleLowerCase() === normalizedName
          ? explicitCatalogItem.id
          : catalogByName.get(normalizedName),
      exerciseName: exercise.name,
      category: exerciseCategory(exercise.category),
      position: exerciseIndex,
      notes: exercise.notes,
      sets: exercise.sets.map((set, index) => ({
        setNumber: index + 1,
        repetitions: set.repetitions,
        holdSeconds: set.holdDuration,
        addedWeight: set.addedWeight,
        assistanceWeight: set.assistanceWeight,
        distanceMeters: set.distance,
        restSeconds: set.restDuration,
        tempo: set.tempo,
        bandLevel: set.bandLevel,
        notes: set.notes,
        completed: set.completed,
        isPersonalRecord: set.personalRecord,
      })),
    };
  });
}
