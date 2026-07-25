-- Relational application schema.
-- All user content carries an explicit owner UUID, allowing policies to stay
-- understandable and composite foreign keys to prevent cross-owner children.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 80),
  avatar_path text
    check (avatar_path is null or char_length(avatar_path) <= 1024),
  bio text
    check (bio is null or char_length(bio) <= 280),
  timezone text not null default 'UTC'
    check (char_length(timezone) between 1 and 64),
  measurement_sharing public.measurement_sharing_level not null default 'summary',
  progress_photo_visibility public.content_visibility not null default 'partner',
  share_activity boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  unit_preference public.unit_system not null default 'metric',
  theme_preference public.theme_preference not null default 'system',
  default_workout_duration_minutes smallint not null default 60
    check (default_workout_duration_minutes between 5 and 480),
  week_starts_on smallint not null default 1
    check (week_starts_on between 0 and 6),
  locale text not null default 'en'
    check (char_length(locale) between 2 and 16),
  reduced_motion boolean not null default false,
  realtime_updates boolean not null default true,
  email_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.friend_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friend_connection_status not null default 'pending',
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  disconnected_at timestamptz,
  member_low uuid generated always as (least(requester_id, addressee_id)) stored,
  member_high uuid generated always as (greatest(requester_id, addressee_id)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_connections_distinct_members
    check (requester_id <> addressee_id),
  constraint friend_connections_status_dates
    check (
      (status = 'pending' and accepted_at is null and disconnected_at is null)
      or (status = 'accepted' and accepted_at is not null and disconnected_at is null)
      or (status = 'disconnected' and accepted_at is not null and disconnected_at is not null)
    ),
  constraint friend_connections_unique_pair unique (member_low, member_high)
);

create table public.friend_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  token_hash bytea not null unique,
  token_hint text not null
    check (char_length(token_hint) = 4),
  expires_at timestamptz not null,
  claimed_by uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint friend_invites_claim_consistency
    check (claimed_at is not null or claimed_by is null),
  constraint friend_invites_expiry_after_creation
    check (expires_at > created_at)
);

create unique index friend_invites_one_open_per_inviter_idx
  on public.friend_invites(inviter_id)
  where claimed_at is null and revoked_at is null;
create index friend_invites_expiry_idx
  on public.friend_invites(expires_at)
  where claimed_at is null and revoked_at is null;
create index friend_connections_requester_status_idx
  on public.friend_connections(requester_id, status);
create index friend_connections_addressee_status_idx
  on public.friend_connections(addressee_id, status);

create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  category public.exercise_category not null default 'other',
  description text
    check (description is null or char_length(description) <= 2000),
  primary_muscles text[] not null default '{}',
  equipment text[] not null default '{}',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_library_system_owner
    check ((is_system and owner_id is null) or (not is_system and owner_id is not null))
);

create unique index exercise_library_system_name_idx
  on public.exercise_library(lower(name))
  where owner_id is null;
create unique index exercise_library_owner_name_idx
  on public.exercise_library(owner_id, lower(name))
  where owner_id is not null;
create index exercise_library_category_idx
  on public.exercise_library(category);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_date date not null default current_date,
  start_time timestamptz,
  end_time timestamptz,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  workout_type public.workout_type not null default 'strength',
  custom_workout_type text
    check (custom_workout_type is null or char_length(custom_workout_type) <= 80),
  status public.workout_status not null default 'completed',
  notes text
    check (notes is null or char_length(notes) <= 5000),
  perceived_difficulty smallint
    check (perceived_difficulty between 1 and 10),
  energy_level smallint
    check (energy_level between 1 and 10),
  location text
    check (location is null or char_length(location) <= 160),
  photo_path text
    check (photo_path is null or char_length(photo_path) <= 1024),
  visibility public.content_visibility not null default 'partner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workouts_end_after_start
    check (end_time is null or start_time is null or end_time >= start_time),
  constraint workouts_custom_type
    check (
      (workout_type = 'custom' and custom_workout_type is not null)
      or workout_type <> 'custom'
    ),
  constraint workouts_id_user_unique unique (id, user_id)
);

create index workouts_user_date_idx
  on public.workouts(user_id, workout_date desc);
create index workouts_user_status_date_idx
  on public.workouts(user_id, status, workout_date desc);
