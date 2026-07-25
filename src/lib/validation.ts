import { z } from "zod";
import { WORKOUT_TYPES } from "@/lib/workout-types";

const optionalNumber = (minimum = 0, maximum = Number.MAX_SAFE_INTEGER) =>
  z
    .union([z.number(), z.string().trim()])
    .optional()
    .transform((value) => {
      if (value === "" || value === undefined) return undefined;
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine(
      (value) => value === undefined || (value >= minimum && value <= maximum),
      `Must be between ${minimum} and ${maximum}`,
    );

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().uuid().optional(),
);

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(72, "Use no more than 72 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z
  .object({
    displayName: z.string().trim().min(2, "Use at least 2 characters").max(50),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const exerciseSetSchema = z.object({
  id: z.string().uuid().optional(),
  setNumber: z.number().int().min(1).max(100),
  repetitions: optionalNumber(0, 10000),
  holdSeconds: optionalNumber(0, 86400),
  addedWeight: optionalNumber(0, 1000),
  assistanceWeight: optionalNumber(0, 1000),
  distanceMeters: optionalNumber(0, 1000000),
  restSeconds: optionalNumber(0, 86400),
  tempo: z.string().trim().max(30).optional(),
  bandLevel: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(500).optional(),
  completed: z.boolean().default(true),
  isPersonalRecord: z.boolean().default(false),
});

export const workoutExerciseSchema = z.object({
  id: z.string().uuid().optional(),
  exerciseLibraryId: z.string().uuid().optional(),
  exerciseName: z.string().trim().min(1, "Choose an exercise").max(100),
  category: z.string().trim().max(50).optional(),
  position: z.number().int().min(0),
  notes: z.string().trim().max(1000).optional(),
  sets: z.array(exerciseSetSchema).min(1, "Add at least one set").max(100),
});

export const workoutSchema = z
  .object({
    workoutDate: z.string().date(),
    startTime: z
      .union([z.string().time(), z.string().datetime({ offset: true }), z.literal("")])
      .optional(),
    endTime: z
      .union([z.string().time(), z.string().datetime({ offset: true }), z.literal("")])
      .optional(),
    name: z.string().trim().min(2, "Name your workout").max(100),
    workoutType: z.enum(WORKOUT_TYPES),
    status: z.enum(["planned", "completed", "skipped"]).default("completed"),
    notes: z.string().trim().max(4000).optional(),
    perceivedDifficulty: optionalNumber(1, 10),
    energyLevel: optionalNumber(1, 10),
    location: z.string().trim().max(120).optional(),
    photoPath: z.string().trim().max(500).optional(),
    visibility: z.enum(["private", "partner"]).default("partner"),
    exercises: z.array(workoutExerciseSchema).min(1, "Add at least one exercise").max(60),
  })
  .refine(
    (value) => {
      if (!value.startTime || !value.endTime) return true;
      if (value.startTime.includes("T") && value.endTime.includes("T")) {
        return new Date(value.endTime).getTime() >= new Date(value.startTime).getTime();
      }
      return value.endTime >= value.startTime;
    },
    {
      path: ["endTime"],
      message: "End time must be after start time",
    },
  );

export const measurementSchema = z
  .object({
    measuredAt: z.string().datetime().or(z.string().date()),
    weightKg: optionalNumber(20, 500),
    bodyFatPercentage: optionalNumber(1, 80),
    waistCm: optionalNumber(20, 400),
    chestCm: optionalNumber(20, 400),
    shouldersCm: optionalNumber(20, 400),
    upperArmCm: optionalNumber(5, 150),
    forearmCm: optionalNumber(5, 100),
    thighCm: optionalNumber(10, 200),
    calfCm: optionalNumber(5, 120),
    notes: z.string().trim().max(2000).optional(),
    photoPaths: z.array(z.string().max(500)).max(6).default([]),
    visibility: z.enum(["private", "partner"]).default("private"),
  })
  .refine(
    (value) =>
      [
        value.weightKg,
        value.bodyFatPercentage,
        value.waistCm,
        value.chestCm,
        value.shouldersCm,
        value.upperArmCm,
        value.forearmCm,
        value.thighCm,
        value.calfCm,
      ].some((measurement) => measurement !== undefined),
    {
      message: "Add at least one measurement",
      path: ["weightKg"],
    },
  );

export const skillEntrySchema = z.object({
  skillId: z.string().uuid(),
  progressionId: z.string().uuid().optional(),
  targetProgressionId: z.string().uuid().optional(),
  bestHoldSeconds: optionalNumber(0, 86400),
  maxRepetitions: optionalNumber(0, 10000),
  assistanceLevel: z.string().trim().max(100).optional(),
  addedWeight: optionalNumber(0, 1000),
  achievedAt: z.string().date().optional().or(z.literal("")),
  confidenceRating: optionalNumber(1, 10),
  techniqueRating: optionalNumber(1, 10),
  notes: z.string().trim().max(3000).optional(),
  mediaPath: z.string().trim().max(500).optional(),
  status: z.enum(["not_started", "learning", "developing", "achieved", "mastered"]),
  visibility: z.enum(["private", "partner"]).default("partner"),
});

export const goalSchema = z
  .object({
    title: z.string().trim().min(2).max(140),
    goalType: z.enum([
      "repetitions",
      "hold_time",
      "workout_frequency",
      "workout_count",
      "added_weight",
      "skill",
      "body_measurement",
      "custom",
    ]),
    exerciseLibraryId: optionalUuid,
    skillId: optionalUuid,
    startingValue: z.number().finite().default(0),
    targetValue: z.number().finite().positive(),
    currentValue: z.number().finite().default(0),
    unit: z.string().trim().max(30).optional(),
    startDate: z.string().date(),
    targetDate: z.string().date().optional().or(z.literal("")),
    status: z.enum(["active", "paused", "completed", "cancelled"]).default("active"),
    notes: z.string().trim().max(3000).optional(),
    visibility: z.enum(["private", "partner"]).default("partner"),
    trackingMode: z.enum(["automatic", "manual"]).default("manual"),
  })
  .superRefine((value, context) => {
    if (value.targetDate && value.targetDate < value.startDate) {
      context.addIssue({
        code: "custom",
        message: "Target date must be on or after the start date",
        path: ["targetDate"],
      });
    }

    if (value.trackingMode !== "automatic") return;

    if (["body_measurement", "custom"].includes(value.goalType)) {
      context.addIssue({
        code: "custom",
        message: "This goal type supports manual tracking only",
        path: ["trackingMode"],
      });
    }

    if (["repetitions", "hold_time", "added_weight"].includes(value.goalType)) {
      const bindingCount = Number(Boolean(value.exerciseLibraryId)) + Number(Boolean(value.skillId));
      if (bindingCount !== 1) {
        context.addIssue({
          code: "custom",
          message: "Choose exactly one exercise or skill for automatic tracking",
          path: ["exerciseLibraryId"],
        });
      }
    }

    if (value.goalType === "skill") {
      if (!value.skillId) {
        context.addIssue({
          code: "custom",
          message: "Choose a skill for automatic tracking",
          path: ["skillId"],
        });
      }
      if (value.targetValue !== 1) {
        context.addIssue({
          code: "custom",
          message: "Automatic skill milestones use a target value of 1",
          path: ["targetValue"],
        });
      }
    }
  });

export const invitationCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-f0-9]{36}$/, "Invitation code is invalid");

export const reactionSchema = z.object({
  activityId: z.string().uuid(),
  reaction: z.enum(["strong_work", "new_record", "keep_going", "respect"]),
});

export const settingsSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  avatarPath: z.string().trim().max(1024).nullable().optional(),
  timezone: z.string().trim().min(1).max(64),
  measurementSharing: z.enum(["private", "summary", "detailed"]),
  progressPhotoVisibility: z.enum(["private", "partner"]),
  shareActivity: z.boolean(),
  unitPreference: z.enum(["metric", "imperial"]),
  themePreference: z.enum(["system", "light", "dark"]),
  defaultWorkoutDurationMinutes: z.number().int().min(5).max(480),
  weeklyWorkoutTarget: z.number().int().min(1).max(14),
  weeklySkillPracticeTarget: z.number().int().min(1).max(14),
  reducedMotion: z.boolean().default(false),
  realtimeUpdates: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
});

