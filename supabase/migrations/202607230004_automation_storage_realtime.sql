-- Triggers, transactional RPCs, activity fan-out, storage security, and
-- Realtime publication configuration.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'user_preferences',
    'friend_connections',
    'exercise_library',
    'workouts',
    'workout_exercises',
    'exercise_sets',
    'workout_templates',
    'workout_template_exercises',
    'workout_template_sets',
    'skills',
    'skill_progressions',
    'skill_entries',
    'body_measurements',
    'goals',
    'challenges',
    'challenge_members',
    'personal_records',
    'activity_feed',
    'reactions'
  ]
  loop
    execute format(
      'create trigger set_%1$I_updated_at before update on public.%1$I
       for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  derived_name text;
begin
  derived_name := left(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Athlete'
    ),
    80
  );

  insert into public.profiles (id, display_name)
  values (new.id, derived_name)
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

revoke all on function public.handle_new_auth_user() from public;

create or replace function public.enforce_connection_invariants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_member uuid;
  second_member uuid;
begin
  if tg_op = 'UPDATE'
    and (
      new.requester_id is distinct from old.requester_id
      or new.addressee_id is distinct from old.addressee_id
    )
  then
    raise exception 'Connection participants cannot be changed'
      using errcode = '22023';
  end if;

  if new.status = 'accepted' then
    first_member := least(new.requester_id, new.addressee_id);
    second_member := greatest(new.requester_id, new.addressee_id);

    perform pg_advisory_xact_lock(
      pg_catalog.hashtextextended(first_member::text, 20260723)
    );
    perform pg_advisory_xact_lock(
      pg_catalog.hashtextextended(second_member::text, 20260723)
    );

    if exists (
      select 1
      from public.friend_connections as existing
      where existing.id <> new.id
        and existing.status = 'accepted'
        and existing.disconnected_at is null
        and (
          existing.requester_id in (new.requester_id, new.addressee_id)
          or existing.addressee_id in (new.requester_id, new.addressee_id)
        )
    ) then
      raise exception 'Each account can have only one active accountability partner'
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_connection_invariants
  before insert or update on public.friend_connections
  for each row execute function public.enforce_connection_invariants();

revoke all on function public.enforce_connection_invariants() from public;

create or replace function public.create_friend_invite(
  p_valid_for interval default interval '7 days'
)
returns table (
  invite_id uuid,
  invite_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  generated_token text;
  inserted_invite public.friend_invites%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_valid_for < interval '15 minutes'
    or p_valid_for > interval '30 days'
  then
    raise exception 'Invite validity must be between 15 minutes and 30 days'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.friend_connections
    where status = 'accepted'
      and disconnected_at is null
      and current_user_id in (requester_id, addressee_id)
  ) then
    raise exception 'Disconnect the current partner before creating another invite'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.friend_invites
    where inviter_id = current_user_id
      and created_at > now() - interval '30 seconds'
  ) then
    raise exception 'Please wait before generating another invitation'
      using errcode = '57014';
  end if;

  update public.friend_invites
  set revoked_at = now()
  where inviter_id = current_user_id
    and claimed_at is null
    and revoked_at is null;

  generated_token := encode(extensions.gen_random_bytes(18), 'hex');

  insert into public.friend_invites (
    inviter_id,
    token_hash,
    token_hint,
    expires_at
  )
  values (
    current_user_id,
    extensions.digest(generated_token, 'sha256'),
    right(generated_token, 4),
    now() + p_valid_for
  )
  returning * into inserted_invite;

  return query
  select
    inserted_invite.id,
    generated_token,
    inserted_invite.expires_at;
end;
$$;

