import {
  displayWeightToKilograms,
  isImperialWeightUnit,
} from "@/lib/units";

type GoalWeightFields = {
  goalType: string;
  startingValue: number;
  targetValue: number;
  currentValue: number;
  unit?: string;
};

export function normalizeGoalWeightFields<T extends GoalWeightFields>(
  value: T,
): T {
  if (value.goalType !== "added_weight") return value;

  const convert = isImperialWeightUnit(value.unit)
    ? (amount: number) => displayWeightToKilograms(amount, "imperial")
    : (amount: number) => amount;

  return {
    ...value,
    startingValue: convert(value.startingValue),
    targetValue: convert(value.targetValue),
    currentValue: convert(value.currentValue),
    unit: "kg",
  };
}