export const workoutTemplateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  workoutType: z.enum(WORKOUT_TYPES),
  notes: z.string().trim().max(3000).optional(),
  visibility: z.enum(["private", "partner"]).default("private"),
  exercises: z.array(workoutExerciseSchema).min(1).max(60),
});

export const challengeSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().max(5000).optional(),
    challengeType: z.enum(["consistency", "race", "cumulative", "shared_target"]),
    metricKey: z.enum([
      "workouts_completed",
      "pull_up_repetitions",
      "handstand_hold_seconds",
      "skill_practice_seconds",
    ]),
    targetValue: z.number().finite().positive(),
    unit: z.string().trim().min(1).max(40),
    startsOn: z.string().date(),
    endsOn: z.string().date(),
    visibility: z.literal("partner").default("partner"),
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    message: "End date must be on or after the start date",
    path: ["endsOn"],
  });

export const challengeProgressSchema = z.object({
  currentValue: z.number().finite().min(0).max(1_000_000_000),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
export type MeasurementInput = z.infer<typeof measurementSchema>;
export type SkillEntryInput = z.infer<typeof skillEntrySchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type WorkoutTemplateInput = z.infer<typeof workoutTemplateSchema>;
export type ChallengeInput = z.infer<typeof challengeSchema>;
export type ChallengeProgressInput = z.infer<typeof challengeProgressSchema>;
