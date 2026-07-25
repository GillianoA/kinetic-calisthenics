"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  SettingsView,
  type FriendConnection,
  type SettingsValues,
} from "@/components/settings-view";
import { createClient } from "@/lib/supabase/client";
import { UPLOAD_LIMITS } from "@/lib/uploads";

const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function SettingsPageClient({
  initialValues,
  initialConnection,
  connectionId,
  timezone,
  initialAvatarUrl,
}: {
  initialValues: SettingsValues;
  initialConnection: FriendConnection;
  connectionId?: string;
  timezone: string;
  initialAvatarUrl?: string;
}) {
  const router = useRouter();
  const [connection, setConnection] = useState(initialConnection);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  const save = async (values: SettingsValues) => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: values.displayName,
        timezone,
        measurementSharing: values.measurementSharing,
        progressPhotoVisibility: values.photoPrivacy === "friend" ? "partner" : "private",
        shareActivity: values.friendRecords,
        unitPreference: values.units,
        themePreference: values.theme,
        defaultWorkoutDurationMinutes: values.defaultWorkoutDuration,
        weeklyWorkoutTarget: values.weeklyWorkoutTarget,
        weeklySkillPracticeTarget: values.weeklySkillPracticeTarget,
        reducedMotion: false,
        realtimeUpdates: values.realtimeActivity,
        emailNotifications: values.weeklySummary,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      toast.error("Settings could not be saved", { description: result.error });
      throw new Error(result.error ?? "Save failed");
    }
    if (values.theme === "system") {
      document.documentElement.dataset.theme = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches
        ? "dark"
        : "light";
    } else {
      document.documentElement.dataset.theme = values.theme;
    }
    router.refresh();
  };

  const uploadAvatar = async (file: File) => {
    if (!AVATAR_TYPES.has(file.type) || file.size > UPLOAD_LIMITS.avatarBytes) {
      toast.error("Use a JPEG, PNG, WebP, or AVIF image up to 5 MB.");
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "img";
    const path = `${user.id}/avatar/${crypto.randomUUID()}.${extension.toLowerCase()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      toast.error("Avatar upload failed");
      return;
    }
    const response = await fetch("/api/settings/avatar", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path }),
    });
    if (!response.ok) {
      await supabase.storage.from("avatars").remove([path]);
      toast.error("Avatar could not be saved");
      return;
    }
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    setAvatarUrl(data?.signedUrl);
    toast.success("Profile photo updated");
    router.refresh();
  };

  const regenerateInvite = async () => {
    const response = await fetch("/api/friends/invite", { method: "POST" });
    const result = (await response.json().catch(() => ({}))) as {
      code?: string;
      link?: string;
      error?: string;
    };
    if (!response.ok || !result.code) {
      toast.error("Invitation could not be created", { description: result.error });
      return;
    }
    setConnection({
      connected: false,
      invitationCode: result.code,
      invitationUrl: result.link,
    });
    toast.success("New invitation created");
  };

  const disconnect = async () => {
    if (!connectionId) return;
    const response = await fetch(`/api/friends/${connectionId}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmation: "DISCONNECT" }),
    });
    if (!response.ok) {
      toast.error("Partner could not be disconnected");
      return;
    }
    setConnection({ connected: false });
    toast.success("Partner disconnected");
    router.refresh();
  };

  const deleteAccount = async () => {
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmation: "DELETE" }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };
    if (!response.ok) {
      toast.error("Account was not deleted", { description: result.error });
      if (result.code === "reauthentication_required") {
        await fetch("/auth/signout", { method: "POST" });
        window.location.href = "/login";
      }
      return;
    }
    window.location.href = "/";
  };

  const sendPasswordReset = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      initialValues.email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      },
    );
    if (error) {
      toast.error("Password-reset link could not be sent", {
        description: error.message,
      });
      return;
    }
    toast.success("Password-reset link sent", {
      description: `Check ${initialValues.email}.`,
    });
  };

  return (
    <SettingsView
      initialValues={initialValues}
      connection={connection}
      avatarUrl={avatarUrl}
      onAvatarChange={uploadAvatar}
      onSave={save}
      onResetPassword={sendPasswordReset}
      onRegenerateInvite={regenerateInvite}
      onDisconnect={disconnect}
      onExport={(format) => {
        window.location.href =
          format === "json" ? "/api/export?format=json" : "/api/export?format=csv&table=workouts";
      }}
      onDeleteAccount={deleteAccount}
      onSignOut={async () => {
        await fetch("/auth/signout", { method: "POST" });
        window.location.href = "/login";
      }}
    />
  );
}