create index workouts_type_date_idx
  on public.workouts(workout_type, workout_date desc);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_library_id uuid references public.exercise_library(id) on delete set null,
  exercise_name text not null
    check (char_length(btrim(exercise_name)) between 1 and 120),
  category public.exercise_category not null default 'other',
  position smallint not null default 0
    check (position between 0 and 500),
  notes text
    check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_exercises_workout_owner_fk
    foreign key (workout_id, user_id)
    references public.workouts(id, user_id)
    on delete cascade,
  constraint workout_exercises_id_user_unique unique (id, user_id),
  constraint workout_exercises_position_unique unique (workout_id, position)
);

create index workout_exercises_user_idx
  on public.workout_exercises(user_id);
create index workout_exercises_library_idx
  on public.workout_exercises(exercise_library_id);

create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  set_number smallint not null
    check (set_number between 1 and 200),
  repetitions integer
    check (repetitions between 0 and 100000),
  hold_seconds numeric(10, 2)
    check (hold_seconds >= 0),
  added_weight numeric(10, 2)
    check (added_weight >= 0),
  assistance_weight numeric(10, 2)
    check (assistance_weight >= 0),
  distance_meters numeric(12, 2)
    check (distance_meters >= 0),
  rest_seconds integer
    check (rest_seconds between 0 and 86400),
  tempo text
    check (tempo is null or char_length(tempo) <= 32),
  band_level text
    check (band_level is null or char_length(band_level) <= 60),
  notes text
    check (notes is null or char_length(notes) <= 1000),
  completed boolean not null default true,
  is_personal_record boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_sets_exercise_owner_fk
    foreign key (workout_exercise_id, user_id)
    references public.workout_exercises(id, user_id)
    on delete cascade,
  constraint exercise_sets_id_user_unique unique (id, user_id),
  constraint exercise_sets_set_number_unique
    unique (workout_exercise_id, set_number)
);

create index exercise_sets_user_idx
  on public.exercise_sets(user_id);

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  workout_type public.workout_type not null default 'strength',
  custom_workout_type text
    check (custom_workout_type is null or char_length(custom_workout_type) <= 80),
  notes text
    check (notes is null or char_length(notes) <= 3000),
  estimated_duration_minutes smallint
    check (estimated_duration_minutes between 1 and 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_templates_custom_type
    check (
      (workout_type = 'custom' and custom_workout_type is not null)
      or workout_type <> 'custom'
    ),
  constraint workout_templates_id_user_unique unique (id, user_id)
);

create index workout_templates_user_idx
  on public.workout_templates(user_id, updated_at desc);

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_library_id uuid references public.exercise_library(id) on delete set null,
  exercise_name text not null
    check (char_length(btrim(exercise_name)) between 1 and 120),
  category public.exercise_category not null default 'other',
  position smallint not null default 0
    check (position between 0 and 500),
  notes text
    check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_template_exercises_template_owner_fk
    foreign key (template_id, user_id)
    references public.workout_templates(id, user_id)
    on delete cascade,
  constraint workout_template_exercises_id_user_unique unique (id, user_id),
  constraint workout_template_exercises_position_unique unique (template_id, position)
);

create table public.workout_template_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  set_number smallint not null
    check (set_number between 1 and 200),
  repetitions integer
    check (repetitions between 0 and 100000),
  hold_seconds numeric(10, 2)
    check (hold_seconds >= 0),
  added_weight numeric(10, 2)
    check (added_weight >= 0),
  assistance_weight numeric(10, 2)
    check (assistance_weight >= 0),
  distance_meters numeric(12, 2)
    check (distance_meters >= 0),
  rest_seconds integer
    check (rest_seconds between 0 and 86400),
  tempo text
    check (tempo is null or char_length(tempo) <= 32),
  band_level text
    check (band_level is null or char_length(band_level) <= 60),
  notes text
    check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_template_sets_exercise_owner_fk
    foreign key (template_exercise_id, user_id)
    references public.workout_template_exercises(id, user_id)
    on delete cascade,
  constraint workout_template_sets_set_number_unique
    unique (template_exercise_id, set_number)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  category public.skill_category not null default 'other',
  description text
    check (description is null or char_length(description) <= 2000),
  difficulty_order smallint not null
    check (difficulty_order between 1 and 1000),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_system_owner
    check ((is_system and owner_id is null) or (not is_system and owner_id is not null))
);

