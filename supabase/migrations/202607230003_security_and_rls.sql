-- Security helpers centralise relationship checks. They run as the migration
-- owner so callers cannot exploit RLS recursion, accept only UUIDs, and expose
-- no arbitrary SQL.

create or replace function public.is_active_partner(
  p_owner_id uuid,
  p_viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_owner_id is not null
    and p_viewer_id is not null
    and p_viewer_id = auth.uid()
    and p_owner_id <> p_viewer_id
    and exists (
      select 1
      from public.friend_connections as connection
      where connection.status = 'accepted'
        and connection.disconnected_at is null
        and (
          (connection.requester_id = p_owner_id and connection.addressee_id = p_viewer_id)
          or
          (connection.addressee_id = p_owner_id and connection.requester_id = p_viewer_id)
        )
    );
$$;

create or replace function public.can_view_content(
  p_owner_id uuid,
  p_visibility public.content_visibility,
  p_viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_viewer_id is not null
    and p_viewer_id = auth.uid()
    and (
      p_owner_id = p_viewer_id
      or (
        p_visibility = 'partner'
        and public.is_active_partner(p_owner_id, p_viewer_id)
      )
    );
$$;

create or replace function public.can_view_workout(
  p_workout_id uuid,
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
    from public.workouts as workout
    where workout.id = p_workout_id
      and public.can_view_content(workout.user_id, workout.visibility, p_viewer_id)
  );
$$;

create or replace function public.owns_workout(
  p_workout_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workouts
    where p_user_id = auth.uid()
      and id = p_workout_id
      and user_id = p_user_id
  );
$$;

create or replace function public.owns_workout_exercise(
  p_workout_exercise_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_exercises
    where p_user_id = auth.uid()
      and id = p_workout_exercise_id
      and user_id = p_user_id
  );
$$;

create or replace function public.owns_template(
  p_template_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_templates
    where p_user_id = auth.uid()
      and id = p_template_id
      and user_id = p_user_id
  );
$$;

create or replace function public.owns_template_exercise(
  p_template_exercise_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workout_template_exercises
    where p_user_id = auth.uid()
      and id = p_template_exercise_id
      and user_id = p_user_id
  );
$$;

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
        or public.is_active_partner(skill.owner_id, p_viewer_id)
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
        or public.is_active_partner(exercise.owner_id, p_viewer_id)
      )
  );
$$;

create or replace function public.can_manage_skill(
  p_skill_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.skills
    where p_user_id = auth.uid()
      and id = p_skill_id
      and not is_system
      and owner_id = p_user_id
  );
$$;

create or replace function public.can_log_skill(
  p_skill_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.skills
    where p_user_id = auth.uid()
      and id = p_skill_id
      and (is_system or owner_id = p_user_id)
  );
$$;

create or replace function public.can_view_challenge(
  p_challenge_id uuid,
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
    from public.challenges as challenge
    where p_viewer_id = auth.uid()
      and challenge.id = p_challenge_id
      and public.can_view_content(
        challenge.created_by,
        challenge.visibility,
        p_viewer_id
      )
  );
$$;

create or replace function public.can_join_challenge(
  p_challenge_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.challenges as challenge
    where p_user_id = auth.uid()
      and challenge.id = p_challenge_id
      and challenge.status in ('upcoming', 'active')
      and challenge.ends_on >= current_date
      and public.can_view_content(
        challenge.created_by,
        challenge.visibility,
        p_user_id
      )
  );
$$;

create or replace function public.can_view_activity(
  p_activity_id uuid,
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
    from public.activity_feed as activity
    join public.profiles as profile on profile.id = activity.user_id
    where p_viewer_id = auth.uid()
      and activity.id = p_activity_id
      and (
        activity.user_id = p_viewer_id
        or (
          activity.visibility = 'partner'
          and profile.share_activity
          and public.is_active_partner(activity.user_id, p_viewer_id)
        )
      )
  );
$$;