create or replace function public.accept_friend_invite(
  p_invite_token text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  invite_row public.friend_invites%rowtype;
  connection_id uuid;
  normalized_token text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  normalized_token := lower(btrim(coalesce(p_invite_token, '')));
  if normalized_token !~ '^[0-9a-f]{36}$' then
    raise exception 'Invitation code is invalid' using errcode = '22023';
  end if;

  select *
  into invite_row
  from public.friend_invites
  where token_hash = extensions.digest(normalized_token, 'sha256')
  for update;

  if not found
    or invite_row.revoked_at is not null
    or invite_row.claimed_at is not null
    or invite_row.expires_at <= now()
  then
    raise exception 'Invitation code is invalid or expired' using errcode = '22023';
  end if;

  if invite_row.inviter_id = current_user_id then
    raise exception 'You cannot accept your own invitation' using errcode = '22023';
  end if;

  insert into public.friend_connections (
    requester_id,
    addressee_id,
    status,
    accepted_at
  )
  values (
    invite_row.inviter_id,
    current_user_id,
    'accepted',
    now()
  )
  on conflict (member_low, member_high)
  do update set
    status = 'accepted',
    requested_at = now(),
    accepted_at = now(),
    disconnected_at = null,
    updated_at = now()
  returning id into connection_id;

  update public.friend_invites
  set claimed_by = current_user_id,
      claimed_at = now()
  where id = invite_row.id;

  update public.friend_invites
  set revoked_at = now()
  where inviter_id in (invite_row.inviter_id, current_user_id)
    and id <> invite_row.id
    and claimed_at is null
    and revoked_at is null;

  return connection_id;
end;
$$;

create or replace function public.disconnect_friend(
  p_connection_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  affected_count integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  update public.friend_connections
  set status = 'disconnected',
      disconnected_at = now(),
      updated_at = now()
  where id = p_connection_id
    and status = 'accepted'
    and current_user_id in (requester_id, addressee_id);

  get diagnostics affected_count = row_count;

  if affected_count = 0 then
    raise exception 'Active connection not found' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

create or replace function public.get_my_partner_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when connection.requester_id = auth.uid() then connection.addressee_id
    else connection.requester_id
  end
  from public.friend_connections as connection
  where connection.status = 'accepted'
    and connection.disconnected_at is null
    and auth.uid() in (connection.requester_id, connection.addressee_id)
  limit 1;
$$;

create or replace function public.get_partner_measurement_summary(
  p_owner_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  measured_at timestamptz,
  weight_kg numeric,
  body_fat_percentage numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  sharing_level public.measurement_sharing_level;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select profile.measurement_sharing
  into sharing_level
  from public.profiles as profile
  where profile.id = p_owner_id;

  if p_owner_id <> current_user_id
    and (
      sharing_level not in ('summary', 'detailed')
      or not public.is_active_partner(p_owner_id, current_user_id)
    )
  then
    raise exception 'Measurement summary is not shared with this account'
      using errcode = '42501';
  end if;

  return query
  select
    measurement.measured_at,
    measurement.weight_kg,
    measurement.body_fat_percentage
  from public.body_measurements as measurement
  where measurement.user_id = p_owner_id
    and (p_owner_id = current_user_id or measurement.visibility = 'partner')
    and (p_from is null or measurement.measured_at >= p_from)
    and (p_to is null or measurement.measured_at <= p_to)
  order by measurement.measured_at;
end;
$$;

revoke all on function public.create_friend_invite(interval) from public;
revoke all on function public.accept_friend_invite(text) from public;
revoke all on function public.disconnect_friend(uuid) from public;
revoke all on function public.get_my_partner_id() from public;
revoke all on function public.get_partner_measurement_summary(uuid, timestamptz, timestamptz) from public;

grant execute on function public.create_friend_invite(interval) to authenticated;
grant execute on function public.accept_friend_invite(text) to authenticated;
grant execute on function public.disconnect_friend(uuid) to authenticated;
grant execute on function public.get_my_partner_id() to authenticated;
grant execute on function public.get_partner_measurement_summary(uuid, timestamptz, timestamptz) to authenticated;

-- Keep the private encouragement channel supportive without requiring an
-- external rate-limit service. The advisory lock makes the hourly cap safe
-- across concurrent serverless requests and direct Data API calls.
create or replace function public.limit_encouragement_activity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.activity_type = 'encouragement' then
    perform pg_advisory_xact_lock(
      pg_catalog.hashtextextended(new.user_id::text, 20260724)
    );

    if (
      select count(*)
      from public.activity_feed as recent
      where recent.user_id = new.user_id
        and recent.activity_type = 'encouragement'
        and recent.created_at > now() - interval '1 hour'
    ) >= 20 then
      raise exception 'Encouragement limit reached; try again later'
        using errcode = '57014';
    end if;
  end if;

  return new;
end;
$$;

create trigger limit_encouragement_activity
  before insert on public.activity_feed
  for each row execute function public.limit_encouragement_activity();

revoke all on function public.limit_encouragement_activity() from public;

-- Atomic workout create/update. Payload keys intentionally match the TypeScript
-- form contract:
-- workoutDate, startTime, endTime, name, workoutType, customWorkoutType, notes,
-- perceivedDifficulty, energyLevel, location, photoPath, visibility, status,
-- exercises[].exerciseLibraryId/exerciseName/category/position/notes and
-- exercises[].sets[].setNumber/repetitions/holdSeconds/addedWeight/
-- assistanceWeight/distanceMeters/restSeconds/tempo/bandLevel/notes/completed/
-- isPersonalRecord.
create or replace function public.save_workout_with_exercises(
  p_payload jsonb,
  p_workout_uuid uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_workout_id uuid;
  exercise_payload jsonb;
  set_payload jsonb;
  saved_exercise_id uuid;
  saved_set_id uuid;
  exercise_ordinality bigint;
  set_ordinality bigint;
  requested_library_id uuid;
  requested_photo_path text;
  generated_record_type public.record_type;
  generated_record_value numeric;
  generated_record_unit text;
  prior_record_value numeric;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_payload is null
    or jsonb_typeof(p_payload) <> 'object'
    or pg_column_size(p_payload) > 1048576
  then
    raise exception 'Workout payload must be a JSON object no larger than 1 MiB'
      using errcode = '22023';
  end if;

  if nullif(btrim(p_payload ->> 'name'), '') is null then
    raise exception 'Workout name is required' using errcode = '22023';
  end if;

  if p_payload ? 'exercises'
    and jsonb_typeof(p_payload -> 'exercises') <> 'array'
  then
    raise exception 'exercises must be an array' using errcode = '22023';
  end if;

  if coalesce(jsonb_array_length(p_payload -> 'exercises'), 0) > 100 then
    raise exception 'A workout can contain at most 100 exercises'
      using errcode = '22023';
  end if;

  requested_photo_path := nullif(btrim(p_payload ->> 'photoPath'), '');
  if requested_photo_path is not null
    and (
      split_part(requested_photo_path, '/', 1) <> current_user_id::text
      or split_part(requested_photo_path, '/', 2) not in ('private', 'shared')
    )
  then
    raise exception 'photoPath must belong to the authenticated account'
      using errcode = '42501';
  end if;

  if p_workout_uuid is null then
    saved_workout_id := gen_random_uuid();
    insert into public.workouts (
      id,
      user_id,
      workout_date,
      start_time,
      end_time,
      name,
      workout_type,
      custom_workout_type,
      status,
      notes,
      perceived_difficulty,
      energy_level,
      location,
      photo_path,
      visibility
    )
    values (
      saved_workout_id,
      current_user_id,
      coalesce(nullif(p_payload ->> 'workoutDate', '')::date, current_date),
      nullif(p_payload ->> 'startTime', '')::timestamptz,
      nullif(p_payload ->> 'endTime', '')::timestamptz,
      btrim(p_payload ->> 'name'),
      coalesce(
        nullif(p_payload ->> 'workoutType', '')::public.workout_type,
        'strength'
      ),
      nullif(btrim(p_payload ->> 'customWorkoutType'), ''),
      coalesce(
        nullif(p_payload ->> 'status', '')::public.workout_status,
        'completed'
      ),
      nullif(btrim(p_payload ->> 'notes'), ''),
      nullif(p_payload ->> 'perceivedDifficulty', '')::smallint,
      nullif(p_payload ->> 'energyLevel', '')::smallint,
      nullif(btrim(p_payload ->> 'location'), ''),
      requested_photo_path,
      coalesce(
        nullif(p_payload ->> 'visibility', '')::public.content_visibility,
        'partner'
      )
    );
  else
    select workout.id
    into saved_workout_id
    from public.workouts as workout
    where workout.id = p_workout_uuid
      and workout.user_id = current_user_id
    for update;

    if not found then
      raise exception 'Workout does not exist or is owned by another account'
        using errcode = '42501';
    end if;

    update public.workouts
    set workout_date = coalesce(
          nullif(p_payload ->> 'workoutDate', '')::date,
          current_date
        ),
        start_time = nullif(p_payload ->> 'startTime', '')::timestamptz,
        end_time = nullif(p_payload ->> 'endTime', '')::timestamptz,
        name = btrim(p_payload ->> 'name'),
        workout_type = coalesce(
          nullif(p_payload ->> 'workoutType', '')::public.workout_type,
          'strength'
        ),
        custom_workout_type = nullif(
          btrim(p_payload ->> 'customWorkoutType'),
          ''
        ),
        status = coalesce(
          nullif(p_payload ->> 'status', '')::public.workout_status,
          'completed'
        ),
        notes = nullif(btrim(p_payload ->> 'notes'), ''),
        perceived_difficulty =
          nullif(p_payload ->> 'perceivedDifficulty', '')::smallint,
        energy_level = nullif(p_payload ->> 'energyLevel', '')::smallint,
        location = nullif(btrim(p_payload ->> 'location'), ''),
        photo_path = requested_photo_path,
        visibility = coalesce(
          nullif(p_payload ->> 'visibility', '')::public.content_visibility,
          'partner'
        )
    where id = saved_workout_id;

    delete from public.workout_exercises
    where workout_id = saved_workout_id
      and user_id = current_user_id;
  end if;

  for exercise_payload, exercise_ordinality in
    select item.value, item.ordinality
    from jsonb_array_elements(
      coalesce(p_payload -> 'exercises', '[]'::jsonb)
    ) with ordinality as item(value, ordinality)
  loop
    if jsonb_typeof(exercise_payload) <> 'object'
      or nullif(btrim(exercise_payload ->> 'exerciseName'), '') is null
    then
      raise exception 'Every exercise requires an exerciseName'
        using errcode = '22023';
    end if;

    if exercise_payload ? 'sets'
      and jsonb_typeof(exercise_payload -> 'sets') <> 'array'
    then
      raise exception 'Exercise sets must be an array' using errcode = '22023';
    end if;

    if coalesce(jsonb_array_length(exercise_payload -> 'sets'), 0) > 200 then
      raise exception 'An exercise can contain at most 200 sets'
        using errcode = '22023';
    end if;

    requested_library_id :=
      nullif(exercise_payload ->> 'exerciseLibraryId', '')::uuid;

    if requested_library_id is not null
      and not public.can_view_exercise(
        requested_library_id,
        current_user_id
      )
    then
      raise exception 'Exercise library item is not visible to this account'
        using errcode = '42501';
    end if;

    saved_exercise_id := gen_random_uuid();
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
    values (
      saved_exercise_id,
      saved_workout_id,
      current_user_id,
      requested_library_id,
      btrim(exercise_payload ->> 'exerciseName'),
      coalesce(
        nullif(exercise_payload ->> 'category', '')::public.exercise_category,
        'other'
      ),
      coalesce(
        nullif(exercise_payload ->> 'position', '')::smallint,
        (exercise_ordinality - 1)::smallint
      ),
      nullif(btrim(exercise_payload ->> 'notes'), '')
    );

    for set_payload, set_ordinality in
      select item.value, item.ordinality
      from jsonb_array_elements(
        coalesce(exercise_payload -> 'sets', '[]'::jsonb)
      ) with ordinality as item(value, ordinality)
    loop
      if jsonb_typeof(set_payload) <> 'object' then
        raise exception 'Every set must be a JSON object' using errcode = '22023';
      end if;

      insert into public.exercise_sets (
        workout_exercise_id,
        user_id,
        set_number,
        repetitions,
        hold_seconds,
        added_weight,
        assistance_weight,
        distance_meters,
        rest_seconds,
        tempo,
        band_level,
        notes,
        completed,
        is_personal_record
      )
      values (
        saved_exercise_id,
        current_user_id,
        coalesce(
          nullif(set_payload ->> 'setNumber', '')::smallint,
          set_ordinality::smallint
        ),
        nullif(set_payload ->> 'repetitions', '')::integer,
        nullif(set_payload ->> 'holdSeconds', '')::numeric,
        nullif(set_payload ->> 'addedWeight', '')::numeric,
        nullif(set_payload ->> 'assistanceWeight', '')::numeric,
        nullif(set_payload ->> 'distanceMeters', '')::numeric,
        nullif(set_payload ->> 'restSeconds', '')::integer,
        nullif(btrim(set_payload ->> 'tempo'), ''),
        nullif(btrim(set_payload ->> 'bandLevel'), ''),
        nullif(btrim(set_payload ->> 'notes'), ''),
        coalesce((set_payload ->> 'completed')::boolean, true),
        coalesce((set_payload ->> 'isPersonalRecord')::boolean, false)
      )
      returning id into saved_set_id;

      if coalesce((set_payload ->> 'isPersonalRecord')::boolean, false)
        and coalesce((set_payload ->> 'completed')::boolean, true)
      then
        generated_record_type := null;
        generated_record_value := null;
        generated_record_unit := null;

        if nullif(set_payload ->> 'addedWeight', '')::numeric > 0 then
          generated_record_type := 'added_weight';
          generated_record_value :=
            nullif(set_payload ->> 'addedWeight', '')::numeric;
          generated_record_unit := 'kg';
        elsif nullif(set_payload ->> 'repetitions', '')::numeric is not null then
          generated_record_type := 'repetitions';
          generated_record_value :=
            nullif(set_payload ->> 'repetitions', '')::numeric;
          generated_record_unit := 'reps';
        elsif nullif(set_payload ->> 'holdSeconds', '')::numeric is not null then
          generated_record_type := 'hold_seconds';
          generated_record_value :=
            nullif(set_payload ->> 'holdSeconds', '')::numeric;
          generated_record_unit := 'seconds';
        elsif nullif(set_payload ->> 'assistanceWeight', '')::numeric is not null then
          generated_record_type := 'assistance_weight';
          generated_record_value :=
            nullif(set_payload ->> 'assistanceWeight', '')::numeric;
          generated_record_unit := 'kg assistance';
        elsif nullif(set_payload ->> 'distanceMeters', '')::numeric is not null then
          generated_record_type := 'distance';
          generated_record_value :=
            nullif(set_payload ->> 'distanceMeters', '')::numeric;
          generated_record_unit := 'metres';
        end if;

        if generated_record_type is not null then
          if generated_record_type = 'assistance_weight' then
            select min(record.value)
            into prior_record_value
            from public.personal_records as record
            where record.user_id = current_user_id
              and record.record_type = generated_record_type
              and (
                (
                  requested_library_id is not null
                  and record.exercise_library_id = requested_library_id
                )
                or (
                  requested_library_id is null
                  and record.exercise_library_id is null
                  and lower(record.record_name) =
                    lower(btrim(exercise_payload ->> 'exerciseName'))
                )
              );
          else
            select max(record.value)
            into prior_record_value
            from public.personal_records as record
            where record.user_id = current_user_id
              and record.record_type = generated_record_type
              and (
                (
                  requested_library_id is not null
                  and record.exercise_library_id = requested_library_id
                )
                or (
                  requested_library_id is null
                  and record.exercise_library_id is null
                  and lower(record.record_name) =
                    lower(btrim(exercise_payload ->> 'exerciseName'))
                )
              );
          end if;

          insert into public.personal_records (
            user_id,
            exercise_library_id,
            exercise_set_id,
            workout_id,
            record_name,
            record_type,
            value,
            previous_value,
            unit,
            achieved_at,
            visibility
          )
          values (
            current_user_id,
            requested_library_id,
            saved_set_id,
            saved_workout_id,
            btrim(exercise_payload ->> 'exerciseName'),
            generated_record_type,
            generated_record_value,
            prior_record_value,
            generated_record_unit,
            coalesce(
              nullif(p_payload ->> 'endTime', '')::timestamptz,
              nullif(p_payload ->> 'startTime', '')::timestamptz,
              now()
            ),
            coalesce(
              nullif(p_payload ->> 'visibility', '')::public.content_visibility,
              'partner'
            )
          );
        end if;
      end if;
    end loop;
  end loop;

  return saved_workout_id;
end;
$$;

revoke all on function public.save_workout_with_exercises(jsonb, uuid) from public;
grant execute on function public.save_workout_with_exercises(jsonb, uuid) to authenticated;

-- Media paths are private object keys, never arbitrary URLs. The second path
-- segment records per-object privacy and is enforced again by Storage RLS.
create or replace function public.validate_owned_media_paths()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  path_item text;
  owner_id uuid;
  row_visibility public.content_visibility;
begin
  if tg_table_name = 'profiles' then
    owner_id := new.id;
    if new.avatar_path is not null
      and (
        split_part(new.avatar_path, '/', 1) <> owner_id::text
        or split_part(new.avatar_path, '/', 2) = ''
      )
    then
      raise exception 'Avatar path must belong to the profile owner'
        using errcode = '42501';
    end if;
    return new;
  elsif tg_table_name = 'workouts' then
    owner_id := new.user_id;
    path_item := new.photo_path;
    row_visibility := new.visibility;
  elsif tg_table_name = 'skill_entries' then
    owner_id := new.user_id;
    path_item := new.media_path;
    row_visibility := new.visibility;
  elsif tg_table_name = 'body_measurements' then
    owner_id := new.user_id;
    row_visibility := new.visibility;
    foreach path_item in array new.photo_paths
    loop
      if path_item is null
        or btrim(path_item) = ''
        or split_part(path_item, '/', 1) <> owner_id::text
        or split_part(path_item, '/', 2) not in ('private', 'shared')
        or split_part(path_item, '/', 3) = ''
        or (row_visibility = 'private' and split_part(path_item, '/', 2) <> 'private')
      then
        raise exception 'Measurement media path has invalid ownership or visibility'
          using errcode = '42501';
      end if;
    end loop;
    return new;
  end if;

  if path_item is not null
    and (
      split_part(path_item, '/', 1) <> owner_id::text
      or split_part(path_item, '/', 2) not in ('private', 'shared')
      or split_part(path_item, '/', 3) = ''
      or (row_visibility = 'private' and split_part(path_item, '/', 2) <> 'private')
    )
  then
    raise exception 'Media path has invalid ownership or visibility'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger validate_profile_avatar_path
  before insert or update of avatar_path on public.profiles
  for each row execute function public.validate_owned_media_paths();
create trigger validate_workout_photo_path
  before insert or update of photo_path, visibility on public.workouts
  for each row execute function public.validate_owned_media_paths();
create trigger validate_skill_media_path
  before insert or update of media_path, visibility on public.skill_entries
  for each row execute function public.validate_owned_media_paths();
create trigger validate_measurement_media_paths
  before insert or update of photo_paths, visibility on public.body_measurements
  for each row execute function public.validate_owned_media_paths();

create or replace function public.emit_workout_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.activity_feed
    where entity_type = 'workout'
      and entity_id = old.id;
    return old;
  end if;

  if new.status = 'completed' then
    if tg_op = 'UPDATE' and old.status = 'completed' then
      update public.activity_feed
      set title = 'Completed ' || new.name,
          message = case
            when new.perceived_difficulty is null then null
            else 'Difficulty ' || new.perceived_difficulty::text || '/10'
          end,
          metadata = jsonb_build_object(
            'workoutType', new.workout_type,
            'workoutDate', new.workout_date
          ),
          occurred_at = coalesce(new.end_time, new.start_time, new.created_at),
          visibility = new.visibility
      where entity_type = 'workout'
        and entity_id = new.id;

      if found then
        return new;
      end if;
    end if;

    insert into public.activity_feed (
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
    values (
      new.user_id,
      'workout_completed',
      'workout',
      new.id,
      'Completed ' || new.name,
      case
        when new.perceived_difficulty is null then null
        else 'Difficulty ' || new.perceived_difficulty::text || '/10'
      end,
      jsonb_build_object(
        'workoutType', new.workout_type,
        'workoutDate', new.workout_date
      ),
      coalesce(new.end_time, new.start_time, new.created_at),
      new.visibility
    );
  elsif tg_op = 'UPDATE' and old.status = 'completed' then
    delete from public.activity_feed
    where entity_type = 'workout'
      and entity_id = new.id;
  end if;
  return new;
end;
$$;

create trigger emit_workout_activity
  after insert or update or delete on public.workouts
  for each row execute function public.emit_workout_activity();

create or replace function public.emit_personal_record_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    update public.activity_feed
    set title = 'New record: ' || new.record_name,
        message = new.value::text || ' ' || new.unit,
        metadata = jsonb_build_object(
          'recordType', new.record_type,
          'value', new.value,
          'unit', new.unit
        ),
        occurred_at = new.achieved_at,
        visibility = new.visibility
    where entity_type = 'personal_record'
      and entity_id = new.id;

    if found then
      return new;
    end if;
  end if;

  insert into public.activity_feed (
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
  values (
    new.user_id,
    'personal_record',
    'personal_record',
    new.id,
    'New record: ' || new.record_name,
    new.value::text || ' ' || new.unit,
    jsonb_build_object(
      'recordType', new.record_type,
      'value', new.value,
      'unit', new.unit
    ),
    new.achieved_at,
    new.visibility
  );
  return new;
end;
$$;

create trigger emit_personal_record_activity
  after insert or update on public.personal_records
  for each row execute function public.emit_personal_record_activity();

create or replace function public.remove_personal_record_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activity_feed
  where entity_type = 'personal_record'
    and entity_id = old.id;
  return old;
end;
$$;

create trigger remove_personal_record_activity
  after delete on public.personal_records
  for each row execute function public.remove_personal_record_activity();

create or replace function public.emit_skill_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  skill_name text;
  emitted_type public.activity_type;
begin
  select name into skill_name from public.skills where id = new.skill_id;
  emitted_type := case
    when new.status in ('achieved', 'mastered') then 'skill_achieved'
    else 'skill_progress'
  end;

  insert into public.activity_feed (
    user_id,
    activity_type,
    entity_type,
    entity_id,
    title,
    metadata,
    occurred_at,
    visibility
  )
  values (
    new.user_id,
    emitted_type,
    'skill_entry',
    new.id,
    case
      when emitted_type = 'skill_achieved' then 'Achieved ' || skill_name
      else 'Updated ' || skill_name
    end,
    jsonb_strip_nulls(jsonb_build_object(
      'skillId', new.skill_id,
      'status', new.status,
      'bestHoldSeconds', new.best_hold_seconds,
      'maxRepetitions', new.max_repetitions
    )),
    new.recorded_at,
    new.visibility
  );
  return new;
end;
$$;

create trigger emit_skill_activity
  after insert on public.skill_entries
  for each row execute function public.emit_skill_activity();

create or replace function public.emit_goal_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed'
    and old.status is distinct from 'completed'
  then
    insert into public.activity_feed (
      user_id,
      activity_type,
      entity_type,
      entity_id,
      title,
      metadata,
      occurred_at,
      visibility
    )
    values (
      new.user_id,
      'goal_completed',
      'goal',
      new.id,
      'Completed goal: ' || new.title,
      jsonb_build_object(
        'goalType', new.goal_type,
        'targetValue', new.target_value,
        'unit', new.unit
      ),
      coalesce(new.completed_at, now()),
      new.visibility
    );
  elsif old.status = 'completed' and new.status <> 'completed' then
    delete from public.activity_feed
    where entity_type = 'goal'
      and entity_id = new.id
      and activity_type = 'goal_completed';
  end if;
  return new;
end;
$$;

create trigger emit_goal_activity
  after update of status on public.goals
  for each row execute function public.emit_goal_activity();

create or replace function public.emit_challenge_join_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge_row public.challenges%rowtype;
begin
  select * into challenge_row
  from public.challenges
  where id = new.challenge_id;

  insert into public.activity_feed (
    user_id,
    activity_type,
    entity_type,
    entity_id,
    title,
    metadata,
    occurred_at,
    visibility
  )
  values (
    new.user_id,
    'challenge_joined',
    'challenge',
    new.challenge_id,
    'Joined ' || challenge_row.title,
    jsonb_build_object(
      'challengeType', challenge_row.challenge_type,
      'targetValue', challenge_row.target_value,
      'unit', challenge_row.unit
    ),
    new.joined_at,
    challenge_row.visibility
  );
  return new;
end;
$$;

create trigger emit_challenge_join_activity
  after insert on public.challenge_members
  for each row execute function public.emit_challenge_join_activity();

create or replace function public.notify_partner_of_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  partner_id uuid;
  owner_shares boolean;
begin
  if new.visibility <> 'partner' then
    return new;
  end if;

  select profile.share_activity
  into owner_shares
  from public.profiles as profile
  where profile.id = new.user_id;

  if not coalesce(owner_shares, false) then
    return new;
  end if;

  select case
    when connection.requester_id = new.user_id then connection.addressee_id
    else connection.requester_id
  end
  into partner_id
  from public.friend_connections as connection
  where connection.status = 'accepted'
    and connection.disconnected_at is null
    and new.user_id in (connection.requester_id, connection.addressee_id)
  limit 1;

  if partner_id is not null then
    insert into public.notifications (
      recipient_user_id,
      actor_user_id,
      activity_id,
      notification_type,
      title
    )
    values (
      partner_id,
      new.user_id,
      new.id,
      new.activity_type::text,
      new.title
    )
    on conflict (
      recipient_user_id,
      actor_user_id,
      activity_id,
      notification_type
    )
    where actor_user_id is not null and activity_id is not null
    do update set
      title = excluded.title,
      read_at = null,
      created_at = now();
  end if;

  return new;
end;
$$;

create trigger notify_partner_of_activity
  after insert on public.activity_feed
  for each row execute function public.notify_partner_of_activity();

create or replace function public.notify_activity_reaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_owner uuid;
begin
  select activity.user_id
  into activity_owner
  from public.activity_feed as activity
  where activity.id = new.activity_id;

  if activity_owner is not null and activity_owner <> new.user_id then
    insert into public.notifications (
      recipient_user_id,
      actor_user_id,
      activity_id,
      notification_type,
      title
    )
    values (
      activity_owner,
      new.user_id,
      new.activity_id,
      'reaction',
      'Your partner sent ' || replace(new.reaction::text, '_', ' ')
    )
    on conflict (
      recipient_user_id,
      actor_user_id,
      activity_id,
      notification_type
    )
    where actor_user_id is not null and activity_id is not null
    do update set
      title = excluded.title,
      read_at = null,
      created_at = now();
  end if;

  return new;
end;
$$;

create trigger notify_activity_reaction
  after insert or update of reaction on public.reactions
  for each row execute function public.notify_activity_reaction();

create or replace function public.normalize_goal_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed' then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger normalize_goal_completion
  before insert or update of status on public.goals
  for each row execute function public.normalize_goal_completion();

-- Automatic goals deliberately use transparent source metrics. Recurring
-- workout-frequency goals report the current ISO-week count but do not
-- auto-complete; finite workout-count and record/skill goals complete when
-- their target is reached.
create or replace function public.sync_workout_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_user_id uuid;
  goal_row public.goals%rowtype;
  completed_count numeric;
  challenge_row record;
begin
  if tg_op = 'DELETE' then
    if old.status <> 'completed' then
      return old;
    end if;
    affected_user_id := old.user_id;
  elsif tg_op = 'UPDATE' then
    if new.status <> 'completed' and old.status <> 'completed' then
      return new;
    end if;
    affected_user_id := new.user_id;
  else
    if new.status <> 'completed' then
      return new;
    end if;
    affected_user_id := new.user_id;
  end if;

  for goal_row in
    select *
    from public.goals
    where user_id = affected_user_id
      and tracking_mode = 'automatic'
      and status in ('active', 'completed')
      and goal_type in ('workout_count', 'workout_frequency')
    for update
  loop
    if goal_row.goal_type = 'workout_frequency' then
      select count(*)::numeric
      into completed_count
      from public.workouts
      where user_id = affected_user_id
        and status = 'completed'
        and workout_date >= greatest(
          goal_row.start_date,
          date_trunc('week', current_date)::date
        )
        and workout_date < date_trunc('week', current_date)::date + 7;

      update public.goals
      set current_value = completed_count
      where id = goal_row.id;
    else
      select count(*)::numeric
      into completed_count
      from public.workouts
      where user_id = affected_user_id
        and status = 'completed'
        and workout_date >= goal_row.start_date
        and (goal_row.target_date is null or workout_date <= goal_row.target_date);

      update public.goals
      set current_value = completed_count,
          status = case
            when completed_count >= target_value then 'completed'
            else 'active'
          end,
          completed_at = case
            when completed_count >= target_value then coalesce(completed_at, now())
            else null
          end
      where id = goal_row.id;
    end if;
  end loop;

  for challenge_row in
    select
      challenge.id,
      challenge.starts_on,
      challenge.ends_on,
      challenge.target_value
    from public.challenges as challenge
    join public.challenge_members as member
      on member.challenge_id = challenge.id
    where member.user_id = affected_user_id
      and member.status in ('joined', 'completed')
      and challenge.status in ('upcoming', 'active', 'completed')
      and current_date between challenge.starts_on and challenge.ends_on
      and challenge.metric_key = 'workouts_completed'
  loop
    update public.challenges
    set status = 'active'
    where id = challenge_row.id
      and status = 'upcoming';

    select count(*)::numeric
    into completed_count
    from public.workouts
    where user_id = affected_user_id
      and status = 'completed'
      and visibility = 'partner'
      and workout_date between challenge_row.starts_on and challenge_row.ends_on;

    update public.challenge_members
    set current_value = completed_count,
        status = case
          when completed_count >= challenge_row.target_value then 'completed'
          else 'joined'
        end,
        completed_at = case
          when completed_count >= challenge_row.target_value
            then coalesce(completed_at, now())
          else null
        end
    where challenge_id = challenge_row.id
      and user_id = affected_user_id;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger sync_workout_progress_insert_delete
  after insert or delete on public.workouts
  for each row execute function public.sync_workout_progress();

create trigger sync_workout_progress_update
  after update of status, workout_date, visibility on public.workouts
  for each row execute function public.sync_workout_progress();

create or replace function public.sync_record_goal_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_user_id uuid;
  goal_row public.goals%rowtype;
  derived_value numeric;
begin
  affected_user_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end;

  for goal_row in
    select *
    from public.goals
    where user_id = affected_user_id
      and tracking_mode = 'automatic'
      and status in ('active', 'completed')
      and goal_type in ('repetitions', 'hold_time', 'added_weight')
    for update
  loop
    select max(record.value)
    into derived_value
    from public.personal_records as record
    where record.user_id = affected_user_id
      and (
        (
          goal_row.exercise_library_id is not null
          and record.exercise_library_id = goal_row.exercise_library_id
        )
        or (
          goal_row.skill_id is not null
          and record.skill_id = goal_row.skill_id
        )
      )
      and record.achieved_at::date >= goal_row.start_date
      and (
        goal_row.target_date is null
        or record.achieved_at::date <= goal_row.target_date
      )
      and (
        (goal_row.goal_type = 'repetitions' and record.record_type = 'repetitions')
        or (goal_row.goal_type = 'hold_time' and record.record_type = 'hold_seconds')
        or (goal_row.goal_type = 'added_weight' and record.record_type = 'added_weight')
      );

    derived_value := coalesce(derived_value, goal_row.starting_value, 0);

    update public.goals
    set current_value = derived_value,
        status = case
          when derived_value >= target_value then 'completed'
          else 'active'
        end,
        completed_at = case
          when derived_value >= target_value then coalesce(completed_at, now())
          else null
        end
    where id = goal_row.id;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger sync_record_goal_progress_insert_delete
  after insert or delete on public.personal_records
  for each row execute function public.sync_record_goal_progress();

create trigger sync_record_goal_progress_update
  after update of value, record_type, exercise_library_id, skill_id, achieved_at
  on public.personal_records
  for each row execute function public.sync_record_goal_progress();

create or replace function public.sync_skill_goal_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_user_id uuid;
  affected_skill_id uuid;
  is_achieved boolean;
begin
  if tg_op = 'DELETE' then
    affected_user_id := old.user_id;
    affected_skill_id := old.skill_id;
  else
    affected_user_id := new.user_id;
    affected_skill_id := new.skill_id;
  end if;

  select exists (
    select 1
    from public.skill_entries
    where user_id = affected_user_id
      and skill_id = affected_skill_id
      and status in ('achieved', 'mastered')
  )
  into is_achieved;

  update public.goals as goal
  set current_value = case
        when is_achieved then greatest(coalesce(goal.starting_value, 0), 1)
        else coalesce(goal.starting_value, 0)
      end,
      status = case
        when is_achieved and goal.target_value <= 1 then 'completed'
        else 'active'
      end,
      completed_at = case
        when is_achieved and goal.target_value <= 1
          then coalesce(goal.completed_at, now())
        else null
      end
  where goal.user_id = affected_user_id
    and goal.skill_id = affected_skill_id
    and goal.goal_type = 'skill'
    and goal.tracking_mode = 'automatic'
    and goal.status in ('active', 'completed');

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger sync_skill_goal_progress_insert_delete
  after insert or delete on public.skill_entries
  for each row execute function public.sync_skill_goal_progress();

create trigger sync_skill_goal_progress_update
  after update of status, skill_id on public.skill_entries
  for each row execute function public.sync_skill_goal_progress();

-- Private buckets. Object keys are:
--   avatars:        <user_uuid>/<file>
--   progress-media: <user_uuid>/<private|shared>/<group>/<file>
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'avatars',
    'avatars',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'progress-media',
    'progress-media',
    false,
    52428800,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]
  )
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_path_owner(p_object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_object_name, '/', 1)
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_object_name, '/', 1)::uuid
    else null
  end;
$$;

revoke all on function public.storage_path_owner(text) from public;
grant execute on function public.storage_path_owner(text) to authenticated;

create policy "avatar_owner_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and public.storage_path_owner(name) = auth.uid()
  );
create policy "avatar_partner_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and public.is_active_partner(public.storage_path_owner(name))
  );
create policy "avatar_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and public.storage_path_owner(name) = auth.uid()
  );
