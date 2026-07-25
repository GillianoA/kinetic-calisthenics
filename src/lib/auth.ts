import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
});

export const requireUser = cache(async () => {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return user;
});

export const getViewerProfile = cache(async () => {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data, error }, { data: preferences }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_path, measurement_sharing, progress_photo_visibility",
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_preferences")
      .select("unit_preference, theme_preference, realtime_updates")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (error) {
    return {
      id: user.id,
      display_name:
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Athlete",
      avatar_path: null,
      unit_preference: "metric",
      theme_preference: "system",
      realtime_updates: true,
      measurement_sharing: "private",
      progress_photo_visibility: "private",
    };
  }

  return {
    ...data,
    unit_preference: preferences?.unit_preference ?? "metric",
    theme_preference: preferences?.theme_preference ?? "system",
    realtime_updates: preferences?.realtime_updates ?? true,
  };
});
