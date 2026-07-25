import { describe, expect, it } from "vitest";

import {
  challengeProgressSchema,
  challengeSchema,
  goalSchema,
  invitationCodeSchema,
  measurementSchema,
  passwordSchema,
  reactionSchema,
  settingsSchema,
  signUpSchema,
  skillEntrySchema,
  workoutSchema,
} from "@/lib/validation";

const validUuid = "00000000-0000-4000-8000-000000000001";

function validWorkout() {
  return {
    workoutDate: "2026-07-23",
    startTime: "18:00",
    endTime: "19:10",
    name: "Pull strength",
    workoutType: "strength",
    perceivedDifficulty: "8",
    energyLevel: 7,
    visibility: "partner" as const,
    exercises: [
      {
        exerciseName: "Pull-up",
        category: "pull",
        position: 0,
        sets: [
          {
            setNumber: 1,
            repetitions: "10",
            addedWeight: "",
            completed: true,
            isPersonalRecord: false,
          },
        ],
      },
    ],
  };
}

describe("authentication validation", () => {
  it("normalizes an email and accepts a strong matching password", () => {
    const result = signUpSchema.parse({
      displayName: "  Gilliano  ",
      email: "  GILLIANO@EXAMPLE.COM ",
      password: "Calisthenics9",
      confirmPassword: "Calisthenics9",
    });

    expect(result.displayName).toBe("Gilliano");
    expect(result.email).toBe("gilliano@example.com");
  });

  it.each([
    ["too short", "Short1A"],
    ["missing uppercase", "calisthenics9"],
    ["missing lowercase", "CALISTHENICS9"],
    ["missing number", "Calisthenics"],
  ])("rejects a password that is %s", (_reason, password) => {
    expect(passwordSchema.safeParse(password).success).toBe(false);
  });

  it("reports a confirmation mismatch on confirmPassword", () => {
    const result = signUpSchema.safeParse({
      displayName: "Training Partner",
      email: "partner@example.com",
      password: "Calisthenics9",
      confirmPassword: "Different9A",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["confirmPassword"],
            message: "Passwords do not match",
          }),
        ]),
      );
    }
  });
});

describe("workout validation", () => {
  it("parses nested exercises and converts numeric form values", () => {
    const parsed = workoutSchema.parse(validWorkout());

    expect(parsed.perceivedDifficulty).toBe(8);
    expect(parsed.status).toBe("completed");
    expect(parsed.exercises[0].sets[0].repetitions).toBe(10);
    expect(parsed.exercises[0].sets[0].addedWeight).toBeUndefined();
  });

  it.each(["push", "pull", "legs"] as const)(
    "accepts the visible %s workout type as its own persisted value",
    (workoutType) => {
      const parsed = workoutSchema.parse({ ...validWorkout(), workoutType });

      expect(parsed.workoutType).toBe(workoutType);
    },
  );

  it("rejects unsupported workout types before they reach PostgreSQL", () => {
    expect(
      workoutSchema.safeParse({
        ...validWorkout(),
        workoutType: "unsupported",
      }).success,
    ).toBe(false);
  });

  it("rejects an end time before the start time", () => {
    const workout = validWorkout();
    workout.endTime = "17:59";

    const result = workoutSchema.safeParse(workout);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["endTime"],
            message: "End time must be after start time",
          }),
        ]),
      );
    }
  });

  it("requires at least one exercise and one set", () => {
    const withoutExercises = { ...validWorkout(), exercises: [] };
    const withoutSets = validWorkout();
    withoutSets.exercises[0].sets = [];

    expect(workoutSchema.safeParse(withoutExercises).success).toBe(false);
    expect(workoutSchema.safeParse(withoutSets).success).toBe(false);
  });

  it("rejects out-of-range ratings and non-numeric values", () => {
    const tooDifficult = { ...validWorkout(), perceivedDifficulty: "11" };
    const notNumeric = { ...validWorkout(), energyLevel: "high" };

    expect(workoutSchema.safeParse(tooDifficult).success).toBe(false);
    expect(workoutSchema.safeParse(notNumeric).success).toBe(false);
  });
});

describe("measurement and skill validation", () => {
  it("accepts form-number strings and applies private measurement defaults", () => {
    const parsed = measurementSchema.parse({
      measuredAt: "2026-07-23",
      weightKg: "78.4",
      waistCm: "81.5",
    });

    expect(parsed.weightKg).toBe(78.4);
    expect(parsed.waistCm).toBe(81.5);
    expect(parsed.photoPaths).toEqual([]);
    expect(parsed.visibility).toBe("private");
  });

  it("rejects implausible measurements and too many photo paths", () => {
    expect(
      measurementSchema.safeParse({
        measuredAt: "2026-07-23",
        weightKg: 501,
      }).success,
    ).toBe(false);

    expect(
      measurementSchema.safeParse({
        measuredAt: "2026-07-23",
        photoPaths: Array.from({ length: 7 }, (_, index) => `photo-${index}.webp`),
      }).success,
    ).toBe(false);
  });

  it("rejects an empty measurement record", () => {
    const result = measurementSchema.safeParse({
      measuredAt: "2026-07-23",
      notes: "No numeric values yet",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["weightKg"],
            message: "Add at least one measurement",
          }),
        ]),
      );
    }
  });

  it("validates skill identifiers, ratings, status, and defaults", () => {
    const parsed = skillEntrySchema.parse({
      skillId: validUuid,
      bestHoldSeconds: "12.5",
      confidenceRating: 7,
      techniqueRating: 8,
      status: "developing",
    });

    expect(parsed.bestHoldSeconds).toBe(12.5);
    expect(parsed.visibility).toBe("partner");
    expect(
      skillEntrySchema.safeParse({
        skillId: validUuid,
        confidenceRating: 11,
        status: "developing",
      }).success,
    ).toBe(false);
  });
});

