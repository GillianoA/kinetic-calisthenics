export type UnitPreference = "metric" | "imperial";

const KG_PER_POUND = 0.45359237;
const CM_PER_INCH = 2.54;
const METERS_PER_FOOT = 0.3048;

export function roundUnit(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function floorUnit(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.floor(value * factor) / factor;
}

export function kilogramsToDisplay(
  kilograms: number,
  preference: UnitPreference,
  decimals = 1,
) {
  return roundUnit(
    preference === "imperial" ? kilograms / KG_PER_POUND : kilograms,
    decimals,
  );
}

export function displayWeightToKilograms(
  value: number,
  preference: UnitPreference,
) {
  return roundUnit(
    preference === "imperial" ? value * KG_PER_POUND : value,
    3,
  );
}

export function centimetersToDisplay(
  centimeters: number,
  preference: UnitPreference,
  decimals = 1,
) {
  return roundUnit(
    preference === "imperial" ? centimeters / CM_PER_INCH : centimeters,
    decimals,
  );
}

export function displayLengthToCentimeters(
  value: number,
  preference: UnitPreference,
) {
  return roundUnit(
    preference === "imperial" ? value * CM_PER_INCH : value,
    2,
  );
}

export function metersToDisplay(
  meters: number,
  preference: UnitPreference,
  decimals = 1,
) {
  return roundUnit(
    preference === "imperial" ? meters / METERS_PER_FOOT : meters,
    decimals,
  );
}

export function displayDistanceToMeters(
  value: number,
  preference: UnitPreference,
) {
  return roundUnit(
    preference === "imperial" ? value * METERS_PER_FOOT : value,
    3,
  );
}

export function weightUnit(preference: UnitPreference) {
  return preference === "imperial" ? "lb" : "kg";
}

export function lengthUnit(preference: UnitPreference) {
  return preference === "imperial" ? "in" : "cm";
}

export function distanceUnit(preference: UnitPreference) {
  return preference === "imperial" ? "ft" : "m";
}

export function isImperialWeightUnit(unit: string | null | undefined) {
  return /^(lb|lbs|pound|pounds)$/i.test(unit?.trim() ?? "");
}

export function storedWeightToDisplay(
  value: number,
  storedUnit: string | null | undefined,
  preference: UnitPreference,
  decimals = 1,
) {
  const kilograms = isImperialWeightUnit(storedUnit)
    ? displayWeightToKilograms(value, "imperial")
    : value;
  return kilogramsToDisplay(kilograms, preference, decimals);
}

export function recordValueToDisplay(
  value: number,
  unit: "reps" | "sec" | "kg" | "m",
  preference: UnitPreference,
) {
  if (unit === "kg") return kilogramsToDisplay(value, preference);
  if (unit === "m") return metersToDisplay(value, preference);
  return value;
}

export function recordUnitToDisplay(
  unit: "reps" | "sec" | "kg" | "m",
  preference: UnitPreference,
) {
  if (unit === "kg") return weightUnit(preference);
  if (unit === "m") return distanceUnit(preference);
  return unit;
}

export function formatMetricWeightLabel(
  label: string,
  preference: UnitPreference,
) {
  if (preference === "metric") return label;
  return label.replace(
    /([+-]?\d+(?:\.\d+)?)\s*kg\b/gi,
    (_, rawValue: string) => {
      const explicitPositiveSign = rawValue.startsWith("+") ? "+" : "";
      return `${explicitPositiveSign}${kilogramsToDisplay(Number(rawValue), preference)} lb`;
    },
  );
}
