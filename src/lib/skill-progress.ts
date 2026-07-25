export function milestoneTimelineDetail(
  milestone: { complete: boolean; date?: string },
  index: number,
  completedStages: number,
) {
  if (milestone.date) return milestone.date;
  if (!milestone.complete) return "Not reached yet";

  return completedStages > 0 && index === completedStages - 1
    ? "Current progression"
    : "Reached";
}
