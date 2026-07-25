import { SettingsPageClient } from "@/components/settings-page-client";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [
    { data: profile },
    { data: preferences },
    { data: connections },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).single(),
    supabase
      .from("friend_connections")
      .select("id,requester_id,addressee_id,accepted_at,status")
      .eq("status", "accepted"),
  ]);
  const connection = connections?.[0];
  const partnerId = connection
    ? connection.requester_id === user.id
      ? connection.addressee_id
      : connection.requester_id
    : undefined;
  const { data: partner } = partnerId
    ? await supabase.from("profiles").select("display_name").eq("id", partnerId).single()
    : { data: null };
  const avatarUrl = profile?.avatar_path
    ? (await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600)).data
        ?.signedUrl
    : undefined;

  return (
    <SettingsPageClient
      timezone={profile?.timezone ?? "UTC"}
      connectionId={connection?.id}
      initialAvatarUrl={avatarUrl}
      initialValues={{
        displayName:
          profile?.display_name ??
          (user.user_metadata?.display_name as string | undefined) ??
          "Athlete",
        email: user.email ?? "",
        units: preferences?.unit_preference ?? "metric",
        theme: preferences?.theme_preference ?? "system",
        defaultWorkoutDuration: preferences?.default_workout_duration_minutes ?? 60,
        weeklyWorkoutTarget: preferences?.weekly_workout_target ?? 4,
        weeklySkillPracticeTarget:
          preferences?.weekly_skill_practice_target ?? 2,
        measurementSharing:
          profile?.measurement_sharing === "private" ||
          profile?.measurement_sharing === "detailed"
            ? profile.measurement_sharing
            : "summary",
        photoPrivacy:
          profile?.progress_photo_visibility === "partner" ? "friend" : "private",
        realtimeActivity: preferences?.realtime_updates ?? true,
        weeklySummary: preferences?.email_notifications ?? true,
        friendRecords: profile?.share_activity ?? true,
      }}
      initialConnection={
        connection && partner
          ? {
              connected: true,
              friendName: partner.display_name,
              friendInitials: initials(partner.display_name),
              connectedSince: connection.accepted_at
                ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(
                    new Date(connection.accepted_at),
                  )
                : "recently",
            }
          : { connected: false }
      }
    />
  );
}
