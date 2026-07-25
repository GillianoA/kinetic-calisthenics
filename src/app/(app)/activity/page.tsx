import { ActivityPageClient } from "@/components/activity-page-client";
import { requireUser } from "@/lib/auth";
import { getLiveDashboardData } from "@/lib/data/dashboard";

export const metadata = { title: "Activity" };

export default async function ActivityPage() {
  const user = await requireUser();
  const data = await getLiveDashboardData(user.id);
  return (
    <ActivityPageClient
      items={data.activities}
      friendName={data.friend.displayName}
    />
  );
}