create unique index skills_system_name_idx
  on public.skills(lower(name))
  where owner_id is null;
create unique index skills_owner_name_idx
  on public.skills(owner_id, lower(name))
  where owner_id is not null;
create index skills_difficulty_idx
  on public.skills(category, difficulty_order);

create table public.skill_progressions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  stage_order smallint not null
    check (stage_order between 1 and 100),
  description text
    check (description is null or char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skill_progressions_skill_stage_unique unique (skill_id, stage_order),
  constraint skill_progressions_id_skill_unique unique (id, skill_id)
);

create table public.skill_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  current_progression_id uuid,
  target_progression_id uuid,
  best_hold_seconds numeric(10, 2)
    check (best_hold_seconds >= 0),
  max_repetitions integer
    check (max_repetitions between 0 and 100000),
  assistance_level text
    check (assistance_level is null or char_length(assistance_level) <= 120),
  added_weight numeric(10, 2)
    check (added_weight >= 0),
  achieved_on date,
  confidence_rating smallint
    check (confidence_rating between 1 and 10),
  technique_rating smallint
    check (technique_rating between 1 and 10),
  notes text
    check (notes is null or char_length(notes) <= 5000),
  media_path text
    check (media_path is null or char_length(media_path) <= 1024),
  status public.skill_status not null default 'not_started',
  recorded_at timestamptz not null default now(),
  visibility public.content_visibility not null default 'partner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skill_entries_current_progression_fk
    foreign key (current_progression_id, skill_id)
    references public.skill_progressions(id, skill_id)
    on delete no action,
  constraint skill_entries_target_progression_fk
    foreign key (target_progression_id, skill_id)
    references public.skill_progressions(id, skill_id)
    on delete no action
);

create index skill_entries_user_recorded_idx
  on public.skill_entries(user_id, recorded_at desc);
create index skill_entries_user_skill_recorded_idx
  on public.skill_entries(user_id, skill_id, recorded_at desc);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_kg numeric(7, 2)
    check (weight_kg > 0 and weight_kg <= 1000),
  body_fat_percentage numeric(5, 2)
    check (body_fat_percentage between 0 and 100),
  waist_cm numeric(7, 2)
    check (waist_cm > 0 and waist_cm <= 1000),
  chest_cm numeric(7, 2)
    check (chest_cm > 0 and chest_cm <= 1000),
  shoulders_cm numeric(7, 2)
    check (shoulders_cm > 0 and shoulders_cm <= 1000),
  upper_arm_cm numeric(7, 2)
    check (upper_arm_cm > 0 and upper_arm_cm <= 1000),
  forearm_cm numeric(7, 2)
    check (forearm_cm > 0 and forearm_cm <= 1000),
  thigh_cm numeric(7, 2)
    check (thigh_cm > 0 and thigh_cm <= 1000),
  calf_cm numeric(7, 2)
    check (calf_cm > 0 and calf_cm <= 1000),
  notes text
    check (notes is null or char_length(notes) <= 3000),
  photo_paths text[] not null default '{}',
  visibility public.content_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint body_measurements_has_value
    check (num_nonnulls(
      weight_kg,
      body_fat_percentage,
      waist_cm,
      chest_cm,
      shoulders_cm,
      upper_arm_cm,
      forearm_cm,
      thigh_cm,
      calf_cm
    ) > 0),
  constraint body_measurements_photo_count
    check (cardinality(photo_paths) <= 12)
);

create index body_measurements_user_date_idx
  on public.body_measurements(user_id, measured_at desc);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null
    check (char_length(btrim(title)) between 1 and 160),
  goal_type public.goal_type not null,
  exercise_library_id uuid references public.exercise_library(id) on delete set null,
  skill_id uuid references public.skills(id) on delete set null,
  starting_value numeric(14, 3),
  target_value numeric(14, 3) not null,
  current_value numeric(14, 3),
  unit text
    check (unit is null or char_length(unit) <= 40),
  start_date date not null default current_date,
  target_date date,
  status public.goal_status not null default 'active',
  notes text
    check (notes is null or char_length(notes) <= 5000),
  visibility public.content_visibility not null default 'partner',
  tracking_mode public.progress_tracking_mode not null default 'manual',
  tracking_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(tracking_config) = 'object' and pg_column_size(tracking_config) <= 8192),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_target_after_start
    check (target_date is null or target_date >= start_date),
  constraint goals_completion_consistency
    check ((status = 'completed' and completed_at is not null) or status <> 'completed')
);