revoke all on function public.is_active_partner(uuid, uuid) from public;
revoke all on function public.can_view_content(uuid, public.content_visibility, uuid) from public;
revoke all on function public.can_view_workout(uuid, uuid) from public;
revoke all on function public.owns_workout(uuid, uuid) from public;
revoke all on function public.owns_workout_exercise(uuid, uuid) from public;
revoke all on function public.owns_template(uuid, uuid) from public;
revoke all on function public.owns_template_exercise(uuid, uuid) from public;
revoke all on function public.can_view_skill(uuid, uuid) from public;
revoke all on function public.can_view_exercise(uuid, uuid) from public;
revoke all on function public.can_manage_skill(uuid, uuid) from public;
revoke all on function public.can_log_skill(uuid, uuid) from public;
revoke all on function public.can_view_challenge(uuid, uuid) from public;
revoke all on function public.can_join_challenge(uuid, uuid) from public;
revoke all on function public.can_view_activity(uuid, uuid) from public;

grant execute on function public.is_active_partner(uuid, uuid) to authenticated;
grant execute on function public.can_view_content(uuid, public.content_visibility, uuid) to authenticated;
grant execute on function public.can_view_workout(uuid, uuid) to authenticated;
grant execute on function public.owns_workout(uuid, uuid) to authenticated;
grant execute on function public.owns_workout_exercise(uuid, uuid) to authenticated;
grant execute on function public.owns_template(uuid, uuid) to authenticated;
grant execute on function public.owns_template_exercise(uuid, uuid) to authenticated;
grant execute on function public.can_view_skill(uuid, uuid) to authenticated;
grant execute on function public.can_view_exercise(uuid, uuid) to authenticated;
grant execute on function public.can_manage_skill(uuid, uuid) to authenticated;
grant execute on function public.can_log_skill(uuid, uuid) to authenticated;
grant execute on function public.can_view_challenge(uuid, uuid) to authenticated;
grant execute on function public.can_join_challenge(uuid, uuid) to authenticated;
grant execute on function public.can_view_activity(uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.friend_connections enable row level security;
alter table public.friend_invites enable row level security;
alter table public.exercise_library enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.exercise_sets enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.workout_template_sets enable row level security;
alter table public.skills enable row level security;
alter table public.skill_progressions enable row level security;
alter table public.skill_entries enable row level security;
alter table public.body_measurements enable row level security;
alter table public.goals enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.personal_records enable row level security;
alter table public.activity_feed enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_self_or_partner"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_active_partner(id));
create policy "profiles_insert_self"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update_self"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "preferences_select_self"
  on public.user_preferences for select to authenticated
  using (user_id = auth.uid());
create policy "preferences_insert_self"
  on public.user_preferences for insert to authenticated
  with check (user_id = auth.uid());
create policy "preferences_update_self"
  on public.user_preferences for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "connections_select_participants"
  on public.friend_connections for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "invites_select_owner"
  on public.friend_invites for select to authenticated
  using (inviter_id = auth.uid());
create policy "invites_delete_owner"
  on public.friend_invites for delete to authenticated
  using (inviter_id = auth.uid() and claimed_at is null);

create policy "exercise_library_select_visible"
  on public.exercise_library for select to authenticated
  using (
    is_system
    or owner_id = auth.uid()
    or public.is_active_partner(owner_id)
  );
create policy "exercise_library_insert_owner"
  on public.exercise_library for insert to authenticated
  with check (owner_id = auth.uid() and not is_system);
create policy "exercise_library_update_owner"
  on public.exercise_library for update to authenticated
  using (owner_id = auth.uid() and not is_system)
  with check (owner_id = auth.uid() and not is_system);
create policy "exercise_library_delete_owner"
  on public.exercise_library for delete to authenticated
  using (owner_id = auth.uid() and not is_system);

create policy "workouts_select_visible"
  on public.workouts for select to authenticated
  using (public.can_view_content(user_id, visibility));
create policy "workouts_insert_owner"
  on public.workouts for insert to authenticated
  with check (user_id = auth.uid());
create policy "workouts_update_owner"
  on public.workouts for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "workouts_delete_owner"
  on public.workouts for delete to authenticated
  using (user_id = auth.uid());

create policy "workout_exercises_select_via_workout"
  on public.workout_exercises for select to authenticated
  using (public.can_view_workout(workout_id));
create policy "workout_exercises_insert_owner"
  on public.workout_exercises for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.owns_workout(workout_id)
    and (
      exercise_library_id is null
      or public.can_view_exercise(exercise_library_id)
    )
  );
create policy "workout_exercises_update_owner"
  on public.workout_exercises for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_workout(workout_id)
    and (
      exercise_library_id is null
      or public.can_view_exercise(exercise_library_id)
    )
  );
