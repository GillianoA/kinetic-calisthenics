import { describe, expect, it } from "vitest";

import { normalizeWorkoutType } from "@/lib/workout-types";

describe("workout types", () => {
  it.each([
    ["Strength", "strength"],
    ["Push", "push"],
    ["Pull", "pull"],
    ["Skill", "skill"],
    ["Legs", "legs"],
    ["Mobility", "mobility"],
    ["Conditioning", "conditioning"],
  ])("normalizes the visible %s choice without changing its meaning", (label, stored) => {
    expect(normalizeWorkoutType(label)).toBe(stored);
  });

  it("does not silently coerce an unsupported type to strength", () => {
    expect(normalizeWorkoutType("unsupported")).toBeNull();
  });
});
