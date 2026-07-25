-- Revalidate derived activity against its source record. Synchronization
-- triggers below keep the feed tidy; this function is the privacy boundary if
-- a source row changes or disappears before cleanup completes.
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
          and case activity.entity_type
            when 'workout' then exists (
              select 1
              from public.workouts as workout
              where workout.id = activity.entity_id
                and workout.user_id = activity.user_id
                and workout.status = 'completed'
                and workout.visibility = 'partner'
            )
            when 'personal_record' then exists (
              select 1
              from public.personal_records as record
              where record.id = activity.entity_id
                and record.user_id = activity.user_id
                and record.visibility = 'partner'
            )
            when 'skill_entry' then exists (
              select 1
              from public.skill_entries as entry
              where entry.id = activity.entity_id
                and entry.user_id = activity.user_id
                and entry.visibility = 'partner'
            )
            when 'goal' then exists (
              select 1
              from public.goals as goal
              where goal.id = activity.entity_id
                and goal.user_id = activity.user_id
                and goal.status = 'completed'
                and goal.visibility = 'partner'
            )
            when 'challenge' then exists (
              select 1
              from public.challenges as challenge
              join public.challenge_members as member
                on member.challenge_id = challenge.id
              where challenge.id = activity.entity_id
                and member.user_id = activity.user_id
                and public.can_view_challenge(challenge.id, p_viewer_id)
            )
            when 'profile' then
              activity.activity_type = 'encouragement'
              and activity.entity_id = p_viewer_id
              and activity.metadata ->> 'recipient_id' = p_viewer_id::text
            else false
          end
        )
      )
  );
$$;

revoke all on function public.can_view_activity(uuid, uuid) from public;
grant execute on function public.can_view_activity(uuid, uuid) to authenticated;

drop policy if exists "activity_select_visible" on public.activity_feed;
create policy "activity_select_visible"
  on public.activity_feed for select to authenticated
  using (public.can_view_activity(id));

-- Skill activity mirrors the source row for updates and is removed with it.
create or replace function public.sync_skill_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  skill_name text;
  emitted_type public.activity_type;
begin
  if tg_op = 'DELETE' then
    delete from public.activity_feed
    where entity_type = 'skill_entry'
      and entity_id = old.id;
    return old;
  end if;

  select skill.name
  into skill_name
  from public.skills as skill
  where skill.id = new.skill_id;

  emitted_type := case
    when new.status in ('achieved', 'mastered') then 'skill_achieved'
    else 'skill_progress'
  end;

  update public.activity_feed
  set user_id = new.user_id,
      activity_type = emitted_type,
      title = case
        when emitted_type = 'skill_achieved' then 'Achieved ' || skill_name
        else 'Updated ' || skill_name
      end,
      message = null,
      metadata = jsonb_strip_nulls(jsonb_build_object(
        'skillId', new.skill_id,
        'status', new.status,
        'bestHoldSeconds', new.best_hold_seconds,
        'maxRepetitions', new.max_repetitions,
        'addedWeight', new.added_weight
      )),
      occurred_at = new.recorded_at,
      visibility = new.visibility,
      updated_at = now()
  where entity_type = 'skill_entry'
    and entity_id = new.id;

  if not found then
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
        'maxRepetitions', new.max_repetitions,
        'addedWeight', new.added_weight
      )),
      new.recorded_at,
      new.visibility
    );
  end if;

  return new;
end;
$$;

drop trigger if exists emit_skill_activity on public.skill_entries;
drop trigger if exists sync_skill_activity on public.skill_entries;
create trigger sync_skill_activity
  after insert or update of
    skill_id,
    status,
    best_hold_seconds,
    max_repetitions,
    added_weight,
    recorded_at,
    visibility
  or delete on public.skill_entries
  for each row execute function public.sync_skill_activity();

revoke all on function public.sync_skill_activity() from public;

-- A completed-goal event stays aligned with title, metrics, and visibility,
-- and disappears when the goal is reopened or deleted.
create or replace function public.sync_goal_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.activity_feed
    where entity_type = 'goal'
      and entity_id = old.id
      and activity_type = 'goal_completed';
    return old;
  end if;

  if new.status <> 'completed' then
    delete from public.activity_feed
    where entity_type = 'goal'
      and entity_id = new.id
      and activity_type = 'goal_completed';
    return new;
  end if;

  update public.activity_feed
  set user_id = new.user_id,
      title = 'Completed goal: ' || new.title,
      message = null,
      metadata = jsonb_build_object(
        'goalType', new.goal_type,
        'targetValue', new.target_value,
        'unit', new.unit
      ),
      occurred_at = coalesce(new.completed_at, now()),
      visibility = new.visibility,
      updated_at = now()
  where entity_type = 'goal'
    and entity_id = new.id
    and activity_type = 'goal_completed';

  if not found then
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
  end if;

  return new;