create policy "workout_exercises_delete_owner"
  on public.workout_exercises for delete to authenticated
  using (user_id = auth.uid());

create policy "exercise_sets_select_via_workout"
  on public.exercise_sets for select to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises as workout_exercise
      where workout_exercise.id = exercise_sets.workout_exercise_id
        and public.can_view_workout(workout_exercise.workout_id)
    )
  );
create policy "exercise_sets_insert_owner"
  on public.exercise_sets for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.owns_workout_exercise(workout_exercise_id)
  );
create policy "exercise_sets_update_owner"
  on public.exercise_sets for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_workout_exercise(workout_exercise_id)
  );
create policy "exercise_sets_delete_owner"
  on public.exercise_sets for delete to authenticated
  using (user_id = auth.uid());

create policy "templates_select_owner"
  on public.workout_templates for select to authenticated
  using (user_id = auth.uid());
create policy "templates_insert_owner"
  on public.workout_templates for insert to authenticated
  with check (user_id = auth.uid());
create policy "templates_update_owner"
  on public.workout_templates for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "templates_delete_owner"
  on public.workout_templates for delete to authenticated
  using (user_id = auth.uid());

create policy "template_exercises_select_owner"
  on public.workout_template_exercises for select to authenticated
  using (user_id = auth.uid());
create policy "template_exercises_insert_owner"
  on public.workout_template_exercises for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.owns_template(template_id)
    and (
      exercise_library_id is null
      or public.can_view_exercise(exercise_library_id)
    )
  );
create policy "template_exercises_update_owner"
  on public.workout_template_exercises for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_template(template_id)
    and (
      exercise_library_id is null
      or public.can_view_exercise(exercise_library_id)
    )
  );
create policy "template_exercises_delete_owner"
  on public.workout_template_exercises for delete to authenticated
  using (user_id = auth.uid());

create policy "template_sets_select_owner"
  on public.workout_template_sets for select to authenticated
  using (user_id = auth.uid());
create policy "template_sets_insert_owner"
  on public.workout_template_sets for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.owns_template_exercise(template_exercise_id)
  );
create policy "template_sets_update_owner"
  on public.workout_template_sets for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.owns_template_exercise(template_exercise_id)
  );
create policy "template_sets_delete_owner"
  on public.workout_template_sets for delete to authenticated
  using (user_id = auth.uid());

create policy "skills_select_visible"
  on public.skills for select to authenticated
  using (
    is_system
    or owner_id = auth.uid()
    or public.is_active_partner(owner_id)
  );
create policy "skills_insert_owner"
  on public.skills for insert to authenticated
  with check (owner_id = auth.uid() and not is_system);
create policy "skills_update_owner"
  on public.skills for update to authenticated
  using (owner_id = auth.uid() and not is_system)
  with check (owner_id = auth.uid() and not is_system);
create policy "skills_delete_owner"
  on public.skills for delete to authenticated
  using (owner_id = auth.uid() and not is_system);

create policy "skill_progressions_select_visible"
  on public.skill_progressions for select to authenticated
  using (public.can_view_skill(skill_id));
create policy "skill_progressions_insert_skill_owner"
  on public.skill_progressions for insert to authenticated
  with check (public.can_manage_skill(skill_id));
create policy "skill_progressions_update_skill_owner"
  on public.skill_progressions for update to authenticated
  using (public.can_manage_skill(skill_id))
  with check (public.can_manage_skill(skill_id));
create policy "skill_progressions_delete_skill_owner"
  on public.skill_progressions for delete to authenticated
  using (public.can_manage_skill(skill_id));

create policy "skill_entries_select_visible"
  on public.skill_entries for select to authenticated
  using (public.can_view_content(user_id, visibility));
create policy "skill_entries_insert_owner"
  on public.skill_entries for insert to authenticated
  with check (user_id = auth.uid() and public.can_log_skill(skill_id));
create policy "skill_entries_update_owner"
  on public.skill_entries for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_log_skill(skill_id));
create policy "skill_entries_delete_owner"
  on public.skill_entries for delete to authenticated
  using (user_id = auth.uid());

