import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./redirects";

describe("safeInternalPath", () => {
  it("keeps an internal path with its query and fragment", () => {
    expect(safeInternalPath("/workouts?user=me#latest")).toBe(
      "/workouts?user=me#latest",
    );
  });

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "/\\attacker.example",
    "\\\\attacker.example",
  ])("rejects an external redirect candidate: %s", (candidate) => {
    expect(safeInternalPath(candidate)).toBe("/dashboard");
  });
});