create policy "avatar_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and public.storage_path_owner(name) = auth.uid()
  )
  with check (
    bucket_id = 'avatars'
    and public.storage_path_owner(name) = auth.uid()
  );
create policy "avatar_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and public.storage_path_owner(name) = auth.uid()
  );

create policy "progress_media_owner_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'progress-media'
    and public.storage_path_owner(name) = auth.uid()
  );
create policy "progress_media_partner_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'progress-media'
    and split_part(name, '/', 2) = 'shared'
    and public.is_active_partner(public.storage_path_owner(name))
    and exists (
      select 1
      from public.profiles as owner_profile
      where owner_profile.id = public.storage_path_owner(storage.objects.name)
        and owner_profile.progress_photo_visibility = 'partner'
    )
    and (
      exists (
        select 1
        from public.workouts as shared_workout
        where shared_workout.photo_path = storage.objects.name
          and shared_workout.visibility = 'partner'
      )
      or exists (
        select 1
        from public.skill_entries as shared_skill
        where shared_skill.media_path = storage.objects.name
          and shared_skill.visibility = 'partner'
      )
      or exists (
        select 1
        from public.body_measurements as shared_measurement
        where storage.objects.name = any(shared_measurement.photo_paths)
          and shared_measurement.visibility = 'partner'
      )
    )
  );
