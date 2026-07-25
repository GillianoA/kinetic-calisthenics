import { describe, expect, it } from "vitest";

import {
  ACCOUNTABILITY_WEIGHTS,
  calculateAccountabilityScore,
  calculateProgressionPercent,
  calculateStreak,
} from "@/lib/analytics";

describe("calculateAccountabilityScore", () => {
  it("returns 100 when every transparent target is met", () => {
    const result = calculateAccountabilityScore({
      plannedWorkouts: 4,
      completedPlannedWorkouts: 4,
      weeklyWorkoutTarget: 4,
      workoutsCompleted: 4,
      weeklySkillPracticeTarget: 2,
      skillPracticeSessions: 2,
      workoutsRequiringLogs: 4,
      workoutsLogged: 4,
    });

    expect(result.score).toBe(100);
    expect(result.components).toEqual(ACCOUNTABILITY_WEIGHTS);
    expect(result.explanation).toContain("40%");
  });

  it("calculates each partial component independently", () => {
    const result = calculateAccountabilityScore({
      plannedWorkouts: 4,
      completedPlannedWorkouts: 2,
      weeklyWorkoutTarget: 4,
      workoutsCompleted: 2,
      weeklySkillPracticeTarget: 4,
      skillPracticeSessions: 1,
      workoutsRequiringLogs: 2,
      workoutsLogged: 1,
    });

    expect(result.components).toEqual({
      plannedWorkoutsCompleted: 20,
      consistency: 12.5,
      skillPractice: 5,
      workoutLogging: 7.5,
    });
    expect(result.score).toBe(45);
  });

  it("caps overachievement and never awards negative points", () => {
    const overTarget = calculateAccountabilityScore({
      plannedWorkouts: 1,
      completedPlannedWorkouts: 4,
      weeklyWorkoutTarget: 1,
      workoutsCompleted: 7,
      weeklySkillPracticeTarget: 1,
      skillPracticeSessions: 5,
      workoutsRequiringLogs: 1,
      workoutsLogged: 4,
    });
    const negative = calculateAccountabilityScore({
      plannedWorkouts: 4,
      completedPlannedWorkouts: -1,
      weeklyWorkoutTarget: 4,
      workoutsCompleted: -1,
      weeklySkillPracticeTarget: 2,
      skillPracticeSessions: -1,
      workoutsRequiringLogs: 4,
      workoutsLogged: -1,
    });

    expect(overTarget.score).toBe(100);
    expect(negative.score).toBe(0);
  });

  it("awards zero for categories whose target denominator is zero", () => {
    const result = calculateAccountabilityScore({
      plannedWorkouts: 0,
      completedPlannedWorkouts: 3,
      weeklyWorkoutTarget: 0,
      workoutsCompleted: 3,
      weeklySkillPracticeTarget: 0,
      skillPracticeSessions: 3,
      workoutsRequiringLogs: 0,
      workoutsLogged: 3,
    });

    expect(result.score).toBe(0);
    expect(Object.values(result.components).every((value) => value === 0)).toBe(true);
  });
});

describe("calculateProgressionPercent", () => {
  const unorderedStages = [
    { id: "full", order: 4 },
    { id: "tuck", order: 1 },
    { id: "straddle", order: 3 },
    { id: "advanced-tuck", order: 2 },
  ];

  it("uses completed ladder stages rather than an arbitrary estimate", () => {
    expect(calculateProgressionPercent(unorderedStages, "advanced-tuck")).toBe(50);
    expect(calculateProgressionPercent(unorderedStages, "full")).toBe(100);
  });

  it("does not mutate the caller's stage order", () => {
    const originalIds = unorderedStages.map((stage) => stage.id);

    calculateProgressionPercent(unorderedStages, "straddle");

    expect(unorderedStages.map((stage) => stage.id)).toEqual(originalIds);
  });

  it("returns null without a defined ladder or a matching current stage", () => {
    expect(calculateProgressionPercent([], "tuck")).toBeNull();
    expect(calculateProgressionPercent(unorderedStages)).toBeNull();
    expect(calculateProgressionPercent(unorderedStages, "unknown")).toBeNull();
  });
});

describe("calculateStreak", () => {
  const today = new Date(2026, 6, 23, 12);

  it("counts consecutive unique calendar days through today", () => {
    expect(
      calculateStreak(
        [
          "2026-07-23T18:00:00-04:00",
          "2026-07-23T08:00:00-04:00",
          "2026-07-22",
          "2026-07-21",
        ],
        today,
      ),
    ).toBe(3);
  });

  it("keeps a streak alive when the most recent workout was yesterday", () => {
    expect(calculateStreak(["2026-07-22", "2026-07-21"], today)).toBe(2);
  });

  it("stops counting at the first gap", () => {
    expect(
      calculateStreak(["2026-07-23", "2026-07-22", "2026-07-20", "2026-07-19"], today),
    ).toBe(2);
  });

  it("returns zero for empty or stale history", () => {
    expect(calculateStreak([], today)).toBe(0);
    expect(calculateStreak(["2026-07-20", "2026-07-19"], today)).toBe(0);
  });
});
