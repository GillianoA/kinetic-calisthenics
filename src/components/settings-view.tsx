"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  Bell,
  Camera,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  KeyRound,
  Link2,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  Palette,
  RefreshCw,
  Save,
  ShieldCheck,
  Sun,
  Trophy,
  Trash2,
  Unlink,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { friendUser } from "@/lib/demo-data";
import {
  Avatar,
  Button,
  GlassCard,
  PageHeader,
  SectionHeader,
  StatusPill,
  cn,
} from "./ui/primitives";
import { ConfirmDialog } from "./ui/confirm-dialog";

export const settingsSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least two characters.").max(60),
  email: z.string().email(),
  units: z.enum(["metric", "imperial"]),
  theme: z.enum(["system", "light", "dark"]),
  defaultWorkoutDuration: z.number().int().min(5).max(360),
  weeklyWorkoutTarget: z.number().int().min(1).max(14),
  weeklySkillPracticeTarget: z.number().int().min(1).max(14),
  measurementSharing: z.enum(["private", "summary", "detailed"]),
  photoPrivacy: z.enum(["private", "friend"]),
  realtimeActivity: z.boolean(),
  weeklySummary: z.boolean(),
  friendRecords: z.boolean(),
});

export type SettingsValues = z.infer<typeof settingsSchema>;

export type FriendConnection = {
  connected: boolean;
  friendName?: string;
  friendInitials?: string;
  connectedSince?: string;
  invitationCode?: string;
  invitationUrl?: string;
};

const defaultSettings: SettingsValues = {
  displayName: "Maya Chen",
  email: "maya@example.com",
  units: "metric",
  theme: "system",
  defaultWorkoutDuration: 60,
  weeklyWorkoutTarget: 4,
  weeklySkillPracticeTarget: 2,
  measurementSharing: "summary",
  photoPrivacy: "private",
  realtimeActivity: true,
  weeklySummary: true,
  friendRecords: true,
};

const defaultConnection: FriendConnection = {
  connected: true,
  friendName: friendUser.displayName,
  friendInitials: friendUser.initials,
  connectedSince: "February 11, 2026",
  invitationCode: "KIN-MAYA-7L2P",
  invitationUrl: "https://calisthenics.gillianoagard.com/join/KIN-MAYA-7L2P",
};

const fieldClass =
  "focus-ring h-12 w-full rounded-2xl border border-white/65 bg-white/55 px-4 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:focus:border-cyan-400/40 dark:focus:ring-cyan-400/10";

