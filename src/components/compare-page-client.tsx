"use client";

import {
  Activity,
  CalendarCheck2,
  Dumbbell,
  Flame,
  Hand,
  Medal,
  Timer,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { CompareView, type ComparisonMetric } from "@/components/compare-view";
import type {
  ActivityItem,
  ChallengeSummary,
  DemoProfile,
  PersonalRecord,
} from "@/lib/demo-data";

export type PlainComparisonMetric = {
  key:
    | "weekly"
    | "streak"
    | "total"
    | "pullups"
    | "pushups"
    | "dips"
    | "hold"
    | "skills";
  current: string;
  friend: string;
  context: string;
};

const definitions = {
  weekly: { label: "Workouts this week", icon: CalendarCheck2 },
  streak: { label: "Current streak", icon: Flame },
  total: { label: "Total workouts", icon: Dumbbell },
  pullups: { label: "Pull-up maximum", icon: Trophy },
  pushups: { label: "Push-up maximum", icon: Hand },
  dips: { label: "Dip maximum", icon: Activity },
  hold: { label: "Longest static hold", icon: Timer },
  skills: { label: "Skills achieved", icon: Medal },
} satisfies Record<PlainComparisonMetric["key"], Pick<ComparisonMetric, "label" | "icon">>;

export function ComparePageClient({
  currentProfile,
  friendProfile,
  plainMetrics,
  accountabilityData,
  challenges,
  records,
  activityItems,
}: {
  currentProfile: DemoProfile;
  friendProfile: DemoProfile;
  plainMetrics: PlainComparisonMetric[];
  accountabilityData: {
    explanation: string;
    current: {
      score: number;
      planned: number;
      consistency: number;
      skillPractice: number;
      logging: number;
    };
    friend: {
      score: number;
      planned: number;
      consistency: number;
      skillPractice: number;
      logging: number;
    };
  };
  challenges: ChallengeSummary[];
  records: PersonalRecord[];
  activityItems: ActivityItem[];
}) {
  const metrics: ComparisonMetric[] = plainMetrics.map((metric) => ({
    ...definitions[metric.key],
    current: metric.current,
    friend: metric.friend,
    context: metric.context,
  }));

  return (
    <CompareView
      currentProfile={currentProfile}
      friendProfile={friendProfile}
      metrics={metrics}
      accountabilityData={accountabilityData}
      challenges={challenges}
      records={records}
      activityItems={activityItems}
      onEncourage={async (encouragement) => {
        const response = await fetch("/api/encouragement", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ encouragement }),
        });
        if (!response.ok) {
          toast.error("Encouragement could not be sent");
          return;
        }
        toast.success(`Encouragement sent to ${friendProfile.displayName}`);
      }}
    />
  );
}