create policy "measurements_select_owner_or_detailed_partner"
  on public.body_measurements for select to authenticated
  using (
    user_id = auth.uid()
    or (
      visibility = 'partner'
      and public.is_active_partner(user_id)
      and exists (
        select 1
        from public.profiles as owner_profile
        where owner_profile.id = body_measurements.user_id
          and owner_profile.measurement_sharing = 'detailed'
      )
    )
  );
create policy "measurements_insert_owner"
  on public.body_measurements for insert to authenticated
  with check (user_id = auth.uid());
create policy "measurements_update_owner"
  on public.body_measurements for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "measurements_delete_owner"
  on public.body_measurements for delete to authenticated
  using (user_id = auth.uid());

create policy "goals_select_visible"
  on public.goals for select to authenticated
  using (public.can_view_content(user_id, visibility));
create policy "goals_insert_owner"
  on public.goals for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      exercise_library_id is null
      or public.can_view_exercise(exercise_library_id)
    )
    and (skill_id is null or public.can_view_skill(skill_id))
  );
create policy "goals_update_owner"
  on public.goals for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      exercise_library_id is null
      or public.can_view_exercise(exercise_library_id)
    )
    and (skill_id is null or public.can_view_skill(skill_id))
  );
create policy "goals_delete_owner"
  on public.goals for delete to authenticated
  using (user_id = auth.uid());

create policy "challenges_select_visible"
  on public.challenges for select to authenticated
  using (public.can_view_content(created_by, visibility));
create policy "challenges_insert_owner"
  on public.challenges for insert to authenticated
  with check (created_by = auth.uid());
create policy "challenges_update_owner"
  on public.challenges for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
create policy "challenges_delete_owner"
  on public.challenges for delete to authenticated
  using (created_by = auth.uid());

create policy "challenge_members_select_visible"
  on public.challenge_members for select to authenticated
  using (public.can_view_challenge(challenge_id));
create policy "challenge_members_insert_self"
  on public.challenge_members for insert to authenticated
  with check (
    (
      user_id = auth.uid()
      and public.can_join_challenge(challenge_id)
    )
    or (
      user_id <> auth.uid()
      and public.is_active_partner(user_id)
      and exists (
        select 1
        from public.challenges as owned_challenge
        where owned_challenge.id = challenge_members.challenge_id
          and owned_challenge.created_by = auth.uid()
          and owned_challenge.visibility = 'partner'
          and owned_challenge.status in ('upcoming', 'active')
          and owned_challenge.ends_on >= current_date
      )
    )
  );
create policy "challenge_members_update_self"
  on public.challenge_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_view_challenge(challenge_id));
create policy "challenge_members_delete_self"
  on public.challenge_members for delete to authenticated
  using (user_id = auth.uid());

create policy "personal_records_select_visible"
  on public.personal_records for select to authenticated
  using (public.can_view_content(user_id, visibility));
create policy "personal_records_insert_owner"
  on public.personal_records for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      exercise_library_id is null
      or public.can_view_exercise(exercise_library_id)
    )
    and (skill_id is null or public.can_view_skill(skill_id))
    and (workout_id is null or public.owns_workout(workout_id))
  );
create policy "personal_records_update_owner"
  on public.personal_records for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      exercise_library_id is null
      or public.can_view_exercise(exercise_library_id)
    )
    and (skill_id is null or public.can_view_skill(skill_id))
    and (workout_id is null or public.owns_workout(workout_id))
  );
create policy "personal_records_delete_owner"
  on public.personal_records for delete to authenticated
  using (user_id = auth.uid());

create policy "activity_select_visible"
  on public.activity_feed for select to authenticated
  using (
    user_id = auth.uid()
    or (
      visibility = 'partner'
      and public.is_active_partner(user_id)
      and exists (
        select 1
        from public.profiles as owner_profile
        where owner_profile.id = activity_feed.user_id
          and owner_profile.share_activity
      )
    )
  );
create policy "activity_insert_owner"
  on public.activity_feed for insert to authenticated
  with check (user_id = auth.uid());
create policy "activity_update_owner"
  on public.activity_feed for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "activity_delete_owner"
  on public.activity_feed for delete to authenticated
  using (user_id = auth.uid());

create policy "reactions_select_visible_activity"
  on public.reactions for select to authenticated
  using (public.can_view_activity(activity_id));
create policy "reactions_insert_self_on_visible_activity"
  on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and public.can_view_activity(activity_id));
create policy "reactions_update_self"
  on public.reactions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.can_view_activity(activity_id));