create index goals_user_status_idx
  on public.goals(user_id, status, target_date);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null
    check (char_length(btrim(title)) between 1 and 160),
  description text
    check (description is null or char_length(description) <= 5000),
  challenge_type public.challenge_type not null,
  metric_key text not null
    check (char_length(metric_key) between 1 and 80),
  target_value numeric(14, 3) not null
    check (target_value >= 0),
  unit text not null
    check (char_length(unit) between 1 and 40),
  starts_on date not null,
  ends_on date not null,
  status public.challenge_status not null default 'draft',
  visibility public.content_visibility not null default 'partner',
  scoring_rules jsonb not null default '{}'::jsonb
    check (jsonb_typeof(scoring_rules) = 'object' and pg_column_size(scoring_rules) <= 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenges_end_after_start check (ends_on >= starts_on)
);

create index challenges_creator_status_idx
  on public.challenges(created_by, status, ends_on);

create table public.challenge_members (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  starting_value numeric(14, 3) not null default 0,
  current_value numeric(14, 3) not null default 0,
  status public.challenge_member_status not null default 'joined',
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint challenge_members_unique unique (challenge_id, user_id),
  constraint challenge_members_completion_consistency
    check ((status = 'completed' and completed_at is not null) or status <> 'completed')
);

create index challenge_members_user_idx
  on public.challenge_members(user_id, updated_at desc);

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_library_id uuid references public.exercise_library(id) on delete set null,
  skill_id uuid references public.skills(id) on delete set null,
  exercise_set_id uuid,
  workout_id uuid,
  record_name text not null
    check (char_length(btrim(record_name)) between 1 and 160),
  record_type public.record_type not null,
  value numeric(14, 3) not null
    check (value >= 0),
  previous_value numeric(14, 3)
    check (previous_value >= 0),
  unit text not null
    check (char_length(unit) between 1 and 40),
  achieved_at timestamptz not null default now(),
  notes text
    check (notes is null or char_length(notes) <= 3000),
  visibility public.content_visibility not null default 'partner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_records_workout_owner_fk
    foreign key (workout_id, user_id)
    references public.workouts(id, user_id)
    on delete cascade,
  constraint personal_records_set_owner_fk
    foreign key (exercise_set_id, user_id)
    references public.exercise_sets(id, user_id)
    on delete cascade
);

create index personal_records_user_date_idx
  on public.personal_records(user_id, achieved_at desc);
create index personal_records_exercise_type_idx
  on public.personal_records(user_id, exercise_library_id, record_type, achieved_at desc);
create index personal_records_workout_idx
  on public.personal_records(workout_id)
  where workout_id is not null;
create index personal_records_set_idx
  on public.personal_records(exercise_set_id)
  where exercise_set_id is not null;

create table public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type public.activity_type not null,
  entity_type text
    check (entity_type is null or char_length(entity_type) <= 60),
  entity_id uuid,
  title text not null
    check (char_length(btrim(title)) between 1 and 180),
  message text
    check (message is null or char_length(message) <= 1000),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 8192),
  occurred_at timestamptz not null default now(),
  visibility public.content_visibility not null default 'partner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activity_feed_user_date_idx
  on public.activity_feed(user_id, occurred_at desc);
create index activity_feed_partner_date_idx
  on public.activity_feed(visibility, occurred_at desc);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activity_feed(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction public.reaction_kind not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reactions_one_per_user_activity unique (activity_id, user_id)
);

create index reactions_user_idx
  on public.reactions(user_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  activity_id uuid references public.activity_feed(id) on delete cascade,
  notification_type text not null
    check (char_length(notification_type) between 1 and 60),
  title text not null
    check (char_length(btrim(title)) between 1 and 180),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_unread_idx
  on public.notifications(recipient_user_id, created_at desc)
  where read_at is null;
create unique index notifications_event_unique_idx
  on public.notifications(
    recipient_user_id,
    actor_user_id,
    activity_id,
    notification_type
  )
  where actor_user_id is not null and activity_id is not null;