end;
$$;

drop trigger if exists emit_goal_activity on public.goals;
drop trigger if exists sync_goal_activity on public.goals;
create trigger sync_goal_activity
  after insert or update of
    status,
    title,
    goal_type,
    target_value,
    unit,
    completed_at,
    visibility
  or delete on public.goals
  for each row execute function public.sync_goal_activity();

revoke all on function public.sync_goal_activity() from public;

-- Remove obsolete derived rows when upgrading an existing project. Deleting
-- activity also removes its notifications and reactions through foreign keys.
delete from public.activity_feed as activity
where activity.entity_type = 'skill_entry'
  and not exists (
    select 1
    from public.skill_entries as entry
    where entry.id = activity.entity_id
  );

delete from public.activity_feed as activity
where activity.entity_type = 'goal'
  and activity.activity_type = 'goal_completed'
  and not exists (
    select 1
    from public.goals as goal
    where goal.id = activity.entity_id
      and goal.status = 'completed'
  );

-- Direct Data API inserts remain convenient for the application, but every
-- encouragement is reduced to the fixed product vocabulary and server time.
create or replace function public.enforce_encouragement_activity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  server_time timestamptz := clock_timestamp();
begin
  if new.activity_type = 'encouragement' and auth.uid() is not null then
    new.entity_type := 'profile';
    new.message := 'A private encouragement from your accountability partner.';
    new.metadata := jsonb_build_object(
      'recipient_id', new.entity_id,
      'encouragement', new.title
    );
    new.visibility := 'partner';
    new.occurred_at := server_time;
    new.created_at := server_time;
    new.updated_at := server_time;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_encouragement_activity on public.activity_feed;
create trigger enforce_encouragement_activity
  before insert on public.activity_feed
  for each row execute function public.enforce_encouragement_activity();

revoke all on function public.enforce_encouragement_activity() from public;

-- Rows created through the older direct-insert policy already had a bounded
-- title and partner recipient, but their message, metadata, and timestamps
-- were caller-controlled. Normalize that profile channel during upgrade while
-- leaving trusted challenge history intact.
update public.activity_feed
set message = 'A private encouragement from your accountability partner.',
    metadata = jsonb_build_object(
      'recipient_id', entity_id,
      'encouragement', title
    ),
    occurred_at = least(created_at, clock_timestamp()),
    created_at = least(created_at, clock_timestamp()),
    updated_at = clock_timestamp()
where activity_type = 'encouragement'
  and entity_type = 'profile';

drop policy if exists "activity_insert_encouragement" on public.activity_feed;
create policy "activity_insert_encouragement"
  on public.activity_feed for insert to authenticated
  with check (
    user_id = auth.uid()
    and activity_type = 'encouragement'
    and entity_type = 'profile'
    and visibility = 'partner'
    and public.is_active_partner(entity_id)
    and title in ('Strong work', 'New record', 'Keep going', 'Respect')
    and message = 'A private encouragement from your accountability partner.'
    and metadata = jsonb_build_object(
      'recipient_id', entity_id,
      'encouragement', title
    )
    and occurred_at between clock_timestamp() - interval '1 minute'
      and clock_timestamp() + interval '1 minute'
    and created_at between clock_timestamp() - interval '1 minute'
      and clock_timestamp() + interval '1 minute'
  );

-- Recipients may acknowledge notifications but cannot rewrite their trusted
-- actor, activity, type, title, or timestamp.
revoke update on table public.notifications from authenticated;
grant update (read_at) on table public.notifications to authenticated;

-- Weekly frequency is a recurring metric, so expose its current value at read
-- time instead of trusting a value last written before the week rolled over.
create or replace view public.goal_progress_live
with (security_invoker = true)
as
select
  goal.*,
  case
    when goal.tracking_mode = 'automatic'
      and goal.goal_type = 'workout_frequency'
    then (
      select count(*)::numeric
      from public.workouts as workout
      where workout.user_id = goal.user_id
        and workout.status = 'completed'
        and workout.workout_date >= greatest(
          goal.start_date,
          date_trunc('week', current_date)::date
        )
        and workout.workout_date < date_trunc('week', current_date)::date + 7
        and (
          goal.target_date is null
          or workout.workout_date <= goal.target_date
        )
    )
    else goal.current_value
  end as effective_current_value
from public.goals as goal;

revoke all on table public.goal_progress_live from public;
revoke all on table public.goal_progress_live from anon;
grant select on table public.goal_progress_live to authenticated;
