import { describe, expect, it } from "vitest";
import {
  centimetersToDisplay,
  displayDistanceToMeters,
  displayLengthToCentimeters,
  displayWeightToKilograms,
  floorUnit,
  formatMetricWeightLabel,
  kilogramsToDisplay,
  metersToDisplay,
  recordUnitToDisplay,
  recordValueToDisplay,
  storedWeightToDisplay,
} from "./units";

describe("unit conversions", () => {
  it("round-trips body weight within canonical storage precision", () => {
    expect(kilogramsToDisplay(80, "imperial")).toBe(176.4);
    expect(displayWeightToKilograms(176.4, "imperial")).toBeCloseTo(80, 1);
  });

  it("round-trips body lengths", () => {
    expect(centimetersToDisplay(182.88, "imperial")).toBe(72);
    expect(displayLengthToCentimeters(72, "imperial")).toBe(182.88);
  });

  it("round-trips workout distance using feet", () => {
    expect(metersToDisplay(3.048, "imperial")).toBe(10);
    expect(displayDistanceToMeters(10, "imperial")).toBe(3.048);
  });

  it("keeps edit-form conversions within canonical database precision", () => {
    const displayedLoad = kilogramsToDisplay(7.5, "imperial", 2);
    expect(displayWeightToKilograms(displayedLoad, "imperial")).toBeCloseTo(
      7.5,
      2,
    );
    const displayedDistance = metersToDisplay(1, "imperial", 2);
    expect(displayDistanceToMeters(displayedDistance, "imperial")).toBeCloseTo(
      1,
      2,
    );
  });

  it("converts embedded metric record labels without touching other labels", () => {
    expect(formatMetricWeightLabel("+20 kg", "imperial")).toBe("+44.1 lb");
    expect(formatMetricWeightLabel("24 sec", "imperial")).toBe("24 sec");
  });

  it("normalizes stored kg or legacy pounds into the viewer's preference", () => {
    expect(storedWeightToDisplay(20, "kg", "imperial")).toBe(44.1);
    expect(storedWeightToDisplay(44.1, "lb", "metric")).toBeCloseTo(20, 1);
    expect(storedWeightToDisplay(7.5, "kg", "imperial", 3)).toBe(16.535);
  });

  it("floors advertised maxima so converted values stay within bounds", () => {
    expect(floorUnit(3_280_839.895, 2)).toBe(3_280_839.89);
  });

  it("formats weight and distance records for the viewer", () => {
    expect(recordValueToDisplay(10, "kg", "imperial")).toBe(22);
    expect(recordUnitToDisplay("kg", "imperial")).toBe("lb");
    expect(recordValueToDisplay(3.048, "m", "imperial")).toBe(10);
    expect(recordUnitToDisplay("m", "imperial")).toBe("ft");
  });
});
