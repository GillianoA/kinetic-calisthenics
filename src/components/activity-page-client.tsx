"use client";

import { useEffect } from "react";
import { ActivityFeed } from "@/components/activity-feed";
import type { ActivityItem, Encouragement } from "@/lib/demo-data";

const reactionNames: Record<Encouragement, string> = {
  "Strong work": "strong_work",
  "New record": "new_record",
  "Keep going": "keep_going",
  Respect: "respect",
};

export function ActivityPageClient({
  items,
  friendName,
}: {
  items: ActivityItem[];
  friendName?: string;
}) {
  useEffect(() => {
    void fetch("/api/notifications/read", { method: "POST" });
  }, []);

  return (
    <ActivityFeed
      items={items}
      friendName={friendName}
      onReact={async (activity, label, active) => {
        const response = await fetch("/api/reactions", {
          method: active ? "POST" : "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            activityId: activity.id,
            reaction: reactionNames[label],
          }),
        });
        if (!response.ok) throw new Error("Reaction could not be saved.");
      }}
    />
  );
}
