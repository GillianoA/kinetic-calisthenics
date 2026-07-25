import { readJsonBody, validationError } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = settingsSchema.safeParse(body.data);
  if (!parsed.success) return validationError(parsed.error.issues);
  const value = parsed.data;

  const [profileResult, preferencesResult] = await Promise.all([
    supabase
      .from("profiles")
      .update({
        display_name: value.displayName,
        avatar_path: value.avatarPath,
        timezone: value.timezone,
        measurement_sharing: value.measurementSharing,
        progress_photo_visibility: value.progressPhotoVisibility,
        share_activity: value.shareActivity,
      })
      .eq("id", user.id),
    supabase.from("user_preferences").upsert({
      user_id: user.id,
      unit_preference: value.unitPreference,
      theme_preference: value.themePreference,
      default_workout_duration_minutes: value.defaultWorkoutDurationMinutes,
      weekly_workout_target: value.weeklyWorkoutTarget,
      weekly_skill_practice_target: value.weeklySkillPracticeTarget,
      reduced_motion: value.reducedMotion,
      realtime_updates: value.realtimeUpdates,
      email_notifications: value.emailNotifications,
    }),
  ]);

  if (profileResult.error || preferencesResult.error) {
    return Response.json({ error: "Settings could not be saved." }, { status: 400 });
  }
  return Response.json({ success: true });
}
