import type { ActivityItem } from "@/lib/demo-data";
import {
  recordUnitToDisplay,
  recordValueToDisplay,
  type UnitPreference,
} from "@/lib/units";

export function activityDetailToDisplay(
  item: ActivityItem,
  preference: UnitPreference,
) {
  if (!item.recordMetric) return item.detail;
  return `${recordValueToDisplay(
    item.recordMetric.value,
    item.recordMetric.unit,
    preference,
  )} ${recordUnitToDisplay(item.recordMetric.unit, preference)}`;
}
