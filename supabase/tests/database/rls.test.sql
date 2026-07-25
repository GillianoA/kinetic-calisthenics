-- Run after `supabase db reset`:
--   supabase test db

begin;

create extension if not exists pgtap with schema extensions;

-- Test-only unrelated account and two rows used to prove policy boundaries.
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
values (
  '00000000-0000-0000-0000-000000000000',
  'e0000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'unrelated@rls.test',
  extensions.crypt('TemporaryTest!26', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Unrelated Test User"}'::jsonb,
  now(),
  now()
);

insert into public.workouts (
  id,
  user_id,
  workout_date,
  name,
  workout_type,
  status,
  visibility
)
values
  (
    'e4000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    current_date,
    'Noah private test workout',
    'strength',
    'completed',
    'private'
  ),
  (
    'e4000000-0000-4000-8000-000000000002',
    'e0000000-0000-4000-8000-000000000001',
    current_date,
    'Unrelated shared test workout',
    'strength',
    'completed',
    'partner'
  );

insert into public.skills (
  id,
  owner_id,
  name,
  category,
  difficulty_order,
  is_system
)
values
  (
    'e3000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'Noah private custom skill',
    'other',
    999,
    false
  ),
  (
    'e3000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000002',
    'Noah shared custom skill',
    'other',
    1000,
    false
  );

insert into public.skill_entries (
  id,
  user_id,
  skill_id,
  status,
  visibility
)
values
  (
    'e3100000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'e3000000-0000-4000-8000-000000000001',
    'learning',
    'private'
  ),
  (
    'e3100000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000002',
    'e3000000-0000-4000-8000-000000000002',
    'learning',
    'partner'
  );

insert into public.exercise_library (
  id,
  owner_id,
  name,
  category,
  is_system
)
values
  (
    'e2000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'Noah private custom exercise',
    'other',
    false
  ),
  (
    'e2000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000002',
    'Noah shared custom exercise',
    'other',
    false
  );

insert into public.workout_exercises (
  id,
  workout_id,
  user_id,
  exercise_library_id,
  exercise_name,
  category,
  position
)
values
  (
    'e4100000-0000-4000-8000-000000000001',
    'e4000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'e2000000-0000-4000-8000-000000000001',
    'Noah private custom exercise',
    'other',
    99
  ),
  (
    'e4100000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000006',
    'd0000000-0000-4000-8000-000000000002',
    'e2000000-0000-4000-8000-000000000002',
    'Noah shared custom exercise',
    'other',
    99
  );

update public.body_measurements
set photo_paths = array[
  'd0000000-0000-4000-8000-000000000002/shared/measurements/noah-progress.webp'
]
where id = '60000000-0000-4000-8000-000000000006';

insert into public.activity_feed (
  id,
  user_id,
  activity_type,
  entity_type,
  entity_id,
  title,
  visibility
)
values
  (
    'e5000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'workout_completed',
    'workout',
    '40000000-0000-4000-8000-000000000006',
    'Visible notification activity',
    'partner'
  ),
  (
    'e5000000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000002',
    'workout_completed',
    'workout',
    'e4000000-0000-4000-8000-000000000001',
    'Private notification activity',
    'private'
  );

insert into public.notifications (
  id,
  recipient_user_id,
  actor_user_id,
  activity_id,
  notification_type,
  title
)
values
  (
    'e5100000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'e5000000-0000-4000-8000-000000000001',
    'activity',
    'Visible notification'
  ),
  (
    'e5100000-0000-4000-8000-000000000002',
    'd0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000002',
    'e5000000-0000-4000-8000-000000000002',
    'activity',
    'Hidden notification'
  );

insert into public.goals (
  id,
  user_id,
  title,
  goal_type,
  starting_value,
  target_value,
  current_value,
  unit,
  start_date,
  status,
  visibility,
  tracking_mode
)
values (
  'e5200000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000001',
  'Live weekly progress test',
  'workout_frequency',
  0,
  4,
  99,
  'workouts/week',
  current_date - 60,
  'active',
  'private',
  'automatic'
);

select extensions.plan(37);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select extensions.is(
  auth.uid(),
  'd0000000-0000-4000-8000-000000000001'::uuid,
  'test JWT resolves to Ava'
);

select extensions.results_eq(
  $$select count(*)::bigint from public.get_accountability_targets()$$,
  $$values (2::bigint)$$,
  'accountability targets are limited to the user and accepted partner'
);

select extensions.results_eq(
  $$select effective_current_value
    from public.goal_progress_live
    where id = 'e5200000-0000-4000-8000-000000000001'$$,
  $$select count(*)::numeric
    from public.workouts
    where user_id = 'd0000000-0000-4000-8000-000000000001'
      and status = 'completed'
      and workout_date >= date_trunc('week', current_date)::date
      and workout_date < date_trunc('week', current_date)::date + 7$$,
  'weekly-frequency progress is computed for the current week at read time'
);

select extensions.results_eq(
  $$select id from public.profiles where id = 'd0000000-0000-4000-8000-000000000002'$$,
  $$values ('d0000000-0000-4000-8000-000000000002'::uuid)$$,
  'active partners can read one another profiles'
);

select extensions.results_eq(
  $$select count(*)::bigint from public.workouts where user_id = 'd0000000-0000-4000-8000-000000000002' and visibility = 'partner'$$,
  $$values (5::bigint)$$,
  'partner-visible workouts are readable'
);

select extensions.results_eq(
  $$select count(*)::bigint from public.workouts where id = 'e4000000-0000-4000-8000-000000000001'$$,
  $$values (0::bigint)$$,
  'a partner private workout is hidden'
);

select extensions.results_eq(
  $$select count(*)::bigint from public.workouts where id = 'e4000000-0000-4000-8000-000000000002'$$,
  $$values (0::bigint)$$,
  'an unrelated account shared row is still hidden'
);

select extensions.results_eq(
  $$select count(*)::bigint from public.body_measurements where user_id = 'd0000000-0000-4000-8000-000000000002'$$,
  $$values (0::bigint)$$,
  'summary measurement sharing does not expose detailed rows'
);

select extensions.results_eq(
  $$select id from public.skills where id in (
      'e3000000-0000-4000-8000-000000000001',
      'e3000000-0000-4000-8000-000000000002'
    ) order by id$$,
  $$values ('e3000000-0000-4000-8000-000000000002'::uuid)$$,
  'a partner sees a custom skill only through partner-visible content'
);

select extensions.results_eq(
  $$select count(*)::bigint from public.skills
    where id = 'e3000000-0000-4000-8000-000000000001'$$,
  $$values (0::bigint)$$,
  'a private custom skill definition remains hidden from the partner'
);

select extensions.results_eq(
  $$select id from public.exercise_library where id in (
      'e2000000-0000-4000-8000-000000000001',
      'e2000000-0000-4000-8000-000000000002'
    ) order by id$$,
  $$values ('e2000000-0000-4000-8000-000000000002'::uuid)$$,
  'a partner sees a custom exercise only through a shared workout'
);

select extensions.results_eq(
  $$select count(*)::bigint from public.exercise_library
    where id = 'e2000000-0000-4000-8000-000000000001'$$,
  $$values (0::bigint)$$,
  'a private custom exercise definition remains hidden from the partner'
);

select extensions.results_eq(
  $$select count(*)::bigint from public.get_partner_measurement_summary('d0000000-0000-4000-8000-000000000002')$$,
  $$values (3::bigint)$$,
  'the authorized summary RPC exposes only summary columns'
);

select extensions.results_eq(
  $$select photo_path from public.get_partner_measurement_photo_refs(
      'd0000000-0000-4000-8000-000000000002'
    )$$,
  $$values (
      'd0000000-0000-4000-8000-000000000002/shared/measurements/noah-progress.webp'::text
    )$$,
  'photo sharing can expose an exact shared reference without measurement detail'
);

select extensions.throws_ok(
  $$select * from public.get_partner_measurement_photo_refs(
      'e0000000-0000-4000-8000-000000000001'
    )$$,
  '42501',
  'Progress photos are not shared with this account',
  'the measurement-photo RPC rejects an unrelated owner'
);

select extensions.results_eq(
  $$select id from public.notifications
    where id in (
      'e5100000-0000-4000-8000-000000000001',
      'e5100000-0000-4000-8000-000000000002'
    )
    order by id$$,
  $$values ('e5100000-0000-4000-8000-000000000001'::uuid)$$,
  'notifications are visible only while their underlying activity is visible'
);

select extensions.lives_ok(
  $$update public.notifications
    set read_at = now()
    where id = 'e5100000-0000-4000-8000-000000000001'$$,
  'a recipient can mark a visible notification as read'
);

select extensions.throws_ok(
  $$update public.notifications
    set title = 'Client rewrite'
    where id = 'e5100000-0000-4000-8000-000000000001'$$,
  '42501',
  'permission denied for table notifications',
  'a recipient cannot rewrite trusted notification content'
);

select extensions.results_eq(
  $$select current_value, status::text
    from public.goals
    where id = '70000000-0000-4000-8000-000000000002'$$,
  $$values (26::numeric, 'active'::text)$$,
  'a skill-bound hold goal initializes from qualifying skill-entry history'
);

select extensions.lives_ok(
  $$insert into public.skill_entries (
      id,
      user_id,
      skill_id,
      best_hold_seconds,
      status,
      recorded_at,
      visibility
    ) values (
      'e3200000-0000-4000-8000-000000000001',
      'd0000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000004',
      31,
      'achieved',
      now(),
      'private'
    )$$,
  'a new skill metric can advance a skill-bound automatic goal'
);

select extensions.results_eq(
  $$select current_value, status::text
    from public.goals
    where id = '70000000-0000-4000-8000-000000000002'$$,
  $$values (31::numeric, 'completed'::text)$$,
  'the skill-bound hold goal completes from the new best skill entry'
);

select extensions.lives_ok(
  $$update public.skill_entries
    set best_hold_seconds = 10
    where id = 'e3200000-0000-4000-8000-000000000001'$$,
  'editing a skill metric triggers a complete goal recomputation'
);

select extensions.results_eq(
  $$select current_value, status::text
    from public.goals
    where id = '70000000-0000-4000-8000-000000000002'$$,
  $$values (26::numeric, 'active'::text)$$,
  'skill-bound automatic progress falls back to the best remaining in-window entry'
);

select extensions.lives_ok(
  $$update public.skill_entries
    set visibility = 'partner'
    where id = 'e3200000-0000-4000-8000-000000000001'$$,
  'skill activity can follow a source entry into partner visibility'
);

select extensions.lives_ok(
  $$update public.skill_entries
    set visibility = 'private'
    where id = 'e3200000-0000-4000-8000-000000000001'$$,
  'skill activity can follow a source entry back to private visibility'
);

select extensions.results_eq(
  $$select visibility::text
    from public.activity_feed
    where entity_type = 'skill_entry'
      and entity_id = 'e3200000-0000-4000-8000-000000000001'$$,
  $$values ('private'::text)$$,
  'derived skill activity mirrors the source privacy setting'
);

select extensions.throws_ok(
  $$insert into public.activity_feed (
      user_id,
      activity_type,
      entity_type,
      title,
      visibility
    ) values (
      'd0000000-0000-4000-8000-000000000001',
      'personal_record',
      'personal_record',
      'Forged achievement',
      'partner'
    )$$,
  '42501',
  'permission denied for table activity_feed',
  'authenticated clients cannot insert directly into the activity feed'
);

select extensions.ok(
  public.send_encouragement('Strong work') is not null,
  'an authenticated user can send a bounded encouragement through the RPC'
);

select extensions.ok(
  (
    select
      message = 'A private encouragement from your accountability partner.'
      and metadata = jsonb_build_object(
        'recipient_id', 'd0000000-0000-4000-8000-000000000002'::uuid,
        'encouragement', 'Strong work'
      )
      and created_at > now() - interval '1 minute'
      and occurred_at > now() - interval '1 minute'
    from public.activity_feed
    where user_id = 'd0000000-0000-4000-8000-000000000001'
      and activity_type = 'encouragement'
      and entity_id = 'd0000000-0000-4000-8000-000000000002'
    order by created_at desc
    limit 1
  ),
  'encouragement text, metadata, and timestamps are server-controlled'
);

select extensions.throws_ok(
  $$select public.send_encouragement('Free-form message')$$,
  '22023',
  'Unsupported encouragement',
  'the encouragement RPC rejects text outside the product vocabulary'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e0000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select extensions.throws_ok(
  $$select public.send_encouragement('Respect')$$,
  'P0002',
  'No connected partner',
  'an unrelated user cannot choose or reach another recipient'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select extensions.throws_ok(
  $$insert into public.workouts (user_id, workout_date, name, workout_type, status, visibility)
    values ('d0000000-0000-4000-8000-000000000002', current_date, 'Forged', 'strength', 'completed', 'partner')$$,
  '42501',
  'new row violates row-level security policy for table "workouts"',
  'a user cannot insert a workout for their partner'
);

select extensions.is(
  (
    with changed as (
      update public.workouts
      set name = 'Forged update'
      where id = '40000000-0000-4000-8000-000000000006'
      returning id
    )
    select count(*)::bigint from changed
  ),
  0::bigint,
  'a user cannot update their partner workout'
);

select extensions.throws_ok(
  $$select public.save_workout_with_exercises(
      '{"workoutDate":"2026-07-23","name":"Forged","workoutType":"strength","visibility":"partner","exercises":[]}'::jsonb,
      '40000000-0000-4000-8000-000000000006'
    )$$,
  '42501',
  'Workout does not exist or is owned by another account',
  'the atomic workout RPC rejects a foreign workout UUID'
);

select extensions.ok(
  public.save_workout_with_exercises(
    jsonb_build_object(
      'workoutDate', current_date,
      'name', 'RLS test workout',
      'workoutType', 'strength',
      'status', 'completed',
      'visibility', 'private',
      'exercises', jsonb_build_array(
        jsonb_build_object(
          'exerciseLibraryId', '20000000-0000-4000-8000-000000000001',
          'exerciseName', 'Push-Up',
          'category', 'push',
          'sets', jsonb_build_array(
            jsonb_build_object(
              'setNumber', 1,
              'repetitions', 10,
              'completed', true
            )
          )
        )
      )
    )
  ) is not null,
  'the atomic workout RPC creates an owned workout graph'
);

select extensions.throws_ok(
  $$select public.save_workout_with_exercises(
      jsonb_build_object(
        'workoutDate', current_date,
        'name', 'Private catalog reference test',
        'workoutType', 'strength',
        'status', 'completed',
        'visibility', 'private',
        'exercises', jsonb_build_array(
          jsonb_build_object(
            'exerciseLibraryId', 'e2000000-0000-4000-8000-000000000001',
            'exerciseName', 'Noah private custom exercise',
            'category', 'other',
            'sets', jsonb_build_array(
              jsonb_build_object(
                'setNumber', 1,
                'repetitions', 1,
                'completed', true
              )
            )
          )
        )
      )
    )$$,
  '42501',
  'Exercise library item is not visible to this account',
  'the atomic workout RPC rejects a partner private catalog item'
);

select extensions.throws_ok(
  $$select * from public.create_friend_invite(interval '7 days')$$,
  '23505',
  'Disconnect the current partner before creating another invite',
  'an already-connected user cannot create another active-partner invite'
);

select * from extensions.finish();

rollback;
