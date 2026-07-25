import { AppShell } from "@/components/app-shell";
import { getViewerProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "./actions";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getViewerProfile();
  const supabase = await createClient();
  const { count: notificationCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <AppShell
      user={{
        name: profile.display_name,
        initials: initials(profile.display_name),
      }}
      notificationCount={notificationCount ?? 0}
      theme={profile.theme_preference}
      unitPreference={profile.unit_preference}
      realtimeEnabled={profile.realtime_updates}
      onSignOut={signOutAction}
    >
      {children}
    </AppShell>
  );
}
