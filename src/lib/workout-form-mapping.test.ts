import { describe, expect, it } from "vitest";

import { mapWorkoutExercises } from "@/lib/workout-form-mapping";

describe("workout form mapping", () => {
  it("preserves heterogeneous values and flags for every set", () => {
    const [exercise] = mapWorkoutExercises({
      exercises: [
        {
          name: "Strict pull-up",
          category: "Pull",
          notes: "Keep every rep strict",
          sets: [
            {
              repetitions: 10,
              holdDuration: 0,
              addedWeight: 0,
              assistanceWeight: 0,
              distance: 0,
              restDuration: 90,
              tempo: "2-1-X-1",
              bandLevel: "",
              notes: "Warm-up",
              completed: true,
              personalRecord: false,
            },
            {
              repetitions: 6,
              holdDuration: 0,
              addedWeight: 12.5,
              assistanceWeight: 0,
              distance: 0,
              restDuration: 150,
              tempo: "",
              bandLevel: "",
              notes: "Top set",
              completed: true,
              personalRecord: true,
            },
            {
              repetitions: 4,
              holdDuration: 0,
              addedWeight: 15,
              assistanceWeight: 0,
              distance: 0,
              restDuration: 180,
              tempo: "",
              bandLevel: "",
              notes: "Stopped before form broke",
              completed: false,
              personalRecord: false,
            },
          ],
        },
      ],
    });

    expect(exercise.notes).toBe("Keep every rep strict");
    expect(exercise.sets).toEqual([
      expect.objectContaining({
        setNumber: 1,
        repetitions: 10,
        restSeconds: 90,
        notes: "Warm-up",
      }),
      expect.objectContaining({
        setNumber: 2,
        repetitions: 6,
        addedWeight: 12.5,
        restSeconds: 150,
        isPersonalRecord: true,
      }),
      expect.objectContaining({
        setNumber: 3,
        repetitions: 4,
        addedWeight: 15,
        completed: false,
      }),
    ]);
  });

  it("binds a catalog exercise by name without keeping a stale edited ID", () => {
    const [exercise] = mapWorkoutExercises(
      {
        exercises: [
          {
            exerciseLibraryId: "20000000-0000-4000-8000-000000000001",
            name: "Pull-Up",
            category: "Pull",
            notes: "",
            sets: [
              {
                repetitions: 10,
                holdDuration: 0,
                addedWeight: 0,
                assistanceWeight: 0,
                distance: 0,
                restDuration: 90,
                tempo: "",
                bandLevel: "",
                notes: "",
                completed: true,
                personalRecord: true,
              },
            ],
          },
        ],
      },
      [
        {
          id: "20000000-0000-4000-8000-000000000001",
          name: "Push-Up",
        },
        {
          id: "20000000-0000-4000-8000-000000000004",
          name: "Pull-Up",
        },
      ],
    );

    expect(exercise.exerciseLibraryId).toBe(
      "20000000-0000-4000-8000-000000000004",
    );
  });
});
