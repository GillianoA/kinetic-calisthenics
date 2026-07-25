-- A connected partner may discover a custom skill or exercise definition only
-- through user content that its owner explicitly shared. System catalog rows
-- and a user's own custom rows remain directly visible.

revoke create on schema public from public, anon, authenticated;

create or replace function public.can_view_skill(
  p_skill_id uuid,
  p_viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.skills as skill
    where p_viewer_id = auth.uid()
      and skill.id = p_skill_id
      and (
        skill.is_system
        or skill.owner_id = p_viewer_id
        or (
          public.is_active_partner(skill.owner_id, p_viewer_id)
          and (
            exists (
              select 1
              from public.skill_entries as entry
              where entry.skill_id = skill.id
                and entry.user_id = skill.owner_id
                and entry.visibility = 'partner'
            )
            or exists (
              select 1
              from public.goals as goal
              where goal.skill_id = skill.id
                and goal.user_id = skill.owner_id
                and goal.visibility = 'partner'
            )
            or exists (
              select 1
              from public.personal_records as record
              where record.skill_id = skill.id
                and record.user_id = skill.owner_id
                and record.visibility = 'partner'
            )
          )
        )
      )
  );
$$;

create or replace function public.can_view_exercise(
  p_exercise_id uuid,
  p_viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.exercise_library as exercise
    where p_viewer_id = auth.uid()
      and exercise.id = p_exercise_id
      and (
        exercise.is_system
        or exercise.owner_id = p_viewer_id
        or (
          public.is_active_partner(exercise.owner_id, p_viewer_id)
          and (
            exists (
              select 1
              from public.workout_exercises as workout_exercise
              join public.workouts as workout
                on workout.id = workout_exercise.workout_id
              where workout_exercise.exercise_library_id = exercise.id
                and workout_exercise.user_id = exercise.owner_id
                and workout.user_id = exercise.owner_id
                and workout.visibility = 'partner'
            )
            or exists (
              select 1
              from public.goals as goal
              where goal.exercise_library_id = exercise.id
                and goal.user_id = exercise.owner_id
                and goal.visibility = 'partner'
            )
            or exists (
              select 1
              from public.personal_records as record
              where record.exercise_library_id = exercise.id
                and record.user_id = exercise.owner_id
                and record.visibility = 'partner'
            )
          )
        )
      )
  );
$$;

drop policy if exists "skills_select_visible" on public.skills;
create policy "skills_select_visible"
  on public.skills for select to authenticated
  using (public.can_view_skill(id));

drop policy if exists "exercise_library_select_visible"
  on public.exercise_library;
create policy "exercise_library_select_visible"
  on public.exercise_library for select to authenticated
  using (public.can_view_exercise(id));

-- Workout, record, skill, goal, and challenge activity is emitted by trusted
-- database triggers. Authenticated clients may create only the four bounded
-- encouragement events supported by the API, preventing forged achievements
-- from being published to a partner's feed.
drop policy if exists "activity_insert_owner" on public.activity_feed;
create policy "activity_insert_encouragement"
  on public.activity_feed for insert to authenticated
  with check (
    user_id = auth.uid()
    and activity_type = 'encouragement'
    and entity_type = 'profile'
    and visibility = 'partner'
    and public.is_active_partner(entity_id)
    and title in ('Strong work', 'New record', 'Keep going', 'Respect')
    and metadata ->> 'recipient_id' = entity_id::text
  );

drop policy if exists "activity_update_owner" on public.activity_feed;
revoke update on table public.activity_feed from authenticated;

-- Only the avatar currently attached to the partner profile is readable.
-- Unreferenced uploads and replaced avatars remain owner-only.
drop policy if exists "avatar_partner_read" on storage.objects;
create policy "avatar_partner_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and public.is_active_partner(public.storage_path_owner(name))
    and exists (
      select 1
      from public.profiles as owner_profile
      where owner_profile.id = public.storage_path_owner(storage.objects.name)
        and owner_profile.avatar_path = storage.objects.name
    )
  );

-- Resolve media references without inheriting the detailed-measurement SELECT
-- policy. Metric sharing and progress-photo sharing are separate user choices;
-- this helper exposes no row values and returns only whether a shared reference
-- exists for the path owned by the connected partner.
create or replace function public.is_partner_visible_media_reference(
  p_object_name text,
  p_owner_id uuid,
  p_viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_viewer_id = auth.uid()
    and public.is_active_partner(p_owner_id, p_viewer_id)
    and (
      exists (
        select 1
        from public.workouts as workout
        where workout.user_id = p_owner_id
          and workout.photo_path = p_object_name
          and workout.visibility = 'partner'
      )
      or exists (
        select 1
        from public.skill_entries as entry
        where entry.user_id = p_owner_id
          and entry.media_path = p_object_name
          and entry.visibility = 'partner'
      )
      or exists (
        select 1
        from public.body_measurements as measurement
        where measurement.user_id = p_owner_id
          and p_object_name = any(measurement.photo_paths)
          and measurement.visibility = 'partner'
      )
    );
$$;

revoke all on function public.is_partner_visible_media_reference(
  text,
  uuid,
  uuid
) from public;
grant execute on function public.is_partner_visible_media_reference(
  text,
  uuid,
  uuid
) to authenticated;

drop policy if exists "progress_media_partner_read" on storage.objects;
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
    and public.is_partner_visible_media_reference(
      name,
      public.storage_path_owner(name)
    )
  );
