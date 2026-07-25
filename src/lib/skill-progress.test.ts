import { describe, expect, it } from "vitest";
import { milestoneTimelineDetail } from "./skill-progress";

describe("skill milestone timeline detail", () => {
  it("keeps a completed ladder coherent when milestone dates are unavailable", () => {
    const milestones = Array.from({ length: 4 }, () => ({ complete: true }));

    expect(
      milestones.map((milestone, index) =>
        milestoneTimelineDetail(milestone, index, milestones.length),
      ),
    ).toEqual(["Reached", "Reached", "Reached", "Current progression"]);
  });

  it("uses recorded dates and reserves the unreached label for incomplete stages", () => {
    expect(
      milestoneTimelineDetail(
        { complete: true, date: "2026-07-24" },
        1,
        2,
      ),
    ).toBe("2026-07-24");
    expect(milestoneTimelineDetail({ complete: false }, 2, 2)).toBe(
      "Not reached yet",
    );
  });
});
