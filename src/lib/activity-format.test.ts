import { describe, expect, it } from "vitest";
import type { ActivityItem } from "./demo-data";
import { activityDetailToDisplay } from "./activity-format";

const activity: ActivityItem = {
  id: "activity",
  userId: "user",
  userRole: "current",
  userName: "Athlete",
  userInitials: "A",
  kind: "record",
  title: "New record",
  detail: "10 kg",
  recordMetric: { value: 10, unit: "kg" },
  createdAt: "2026-07-24T00:00:00.000Z",
  reactions: [],
};

describe("activity detail formatting", () => {
  it("formats structured record metadata without parsing authored text", () => {
    expect(activityDetailToDisplay(activity, "imperial")).toBe("22 lb");
  });

  it("leaves ordinary activity detail unchanged", () => {
    expect(
      activityDetailToDisplay(
        { ...activity, detail: "Technique focus", recordMetric: undefined },
        "imperial",
      ),
    ).toBe("Technique focus");
  });
});