describe("goal, reaction, and settings validation", () => {
  it("rejects a goal whose target date precedes its start date", () => {
    const result = goalSchema.safeParse({
      title: "Hold an L-sit for 20 seconds",
      goalType: "hold_time",
      startingValue: 5,
      currentValue: 10,
      targetValue: 20,
      startDate: "2026-07-23",
      targetDate: "2026-07-22",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["targetDate"],
            message: "Target date must be on or after the start date",
          }),
        ]),
      );
    }
  });

  it("requires an unambiguous source for automatically tracked record goals", () => {
    const baseGoal = {
      title: "Complete 10 strict pull-ups",
      goalType: "repetitions" as const,
      startingValue: 5,
      currentValue: 5,
      targetValue: 10,
      startDate: "2026-07-23",
      trackingMode: "automatic" as const,
    };

    expect(goalSchema.safeParse(baseGoal).success).toBe(false);
    expect(
      goalSchema.safeParse({
        ...baseGoal,
        exerciseLibraryId: validUuid,
      }).success,
    ).toBe(true);
    expect(
      goalSchema.safeParse({
        ...baseGoal,
        exerciseLibraryId: validUuid,
        skillId: "00000000-0000-4000-8000-000000000002",
      }).success,
    ).toBe(false);
  });

  it("requires a bound skill and target one for automatic skill milestones", () => {
    const automaticSkill = {
      title: "Achieve a muscle-up",
      goalType: "skill" as const,
      startingValue: 0,
      currentValue: 0,
      targetValue: 1,
      startDate: "2026-07-23",
      trackingMode: "automatic" as const,
      skillId: validUuid,
    };

    expect(goalSchema.safeParse(automaticSkill).success).toBe(true);
    expect(goalSchema.safeParse({ ...automaticSkill, skillId: undefined }).success).toBe(false);
    expect(goalSchema.safeParse({ ...automaticSkill, targetValue: 2 }).success).toBe(false);
  });

  it("uses fixed challenge metrics and validates safe manual progress", () => {
    const challenge = {
      title: "Five minutes of handstand practice",
      challengeType: "cumulative" as const,
      metricKey: "skill_practice_seconds" as const,
      targetValue: 300,
      unit: "seconds",
      startsOn: "2026-07-23",
      endsOn: "2026-08-23",
      visibility: "partner" as const,
    };

    expect(challengeSchema.safeParse(challenge).success).toBe(true);
    expect(
      challengeSchema.safeParse({
        ...challenge,
        metricKey: "arbitrary_unimplemented_metric",
      }).success,
    ).toBe(false);
    expect(challengeProgressSchema.safeParse({ currentValue: 125.5 }).success).toBe(true);
    expect(challengeProgressSchema.safeParse({ currentValue: -1 }).success).toBe(false);
  });

  it("accepts only the four fixed encouragement reactions", () => {
    expect(
      reactionSchema.safeParse({
        activityId: validUuid,
        reaction: "strong_work",
      }).success,
    ).toBe(true);
    expect(
      reactionSchema.safeParse({
        activityId: validUuid,
        reaction: "unrestricted_comment",
      }).success,
    ).toBe(false);
  });

  it("bounds default workout duration in settings", () => {
    const baseSettings = {
      displayName: "Gilliano",
      timezone: "America/Caracas",
      measurementSharing: "summary",
      progressPhotoVisibility: "partner",
      shareActivity: true,
      unitPreference: "metric",
      themePreference: "system",
      weeklyWorkoutTarget: 4,
      weeklySkillPracticeTarget: 2,
      reducedMotion: false,
      realtimeUpdates: true,
    } as const;

    expect(
      settingsSchema.safeParse({
        ...baseSettings,
        defaultWorkoutDurationMinutes: 60,
      }).success,
    ).toBe(true);
    expect(
      settingsSchema.safeParse({
        ...baseSettings,
        defaultWorkoutDurationMinutes: 481,
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...baseSettings,
        defaultWorkoutDurationMinutes: 60,
        weeklyWorkoutTarget: 0,
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...baseSettings,
        defaultWorkoutDurationMinutes: 60,
        weeklySkillPracticeTarget: 15,
      }).success,
    ).toBe(false);
  });
});

describe("invitation validation", () => {
  it("normalizes a valid invitation code", () => {
    expect(invitationCodeSchema.parse(` ${"A".repeat(36)} `)).toBe("a".repeat(36));
  });

  it.each(["a".repeat(35), "a".repeat(37), "g".repeat(36), `${"a".repeat(18)}-${"b".repeat(17)}`])(
    "rejects malformed code %s",
    (code) => {
      expect(invitationCodeSchema.safeParse(code).success).toBe(false);
    },
  );
});
