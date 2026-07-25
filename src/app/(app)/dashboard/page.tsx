import { DashboardView } from "@/components/dashboard-view";
import { requireUser } from "@/lib/auth";
import { getLiveDashboardData } from "@/lib/data/dashboard";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getLiveDashboardData(user.id);

  return (
    <DashboardView
      data={data}
      isEmpty={
        data.stats.totalWorkouts === 0 &&
        data.skills.length === 0 &&
        data.records.length === 0
      }
    />
  );
}
