-- Local/demo seed. Do not run against production unless you explicitly want
-- the two documented demo accounts. Remove them with `demo_cleanup.sql`.
--
-- Both local users use this password: CalisthenicsDemo!26
--   ava.martin@demo.calisthenics.local
--   noah.chen@demo.calisthenics.local

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'd0000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'ava.martin@demo.calisthenics.local',
    extensions.crypt('CalisthenicsDemo!26', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Ava Martin"}'::jsonb,
    now() - interval '6 months',
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd0000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'noah.chen@demo.calisthenics.local',
    extensions.crypt('CalisthenicsDemo!26', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Noah Chen"}'::jsonb,
    now() - interval '6 months',
    now()
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    'd1000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    '{"sub":"d0000000-0000-4000-8000-000000000001","email":"ava.martin@demo.calisthenics.local","email_verified":true}'::jsonb,
    'email',
    now() - interval '1 day',
    now() - interval '6 months',
    now()
  ),
  (
    'd1000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000002',
    '{"sub":"d0000000-0000-4000-8000-000000000002","email":"noah.chen@demo.calisthenics.local","email_verified":true}'::jsonb,
    'email',
    now() - interval '2 days',
    now() - interval '6 months',
    now()
  )
on conflict do nothing;

insert into public.profiles (
  id,
  display_name,
  bio,
  timezone,
  measurement_sharing,
  progress_photo_visibility,
  share_activity,
  is_demo
)
values
  (
    'd0000000-0000-4000-8000-000000000001',
    'Ava Martin',
    'Building a confident handstand and ten strict pull-ups.',
    'America/New_York',
    'detailed',
    'partner',
    true,
    true
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'Noah Chen',
    'Consistent basics, patient skill work.',
    'America/Los_Angeles',
    'summary',
    'partner',
    true,
    true
  )
on conflict (id) do update set
  display_name = excluded.display_name,
  bio = excluded.bio,
  timezone = excluded.timezone,
  measurement_sharing = excluded.measurement_sharing,
  progress_photo_visibility = excluded.progress_photo_visibility,
  share_activity = excluded.share_activity,
  is_demo = true;

insert into public.user_preferences (
  user_id,
  unit_preference,
  theme_preference,
  default_workout_duration_minutes,
  week_starts_on
)
values
  ('d0000000-0000-4000-8000-000000000001', 'metric', 'system', 55, 1),
  ('d0000000-0000-4000-8000-000000000002', 'imperial', 'dark', 45, 1)
on conflict (user_id) do update set
  unit_preference = excluded.unit_preference,
  theme_preference = excluded.theme_preference,
  default_workout_duration_minutes = excluded.default_workout_duration_minutes,
  week_starts_on = excluded.week_starts_on;

insert into public.friend_connections (
  id,
  requester_id,
  addressee_id,
  status,
  requested_at,
  accepted_at
)
values (
  'd2000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000002',
  'accepted',
  now() - interval '5 months',
  now() - interval '5 months' + interval '4 minutes'
)
on conflict (member_low, member_high) do update set
  status = 'accepted',
  accepted_at = excluded.accepted_at,
  disconnected_at = null;

insert into public.workouts (
  id,
  user_id,
  workout_date,
  start_time,
  end_time,
  name,
  workout_type,
  status,
  notes,
  perceived_difficulty,
  energy_level,
  location,
  visibility
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    current_date,
    current_date + time '07:10',
    current_date + time '08:02',
    'Pull strength + L-sit',
    'strength',
    'completed',
    'Kept every pull-up strict and left one rep in reserve.',
    8,
    8,
    'Riverside bars',
    'partner'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000001',
    current_date - 1,
    current_date - 1 + time '18:15',
    current_date - 1 + time '18:52',
    'Handstand line work',
    'skill',
    'completed',
    'Best balance felt quiet through the fingertips.',
    6,
    7,
    'Home',
    'partner'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    'd0000000-0000-4000-8000-000000000001',
    current_date - 2,
    current_date - 2 + time '07:20',
    current_date - 2 + time '08:10',
    'Push volume',
    'strength',
    'completed',
    'Smooth tempo and a clean final dip set.',
    7,
    8,
    'Riverside bars',
    'partner'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    'd0000000-0000-4000-8000-000000000001',
    current_date - 6,
    current_date - 6 + time '17:40',
    current_date - 6 + time '18:35',
    'Full body foundations',
    'mixed',
    'completed',
    'Good quality throughout.',
    7,
    6,
    'Community gym',
    'partner'
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    'd0000000-0000-4000-8000-000000000001',
    current_date + 2,
    current_date + 2 + time '07:00',
    current_date + 2 + time '08:00',
    'Planned lever session',
    'skill',
    'planned',
    'Tuck front-lever quality and rows.',
    null,
    null,
    'Riverside bars',
    'partner'
  ),
  (
    '40000000-0000-4000-8000-000000000006',
    'd0000000-0000-4000-8000-000000000002',
    current_date,
    current_date + time '06:35',
    current_date + time '07:20',
    'Push + pistols',
    'strength',
    'completed',
    'First set of pistols was the cleanest.',
    8,
    7,
    'Home',
    'partner'
  ),
  (
    '40000000-0000-4000-8000-000000000007',
    'd0000000-0000-4000-8000-000000000002',
    current_date - 2,
    current_date - 2 + time '18:00',
    current_date - 2 + time '18:48',
    'Pull foundations',
    'strength',
    'completed',
    'Assistance dropped while all reps stayed smooth.',
    7,
    8,
    'Neighborhood park',
    'partner'
  ),
  (
    '40000000-0000-4000-8000-000000000008',
    'd0000000-0000-4000-8000-000000000002',
    current_date - 4,
    current_date - 4 + time '07:00',
    current_date - 4 + time '07:42',
    'Core control',
    'skill',
    'completed',
    'L-sit holds stayed above parallel.',
    6,
    7,
    'Home',
    'partner'
  ),
  (
    '40000000-0000-4000-8000-000000000009',
    'd0000000-0000-4000-8000-000000000002',
    current_date - 9,
    current_date - 9 + time '17:30',
    current_date - 9 + time '18:25',
    'Park circuit',
    'conditioning',
    'completed',
    'Even pacing across four rounds.',
    8,
    6,
    'Neighborhood park',
    'partner'
  ),
  (
    '40000000-0000-4000-8000-000000000010',
    'd0000000-0000-4000-8000-000000000002',
    current_date + 1,
    current_date + 1 + time '18:00',
    current_date + 1 + time '18:45',
    'Planned handstand + pull',
    'mixed',
    'planned',
    null,
    null,
    null,
    'Neighborhood park',
    'partner'
  )
on conflict (id) do nothing;

insert into public.workout_exercises (
  id,
  workout_id,
  user_id,
  exercise_library_id,
  exercise_name,
  category,
  position,
  notes
)
values
  ('41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'Pull-Up', 'pull', 0, 'Dead hang every rep.'),
  ('41000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000009', 'L-Sit Hold', 'core', 1, null),
  ('41000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000008', 'Handstand Practice', 'balance', 0, 'Ten quality kick-ups.'),
  ('41000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Push-Up', 'push', 0, 'Three-second eccentric.'),
  ('41000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000006', 'Dip', 'push', 1, null),
  ('41000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000020', 'Australian Row', 'pull', 0, null),
  ('41000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000019', 'Bodyweight Squat', 'legs', 1, null),
  ('41000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000012', 'Front Lever Hold', 'pull', 0, null),
  ('41000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Push-Up', 'push', 0, null),
  ('41000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000014', 'Pistol Squat', 'legs', 1, 'Alternating legs.'),
  ('41000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', 'Pull-Up', 'pull', 0, 'Light band.'),
  ('41000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000020', 'Australian Row', 'pull', 1, null),
  ('41000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000009', 'L-Sit Hold', 'core', 0, null),
  ('41000000-0000-4000-8000-000000000014', '40000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000018', 'Hollow Body Hold', 'core', 1, null),
  ('41000000-0000-4000-8000-000000000015', '40000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', 'Pull-Up', 'pull', 0, null),
  ('41000000-0000-4000-8000-000000000016', '40000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Push-Up', 'push', 1, null),
  ('41000000-0000-4000-8000-000000000017', '40000000-0000-4000-8000-000000000010', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000008', 'Handstand Practice', 'balance', 0, null)
on conflict (id) do nothing;

insert into public.exercise_sets (
  id,
  workout_exercise_id,
  user_id,
  set_number,
  repetitions,
  hold_seconds,
  added_weight,
  assistance_weight,
  rest_seconds,
  tempo,
  band_level,
  completed,
  is_personal_record
)
values
  ('42000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 1, 8, null, 0, null, 120, '21X1', null, true, false),
  ('42000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 2, 7, null, 0, null, 120, '21X1', null, true, false),
  ('42000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 3, 6, null, 0, null, 120, '21X1', null, true, false),
  ('42000000-0000-4000-8000-000000000004', '41000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 1, null, 18, null, null, 75, null, null, true, true),
  ('42000000-0000-4000-8000-000000000005', '41000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 2, null, 14, null, null, 75, null, null, true, false),
  ('42000000-0000-4000-8000-000000000006', '41000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', 1, null, 26, null, null, 60, null, null, true, true),
  ('42000000-0000-4000-8000-000000000007', '41000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', 1, 20, null, 0, null, 90, '31X1', null, true, false),
  ('42000000-0000-4000-8000-000000000008', '41000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', 2, 18, null, 0, null, 90, '31X1', null, true, false),
  ('42000000-0000-4000-8000-000000000009', '41000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000001', 1, 12, null, 0, null, 120, '21X1', null, true, true),
  ('42000000-0000-4000-8000-000000000010', '41000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000001', 2, 10, null, 0, null, 120, '21X1', null, true, false),
  ('42000000-0000-4000-8000-000000000011', '41000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000001', 1, 15, null, 0, null, 75, '2111', null, true, false),
  ('42000000-0000-4000-8000-000000000012', '41000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000001', 1, 25, null, 0, null, 75, '3010', null, true, false),
  ('42000000-0000-4000-8000-000000000013', '41000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000001', 1, null, 12, null, null, 90, null, null, false, false),
  ('42000000-0000-4000-8000-000000000014', '41000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000002', 1, 30, null, 0, null, 90, '21X1', null, true, true),
  ('42000000-0000-4000-8000-000000000015', '41000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000002', 2, 24, null, 0, null, 90, '21X1', null, true, false),
  ('42000000-0000-4000-8000-000000000016', '41000000-0000-4000-8000-000000000010', 'd0000000-0000-4000-8000-000000000002', 1, 5, null, 0, null, 90, '31X1', null, true, true),
  ('42000000-0000-4000-8000-000000000017', '41000000-0000-4000-8000-000000000010', 'd0000000-0000-4000-8000-000000000002', 2, 4, null, 0, null, 90, '31X1', null, true, false),
  ('42000000-0000-4000-8000-000000000018', '41000000-0000-4000-8000-000000000011', 'd0000000-0000-4000-8000-000000000002', 1, 6, null, 0, 12, 120, '21X1', 'light', true, false),
  ('42000000-0000-4000-8000-000000000019', '41000000-0000-4000-8000-000000000011', 'd0000000-0000-4000-8000-000000000002', 2, 6, null, 0, 12, 120, '21X1', 'light', true, true),
  ('42000000-0000-4000-8000-000000000020', '41000000-0000-4000-8000-000000000012', 'd0000000-0000-4000-8000-000000000002', 1, 14, null, 0, null, 75, '2111', null, true, false),
  ('42000000-0000-4000-8000-000000000021', '41000000-0000-4000-8000-000000000013', 'd0000000-0000-4000-8000-000000000002', 1, null, 12, null, null, 75, null, null, true, true),
  ('42000000-0000-4000-8000-000000000022', '41000000-0000-4000-8000-000000000013', 'd0000000-0000-4000-8000-000000000002', 2, null, 9, null, null, 75, null, null, true, false),
  ('42000000-0000-4000-8000-000000000023', '41000000-0000-4000-8000-000000000014', 'd0000000-0000-4000-8000-000000000002', 1, null, 35, null, null, 60, null, null, true, false),
  ('42000000-0000-4000-8000-000000000024', '41000000-0000-4000-8000-000000000015', 'd0000000-0000-4000-8000-000000000002', 1, 5, null, 0, 18, 60, null, 'medium', true, false),
  ('42000000-0000-4000-8000-000000000025', '41000000-0000-4000-8000-000000000016', 'd0000000-0000-4000-8000-000000000002', 1, 18, null, 0, null, 60, null, null, true, false),
  ('42000000-0000-4000-8000-000000000026', '41000000-0000-4000-8000-000000000017', 'd0000000-0000-4000-8000-000000000002', 1, null, 20, null, null, 60, null, null, false, false)
on conflict (id) do nothing;

insert into public.workout_templates (
  id,
  user_id,
  name,
  workout_type,
  notes,
  estimated_duration_minutes
)
values
  ('43000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Pull + core repeat', 'strength', 'Quality pulling followed by compression.', 50),
  ('43000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'Foundation circuit', 'mixed', 'Three controlled rounds.', 40)
on conflict (id) do nothing;

insert into public.workout_template_exercises (
  id,
  template_id,
  user_id,
  exercise_library_id,
  exercise_name,
  category,
  position
)
values
  ('43100000-0000-4000-8000-000000000001', '43000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'Pull-Up', 'pull', 0),
  ('43100000-0000-4000-8000-000000000002', '43000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000009', 'L-Sit Hold', 'core', 1),
  ('43100000-0000-4000-8000-000000000003', '43000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Push-Up', 'push', 0),
  ('43100000-0000-4000-8000-000000000004', '43000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000020', 'Australian Row', 'pull', 1)
on conflict (id) do nothing;

insert into public.workout_template_sets (
  id,
  template_exercise_id,
  user_id,
  set_number,
  repetitions,
  hold_seconds,
  rest_seconds
)
values
  ('43200000-0000-4000-8000-000000000001', '43100000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 1, 7, null, 120),
  ('43200000-0000-4000-8000-000000000002', '43100000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 2, 7, null, 120),
  ('43200000-0000-4000-8000-000000000003', '43100000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 1, null, 15, 75),
  ('43200000-0000-4000-8000-000000000004', '43100000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002', 1, 20, null, 60),
  ('43200000-0000-4000-8000-000000000005', '43100000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000002', 1, 12, null, 60)
on conflict (id) do nothing;

insert into public.skill_entries (
  id,
  user_id,
  skill_id,
  current_progression_id,
  target_progression_id,
  best_hold_seconds,
  max_repetitions,
  assistance_level,
  added_weight,
  achieved_on,
  confidence_rating,
  technique_rating,
  notes,
  status,
  recorded_at,
  visibility
)
values
  ('50000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000006', '31000000-0000-4000-8000-000000000602', '31000000-0000-4000-8000-000000000604', null, 5, 'light band', 0, null, 6, 7, 'Smooth assisted reps.', 'developing', now() - interval '90 days', 'partner'),
  ('50000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000006', '31000000-0000-4000-8000-000000000604', '31000000-0000-4000-8000-000000000604', null, 8, 'none', 0, current_date - 25, 8, 8, 'Eight strict reps from a dead hang.', 'achieved', now() - interval '1 day', 'partner'),
  ('50000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', '31000000-0000-4000-8000-000000000402', '31000000-0000-4000-8000-000000000404', 12, null, null, null, null, 7, 7, 'Heel pulls are becoming consistent.', 'developing', now() - interval '50 days', 'partner'),
  ('50000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', '31000000-0000-4000-8000-000000000403', '31000000-0000-4000-8000-000000000404', 26, null, null, null, current_date - 1, 8, 8, 'A calm 26-second freestanding hold.', 'achieved', now() - interval '20 hours', 'partner'),
  ('50000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000010', '31000000-0000-4000-8000-000000001003', '31000000-0000-4000-8000-000000001003', 18, null, null, null, current_date, 8, 9, 'Toes stayed level with hips.', 'achieved', now() - interval '2 hours', 'partner'),
  ('50000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000104', '31000000-0000-4000-8000-000000000104', null, 30, 'none', 0, current_date, 9, 8, 'Thirty continuous strict reps.', 'mastered', now() - interval '5 hours', 'partner'),
  ('50000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000006', '31000000-0000-4000-8000-000000000602', '31000000-0000-4000-8000-000000000604', null, 6, 'light band', 0, null, 7, 8, 'Reducing assistance next week.', 'developing', now() - interval '2 days', 'partner'),
  ('50000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000010', '31000000-0000-4000-8000-000000001002', '31000000-0000-4000-8000-000000001003', 12, null, null, null, null, 7, 7, 'One-leg positions are stable.', 'developing', now() - interval '4 days', 'partner'),
  ('50000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000021', '31000000-0000-4000-8000-000000002104', '31000000-0000-4000-8000-000000002104', null, 5, 'none', 0, current_date, 8, 8, 'Five clean reps each side.', 'achieved', now() - interval '4 hours', 'partner')
on conflict (id) do nothing;

insert into public.body_measurements (
  id,
  user_id,
  measured_at,
  weight_kg,
  body_fat_percentage,
  waist_cm,
  chest_cm,
  shoulders_cm,
  upper_arm_cm,
  forearm_cm,
  thigh_cm,
  calf_cm,
  notes,
  visibility
)
values
  ('60000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', now() - interval '90 days', 63.8, 19.2, 73.4, 89.5, 104.0, 29.4, 24.8, 53.2, 35.3, 'Baseline after a rest week.', 'partner'),
  ('60000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', now() - interval '30 days', 63.2, 18.7, 72.6, 90.1, 104.8, 29.8, 25.0, 53.4, 35.4, null, 'partner'),
  ('60000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', now() - interval '1 day', 62.9, 18.3, 72.0, 90.4, 105.2, 30.1, 25.2, 53.6, 35.5, 'Morning measurement.', 'partner'),
  ('60000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000002', now() - interval '90 days', 78.5, 17.8, 84.0, 101.6, 117.0, 35.0, 29.3, 58.8, 38.0, 'Starting point.', 'partner'),
  ('60000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000002', now() - interval '30 days', 78.1, 17.4, 83.2, 102.0, 117.5, 35.4, 29.5, 59.0, 38.1, null, 'partner'),
  ('60000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000002', now() - interval '2 days', 77.8, 17.1, 82.7, 102.4, 118.0, 35.7, 29.7, 59.2, 38.2, 'Consistent conditions.', 'partner')
on conflict (id) do nothing;

insert into public.goals (
  id,
  user_id,
  title,
  goal_type,
  exercise_library_id,
  skill_id,
  starting_value,
  target_value,
  current_value,
  unit,
  start_date,
  target_date,
  status,
  notes,
  visibility,
  tracking_mode,
  tracking_config,
  completed_at
)
values
  ('70000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Complete 10 strict pull-ups', 'repetitions', '20000000-0000-4000-8000-000000000004', null, 5, 10, 8, 'reps', current_date - 60, current_date + 45, 'active', 'No kip; start each rep from a dead hang.', 'partner', 'automatic', '{"recordType":"repetitions","exerciseId":"20000000-0000-4000-8000-000000000004"}', null),
  ('70000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'Hold a handstand for 30 seconds', 'hold_time', null, '30000000-0000-4000-8000-000000000004', 8, 30, 26, 'seconds', current_date - 45, current_date + 30, 'active', 'Quality line counts more than saving a poor hold.', 'partner', 'automatic', '{"recordType":"hold_seconds","skillId":"30000000-0000-4000-8000-000000000004"}', null),
  ('70000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002', 'Train four times per week', 'workout_frequency', null, null, 2, 4, 3, 'workouts/week', current_date - 21, current_date + 70, 'active', 'Mobility-only sessions count when they are logged.', 'partner', 'automatic', '{"period":"week","status":"completed"}', null),
  ('70000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000002', 'Reach 25 consecutive push-ups', 'repetitions', '20000000-0000-4000-8000-000000000001', null, 18, 25, 30, 'reps', current_date - 75, current_date - 1, 'completed', 'Completed with a strict set of thirty.', 'partner', 'automatic', '{"recordType":"repetitions","exerciseId":"20000000-0000-4000-8000-000000000001"}', now() - interval '5 hours')
on conflict (id) do nothing;

insert into public.challenges (
  id,
  created_by,
  title,
  description,
  challenge_type,
  metric_key,
  target_value,
  unit,
  starts_on,
  ends_on,
  status,
  visibility,
  scoring_rules
)
values (
  '80000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000001',
  '12 workouts this month',
  'Complete twelve intentional sessions each. Mobility and recovery sessions count.',
  'shared_target',
  'workouts_completed',
  12,
  'workouts',
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
  'active',
  'partner',
  '{"formula":"Count workouts where status = completed and workout_date falls within the challenge dates.","hiddenBonuses":false}'::jsonb
)
on conflict (id) do nothing;

insert into public.challenge_members (
  id,
  challenge_id,
  user_id,
  starting_value,
  current_value,
  status,
  joined_at
)
values
  ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 0, 7, 'joined', now() - interval '18 days'),
  ('81000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 0, 6, 'joined', now() - interval '18 days')
on conflict (id) do nothing;

insert into public.personal_records (
  id,
  user_id,
  exercise_library_id,
  skill_id,
  workout_id,
  record_name,
  record_type,
  value,
  previous_value,
  unit,
  achieved_at,
  notes,
  visibility
)
values
  ('90000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', null, '40000000-0000-4000-8000-000000000001', 'Strict Pull-Up', 'repetitions', 8, 7, 'reps', now() - interval '3 hours', 'All reps started from a dead hang.', 'partner'),
  ('90000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000002', 'Freestanding Handstand', 'hold_seconds', 26, 21, 'seconds', now() - interval '20 hours', 'Stable entry and controlled step-down.', 'partner'),
  ('90000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000006', null, '40000000-0000-4000-8000-000000000003', 'Strict Dip', 'repetitions', 12, 10, 'reps', now() - interval '2 days', null, 'partner'),
  ('90000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000006', 'Strict Push-Up', 'repetitions', 30, 25, 'reps', now() - interval '5 hours', 'Unbroken set with consistent depth.', 'partner'),
  ('90000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000008', 'One-Leg L-Sit', 'hold_seconds', 12, 9, 'seconds', now() - interval '4 days', null, 'partner')
on conflict (id) do nothing;

insert into public.activity_feed (
  id,
  user_id,
  activity_type,
  entity_type,
  entity_id,
  title,
  message,
  metadata,
  occurred_at,
  visibility
)
values
  ('a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'encouragement', 'challenge', '80000000-0000-4000-8000-000000000001', 'Ava checked in', 'Seven sessions down—let’s keep the month steady.', '{"challengeProgress":7}'::jsonb, now() - interval '10 hours', 'partner'),
  ('a0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'encouragement', 'challenge', '80000000-0000-4000-8000-000000000001', 'Noah checked in', 'Recovery day logged. Pull work tomorrow.', '{"challengeProgress":6}'::jsonb, now() - interval '8 hours', 'partner')
on conflict (id) do nothing;

insert into public.reactions (
  id,
  activity_id,
  user_id,
  reaction
)
values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'respect'),
  ('a1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'keep_going')
on conflict (id) do nothing;
