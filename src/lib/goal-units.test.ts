import { describe, expect, it } from "vitest";
import { normalizeGoalWeightFields } from "./goal-units";

describe("goal weight normalization", () => {
  it("stores added-weight goals canonically in kilograms", () => {
    expect(
      normalizeGoalWeightFields({
        goalType: "added_weight",
        startingValue: 0,
        currentValue: 22,
        targetValue: 44,
        unit: "lb",
      }),
    ).toEqual({
      goalType: "added_weight",
      startingValue: 0,
      currentValue: 9.979,
      targetValue: 19.958,
      unit: "kg",
    });
  });

  it("does not alter non-weight goals", () => {
    const goal = {
      goalType: "repetitions",
      startingValue: 2,
      currentValue: 5,
      targetValue: 10,
      unit: "reps",
    };
    expect(normalizeGoalWeightFields(goal)).toBe(goal);
  });
});
