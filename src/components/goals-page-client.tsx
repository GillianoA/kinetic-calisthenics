"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GoalsView } from "@/components/goals-view";
import type { ChallengeSummary, GoalSummary } from "@/lib/demo-data";

export function GoalsPageClient({
  goals,
  challenges,
  friendName,
}: {
  goals: GoalSummary[];
  challenges: ChallengeSummary[];
  friendName?: string;
}) {
  const router = useRouter();
  const remove = async (goal: GoalSummary) => {
    const response = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Goal could not be deleted");
      return;
    }
    toast.success("Goal deleted");
    router.refresh();
  };
  return (
    <GoalsView
      goals={goals}
      challenges={challenges}
      friendName={friendName}
      onCreateGoal={() => router.push("/goals/new")}
      onCreateChallenge={() => router.push("/goals/challenges/new")}
      onEditGoal={(goal) => router.push(`/goals/${goal.id}/edit`)}
      onUpdateGoal={(goal) => router.push(`/goals/${goal.id}/edit`)}
      onDeleteGoal={remove}
      onOpenChallenge={(challenge) => router.push(`/goals/challenges/${challenge.id}`)}
    />
  );
}
