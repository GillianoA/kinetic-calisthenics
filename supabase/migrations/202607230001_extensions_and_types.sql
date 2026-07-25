-- Core extensions and intentionally small, stable enums.
-- Store weights in kilograms, lengths in centimetres, and distances in metres.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.unit_system as enum (
  'metric',
  'imperial'
);

create type public.theme_preference as enum (
  'system',
  'light',
  'dark'
);

create type public.content_visibility as enum (
  'private',
  'partner'
);

create type public.measurement_sharing_level as enum (
  'private',
  'summary',
  'detailed'
);

create type public.friend_connection_status as enum (
  'pending',
  'accepted',
  'disconnected'
);

create type public.workout_type as enum (
  'strength',
  'skill',
  'mobility',
  'conditioning',
  'recovery',
  'mixed',
  'custom'
);

create type public.workout_status as enum (
  'planned',
  'completed',
  'skipped'
);

create type public.exercise_category as enum (
  'push',
  'pull',
  'legs',
  'core',
  'balance',
  'mobility',
  'conditioning',
  'other'
);

create type public.skill_category as enum (
  'push',
  'pull',
  'core',
  'balance',
  'legs',
  'static',
  'dynamic',
  'mobility',
  'other'
);

create type public.skill_status as enum (
  'not_started',
  'learning',
  'developing',
  'achieved',
  'mastered'
);

create type public.goal_type as enum (
  'repetitions',
  'hold_time',
  'workout_frequency',
  'workout_count',
  'added_weight',
  'skill',
  'body_measurement',
  'custom'
);

create type public.progress_tracking_mode as enum (
  'automatic',
  'manual'
);

create type public.goal_status as enum (
  'not_started',
  'active',
  'paused',
  'completed',
  'cancelled'
);

create type public.challenge_type as enum (
  'consistency',
  'race',
  'cumulative',
  'shared_target'
);

create type public.challenge_status as enum (
  'draft',
  'upcoming',
  'active',
  'completed',
  'cancelled'
);

create type public.challenge_member_status as enum (
  'joined',
  'completed',
  'left'
);

create type public.record_type as enum (
  'repetitions',
  'hold_seconds',
  'added_weight',
  'assistance_weight',
  'distance',
  'volume',
  'other'
);

create type public.activity_type as enum (
  'workout_completed',
  'personal_record',
  'skill_progress',
  'skill_achieved',
  'goal_completed',
  'challenge_joined',
  'encouragement'
);

create type public.reaction_kind as enum (
  'strong_work',
  'new_record',
  'keep_going',
  'respect'
);