create policy "progress_media_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'progress-media'
    and public.storage_path_owner(name) = auth.uid()
    and split_part(name, '/', 2) in ('private', 'shared')
  );
create policy "progress_media_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'progress-media'
    and public.storage_path_owner(name) = auth.uid()
  )
  with check (
    bucket_id = 'progress-media'
    and public.storage_path_owner(name) = auth.uid()
    and split_part(name, '/', 2) in ('private', 'shared')
  );
create policy "progress_media_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'progress-media'
    and public.storage_path_owner(name) = auth.uid()
  );

-- Realtime honours the SELECT policies above. FULL replica identity allows
-- useful update/delete payloads; never subscribe with a service-role key.
alter table public.workouts replica identity full;
alter table public.skill_entries replica identity full;
alter table public.personal_records replica identity full;
alter table public.goals replica identity full;
alter table public.activity_feed replica identity full;
alter table public.reactions replica identity full;
alter table public.challenge_members replica identity full;
alter table public.notifications replica identity full;

do $$
declare
  table_name text;
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    foreach table_name in array array[
      'workouts',
      'skill_entries',
      'personal_records',
      'goals',
      'activity_feed',
      'reactions',
      'challenge_members',
      'notifications'
    ]
    loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format(
          'alter publication supabase_realtime add table public.%I',
          table_name
        );
      end if;
    end loop;
  end if;
end;
$$;