function SettingRow({
  icon: Icon,
  label,
  description,
  control,
  danger = false,
}: {
  icon: typeof UserRound;
  label: string;
  description: string;
  control: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/55 py-4 last:border-0 sm:flex-row sm:items-center">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-2xl",
          danger
            ? "bg-rose-100 text-rose-700 dark:bg-rose-300/10 dark:text-rose-300"
            : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300",
        )}
      >
        <Icon aria-hidden className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            danger
              ? "text-rose-700 dark:text-rose-200"
              : "text-slate-950 dark:text-white",
          )}
        >
          {label}
        </p>
        <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "focus-ring relative h-11 w-16 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
        checked ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700",
      )}
    >
      <span
        className={cn(
          "absolute top-1 size-9 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

export type SettingsViewProps = {
  initialValues?: SettingsValues;
  connection?: FriendConnection;
  avatarUrl?: string;
  onAvatarChange?: (file: File) => void | Promise<void>;
  onSave?: (values: SettingsValues) => void | Promise<void>;
  onResetPassword?: () => void | Promise<void>;
  onRegenerateInvite?: () => void | Promise<void>;
  onDisconnect?: () => void | Promise<void>;
  onExport?: (format: "json" | "csv") => void | Promise<void>;
  onDeleteAccount?: () => void | Promise<void>;
  onSignOut?: () => void | Promise<void>;
};

export function SettingsView({
  initialValues = defaultSettings,
  connection = defaultConnection,
  avatarUrl,
  onAvatarChange,
  onSave,
  onResetPassword,
  onRegenerateInvite,
  onDisconnect,
  onExport,
  onDeleteAccount,
  onSignOut,
}: SettingsViewProps) {
  const [confirming, setConfirming] = useState<
    "disconnect" | "delete" | null
  >(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const values = useWatch({ control }) as SettingsValues;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const submit = handleSubmit(async (nextValues) => {
    try {
      await onSave?.(nextValues);
      reset(nextValues);
      toast.success("Settings saved");
    } catch {
      // The integration callback owns the detailed error message.
    }
  });

  const copyInvite = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Invitation copied");
    } catch {
      toast.error("Copy failed", {
        description: "Select and copy the invitation manually.",
      });
    }
  };

  return (
    <div className="settings-view space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Make Kinetic yours"
        description="Manage your account, preferences, privacy, connection, and training data."
        action={
          isDirty ? (
            <StatusPill tone="warning">Unsaved changes</StatusPill>
          ) : (
            <StatusPill tone="success">Up to date</StatusPill>
          )
        }
      />

      <form onSubmit={submit} className="space-y-5">
        <GlassCard className="p-5 sm:p-7">
          <SectionHeader
            title="Profile"
            description="The identity your accountability partner sees"
          />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative w-fit">
              <Avatar
                initials={(values.displayName || "Your profile")
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("")}
                name={values.displayName || "Your profile"}
                size="lg"
                avatarUrl={avatarUrl}
              />
              <label className="focus-within:ring-sky-500 absolute -bottom-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full border-2 border-white bg-slate-950 text-white shadow-lg focus-within:ring-2 dark:border-[#102039] dark:bg-white dark:text-slate-950">
                <span className="sr-only">Change profile photo</span>
                <Camera aria-hidden className="size-3.5" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onAvatarChange?.(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Display name
                </span>
                <input {...register("displayName")} className={fieldClass} />
                {errors.displayName ? (
                  <span className="mt-1.5 block text-xs text-rose-600 dark:text-rose-300">
                    {errors.displayName.message}
                  </span>
                ) : null}
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Account email
                </span>
                <input
                  {...register("email")}
                  type="email"
                  className={fieldClass}
                  disabled
                />
              </label>
            </div>
          </div>
        </GlassCard>

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <GlassCard className="p-5 sm:p-6">
            <SectionHeader
              title="Experience"
              description="Display and workout defaults"
            />
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Unit preference
                </legend>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/65 p-1 dark:bg-white/[0.04]">
                  {(["metric", "imperial"] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() =>
                        setValue("units", unit, { shouldDirty: true })
                      }
                      aria-pressed={values.units === unit}
                      className={cn(
                        "focus-ring min-h-10 rounded-xl text-xs font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                        values.units === unit
                          ? "bg-white text-slate-950 shadow-sm dark:bg-white/12 dark:text-white"
                          : "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Theme
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "system" as const, label: "System", icon: Palette },
                    { value: "light" as const, label: "Light", icon: Sun },
                    { value: "dark" as const, label: "Dark", icon: Moon },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setValue("theme", value, { shouldDirty: true })
                      }
                      aria-pressed={values.theme === value}
                      className={cn(
                        "focus-ring flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                        values.theme === value
                          ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200"
                          : "border-white/60 bg-white/42 text-slate-500 dark:border-white/8 dark:bg-white/[0.035] dark:text-slate-400",
                      )}
                    >
                      <Icon aria-hidden className="size-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Default workout duration
                </span>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={360}
                    {...register("defaultWorkoutDuration", {
                      valueAsNumber: true,
                    })}
                    className={cn(fieldClass, "pr-20")}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    minutes
                  </span>
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Weekly workout target
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    {...register("weeklyWorkoutTarget", {
                      valueAsNumber: true,
                    })}
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Weekly skill target
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    {...register("weeklySkillPracticeTarget", {
                      valueAsNumber: true,
                    })}
                    className={fieldClass}
                  />
                </label>
              </div>
              <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                These visible targets drive the optional accountability score.
                Each skill update counts as one practice check-in.
              </p>
            </div>
          </GlassCard>

          <GlassCard id="privacy" className="p-5 sm:p-6">
            <SectionHeader
              title="Privacy"
              description="You choose what crosses the connection"
            />
            <SettingRow
              icon={ShieldCheck}
              label="Measurement sharing"
              description="Choose whether your connected friend sees no measurements, weight and body-fat trends, or every recorded measurement."
              control={
                <label className="relative">
                  <span className="sr-only">Measurement sharing</span>
                  <select
                    {...register("measurementSharing")}
                    className="focus-ring h-10 appearance-none rounded-xl border border-white/60 bg-white/55 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                  >
                    <option value="private">Only me</option>
                    <option value="summary">Weight + body-fat trends</option>
                    <option value="detailed">All measurements</option>
                  </select>
                  <ChevronDown
                    aria-hidden
                    className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-slate-400"
                  />
                </label>
              }
            />
            <SettingRow
              icon={LockKeyhole}
              label="Progress-photo privacy"
              description="Photos remain private unless you explicitly share them."
              control={
                <label className="relative">
                  <span className="sr-only">Progress photo privacy</span>
                  <select
                    {...register("photoPrivacy")}
                    className="focus-ring h-10 appearance-none rounded-xl border border-white/60 bg-white/55 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                  >
                    <option value="private">Only me</option>
                    <option value="friend">Connected friend</option>
                  </select>
                  <ChevronDown
                    aria-hidden
                    className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-slate-400"
                  />
                </label>
              }
            />
          </GlassCard>
        </div>

        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Notifications"
            description="Useful signals, no engagement bait"
          />
          <SettingRow
            icon={Bell}
            label="Real-time friend activity"
            description="Get an in-app alert for workouts, records, and milestones."
            control={
              <Toggle
                label="Real-time friend activity"
                checked={values.realtimeActivity}
                onChange={(checked) =>
                  setValue("realtimeActivity", checked, { shouldDirty: true })
                }
              />
            }
          />
          <SettingRow
            icon={Mail}
            label="Weekly training summary"
            description="A concise email recap of consistency, records, and upcoming goals."
            control={
              <Toggle
                label="Weekly training summary"
                checked={values.weeklySummary}
                onChange={(checked) =>
                  setValue("weeklySummary", checked, { shouldDirty: true })
                }
              />
            }
          />
          <SettingRow
            icon={Trophy}
            label="Friend personal records"
            description="Notify me when my accountability partner logs a new record."
            control={
              <Toggle
                label="Friend personal records"
                checked={values.friendRecords}
                onChange={(checked) =>
                  setValue("friendRecords", checked, { shouldDirty: true })
                }
              />
            }
          />
        </GlassCard>

        <GlassCard className="sticky bottom-[82px] z-20 p-3 sm:static sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
              Preferences sync to every signed-in device.
            </p>
            <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full sm:w-auto">
              <Save aria-hidden className="size-4" />
              {isSubmitting ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </GlassCard>
      </form>

      <GlassCard className="p-5 sm:p-7">
        <SectionHeader
          title="Accountability partner"
          description="One primary connection for this version"
          action={
            <StatusPill tone={connection.connected ? "success" : "warning"}>
              {connection.connected ? "Connected" : "Not connected"}
            </StatusPill>
          }
        />
        {connection.connected ? (
          <div className="flex flex-col gap-5 rounded-[24px] border border-violet-200/55 bg-violet-50/45 p-5 sm:flex-row sm:items-center dark:border-violet-300/10 dark:bg-violet-300/[0.045]">
            <Avatar
              initials={connection.friendInitials ?? "FR"}
              name={connection.friendName ?? "Connected friend"}
              role="friend"
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-950 dark:text-white">
                {connection.friendName}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Connected since {connection.connectedSince}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <Check aria-hidden className="size-3.5" />
                Shared activity is syncing
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirming("disconnect")}>
              <Unlink aria-hidden className="size-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/55 bg-white/36 p-5 dark:border-white/8 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-300">
                  <Link2 aria-hidden className="size-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Your invitation
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Share one code with a friend
                  </p>
                </div>
              </div>
              <code className="mt-4 block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold tracking-widest text-cyan-300 dark:bg-black/30">
                {connection.invitationCode}
              </code>
              <Button
                variant="secondary"
                onClick={() =>
                  void copyInvite(
                    connection.invitationUrl ?? connection.invitationCode ?? "",
                  )
                }
                className="mt-3 w-full"
              >
                <Clipboard aria-hidden className="size-4" />
                Copy invitation link
              </Button>
            </div>
            <div className="rounded-[24px] border border-white/55 bg-white/36 p-5 dark:border-white/8 dark:bg-white/[0.03]">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                Need a new code?
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Regenerating invalidates the previous invitation link.
              </p>
              <Button
                variant="secondary"
                onClick={onRegenerateInvite}
                className="mt-5"
              >
                <RefreshCw aria-hidden className="size-4" />
                Regenerate code
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            title="Account & data"
            description="Security and portable exports"
          />
          <SettingRow
            icon={KeyRound}
            label="Reset password"
            description="We’ll send a secure password-reset link to your email."
            control={
              <Button variant="secondary" onClick={onResetPassword}>
                Send link
              </Button>
            }
          />
          <SettingRow
            icon={Download}
            label="Export your data"
            description="Download workouts, measurements, skills, and goals."
            control={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => onExport?.("json")}>
                  JSON
                </Button>
                <Button variant="secondary" onClick={() => onExport?.("csv")}>
                  CSV
                </Button>
              </div>
            }
          />
          <SettingRow
            icon={LogOut}
            label="Sign out"
            description="End the session on this device only."
            control={
              <Button variant="secondary" onClick={onSignOut}>
                Sign out
              </Button>
            }
          />
        </GlassCard>

        <GlassCard className="border-rose-200/55 p-5 sm:p-6 dark:border-rose-300/10">
          <SectionHeader
            title="Danger zone"
            description="Permanent account actions"
          />
          <SettingRow
            icon={Trash2}
            label="Delete account"
            description="Permanently remove your profile and user-owned training data. This cannot be undone."
            danger
            control={
              <Button variant="danger" onClick={() => setConfirming("delete")}>
                Delete account
              </Button>
            }
          />
        </GlassCard>
      </div>

      <ConfirmDialog
        open={confirming === "disconnect"}
        title={`Disconnect from ${connection.friendName ?? "your friend"}?`}
        description="You will stop seeing each other’s shared progress and activity. Your own records remain intact."
        confirmLabel="Disconnect"
        destructive
        onCancel={() => setConfirming(null)}
        onConfirm={async () => {
          await onDisconnect?.();
          setConfirming(null);
        }}
      />
      <ConfirmDialog
        open={confirming === "delete"}
        title="Permanently delete your account?"
        description="Your workouts, exercises, skills, measurements, goals, reactions, photos, and profile will be permanently deleted. Export your data first if you need a copy."
        confirmLabel="Delete my account"
        destructive
        onCancel={() => setConfirming(null)}
        onConfirm={async () => {
          await onDeleteAccount?.();
          setConfirming(null);
        }}
      />
    </div>
  );
}