create policy "reactions_delete_self"
  on public.reactions for delete to authenticated
  using (user_id = auth.uid());

create policy "notifications_select_recipient"
  on public.notifications for select to authenticated
  using (recipient_user_id = auth.uid());
create policy "notifications_update_recipient"
  on public.notifications for update to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());
create policy "notifications_delete_recipient"
  on public.notifications for delete to authenticated
  using (recipient_user_id = auth.uid());

-- The view is security-invoker, so the skill-entry and skill policies above
-- still apply. A percentage is null unless an ordered ladder has at least one
-- stage; otherwise it is completed stages / total stages.
create view public.skill_progress_summary
with (security_invoker = true)
as
with latest as (
  select distinct on (entry.user_id, entry.skill_id)
    entry.*
  from public.skill_entries as entry
  order by entry.user_id, entry.skill_id, entry.recorded_at desc, entry.created_at desc
)
select
  latest.id as skill_entry_id,
  latest.user_id,
  latest.skill_id,
  skill.name as skill_name,
  skill.category,
  latest.status,
  latest.current_progression_id,
  current_stage.name as current_progression,
  latest.target_progression_id,
  target_stage.name as target_progression,
  latest.best_hold_seconds,
  latest.max_repetitions,
  latest.added_weight,
  latest.confidence_rating,
  latest.technique_rating,
  latest.recorded_at,
  case
    when ladder.total_stages >= 1 and current_stage.stage_order is not null
      then round(
        least(
          100::numeric,
          ladder.completed_stages::numeric / ladder.total_stages::numeric * 100
        ),
        1
      )
    else null
  end as progress_percentage
from latest
join public.skills as skill on skill.id = latest.skill_id
left join public.skill_progressions as current_stage
  on current_stage.id = latest.current_progression_id
left join public.skill_progressions as target_stage
  on target_stage.id = latest.target_progression_id
left join lateral (
  select
    count(*)::integer as total_stages,
    count(*) filter (
      where current_stage.stage_order is not null
        and progression.stage_order <= current_stage.stage_order
    )::integer as completed_stages
  from public.skill_progressions as progression
  where progression.skill_id = latest.skill_id
) as ladder on true;

grant usage on schema public to authenticated;

revoke all on table
  public.profiles,
  public.user_preferences,
  public.friend_connections,
  public.friend_invites,
  public.exercise_library,
  public.workouts,
  public.workout_exercises,
  public.exercise_sets,
  public.workout_templates,
  public.workout_template_exercises,
  public.workout_template_sets,
  public.skills,
  public.skill_progressions,
  public.skill_entries,
  public.body_measurements,
  public.goals,
  public.challenges,
  public.challenge_members,
  public.personal_records,
  public.activity_feed,
  public.reactions,
  public.notifications
from anon, authenticated;

revoke all on table public.skill_progress_summary from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (
  display_name,
  avatar_path,
  bio,
  timezone,
  measurement_sharing,
  progress_photo_visibility,
  share_activity
) on table public.profiles to authenticated;
grant select, insert, update on table public.user_preferences to authenticated;
grant select on table public.friend_connections to authenticated;
grant select, delete on table public.friend_invites to authenticated;
grant select, insert, update, delete on table public.exercise_library to authenticated;
grant select, insert, update, delete on table public.workouts to authenticated;
grant select, insert, update, delete on table public.workout_exercises to authenticated;
grant select, insert, update, delete on table public.exercise_sets to authenticated;
grant select, insert, update, delete on table public.workout_templates to authenticated;
grant select, insert, update, delete on table public.workout_template_exercises to authenticated;
grant select, insert, update, delete on table public.workout_template_sets to authenticated;
grant select, insert, update, delete on table public.skills to authenticated;
grant select, insert, update, delete on table public.skill_progressions to authenticated;
grant select, insert, update, delete on table public.skill_entries to authenticated;
grant select, insert, update, delete on table public.body_measurements to authenticated;
grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.challenges to authenticated;
grant select, insert, update, delete on table public.challenge_members to authenticated;
grant select, insert, update, delete on table public.personal_records to authenticated;
grant select, insert, update, delete on table public.activity_feed to authenticated;
grant select, insert, update, delete on table public.reactions to authenticated;
grant select, update, delete on table public.notifications to authenticated;
grant select on table public.skill_progress_summary to authenticated;
