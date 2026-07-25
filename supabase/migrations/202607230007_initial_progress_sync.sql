-- Initialize automatic goals and challenges from qualifying historical data.
-- Source-table triggers in the previous migration keep these values current
-- after creation; these triggers make the initial value correct immediately.

create or replace function public.initialize_automatic_goal_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  derived_value numeric := 0;
  derived_record_type public.record_type;
begin
  if new.tracking_mode <> 'automatic'
    or new.status not in ('active', 'completed')
  then
    return new;
  end if;

  if new.goal_type = 'workout_frequency' then
    select count(*)::numeric
    into derived_value
    from public.workouts as workout
    where workout.user_id = new.user_id
      and workout.status = 'completed'
      and workout.workout_date >= greatest(
        new.start_date,
        date_trunc('week', current_date)::date
      )
      and workout.workout_date < date_trunc('week', current_date)::date + 7;

    new.current_value := derived_value;
    new.status := 'active';
    new.completed_at := null;
    return new;
  elsif new.goal_type = 'workout_count' then
    select count(*)::numeric
    into derived_value
    from public.workouts as workout
    where workout.user_id = new.user_id
      and workout.status = 'completed'
      and workout.workout_date >= new.start_date
      and (
        new.target_date is null
        or workout.workout_date <= new.target_date
      );
  elsif new.goal_type in ('repetitions', 'hold_time', 'added_weight') then
    derived_record_type := case new.goal_type
      when 'repetitions' then 'repetitions'::public.record_type
      when 'hold_time' then 'hold_seconds'::public.record_type
      else 'added_weight'::public.record_type
    end;

    select greatest(
      coalesce(max(source.value), 0),
      coalesce(new.starting_value, 0)
    )
    into derived_value
    from (
      select record.value
      from public.personal_records as record
      where record.user_id = new.user_id
        and record.record_type = derived_record_type
        and (
          (
            new.exercise_library_id is not null
            and record.exercise_library_id = new.exercise_library_id
          )
          or (
            new.skill_id is not null
            and record.skill_id = new.skill_id
          )
        )
        and record.achieved_at::date >= new.start_date
        and (
          new.target_date is null
          or record.achieved_at::date <= new.target_date
        )

      union all

      select case new.goal_type
        when 'repetitions' then entry.max_repetitions::numeric
        when 'hold_time' then entry.best_hold_seconds
        else entry.added_weight
      end as value
      from public.skill_entries as entry
      where new.skill_id is not null
        and entry.user_id = new.user_id
        and entry.skill_id = new.skill_id
        and coalesce(entry.achieved_on, entry.recorded_at::date) >= new.start_date
        and (
          new.target_date is null
          or coalesce(entry.achieved_on, entry.recorded_at::date) <= new.target_date
        )
    ) as source;
  elsif new.goal_type = 'skill' then
    select case when exists (
      select 1
      from public.skill_entries as entry
      where entry.user_id = new.user_id
        and entry.skill_id = new.skill_id
        and entry.status in ('achieved', 'mastered')
        and coalesce(entry.achieved_on, entry.recorded_at::date) >= new.start_date
        and (
          new.target_date is null
          or coalesce(entry.achieved_on, entry.recorded_at::date) <= new.target_date
        )
    ) then greatest(coalesce(new.starting_value, 0), 1)
      else coalesce(new.starting_value, 0)
    end
    into derived_value;
  else
    return new;
  end if;

  new.current_value := coalesce(derived_value, 0);
  if new.current_value >= new.target_value then
    new.status := 'completed';
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.status := 'active';
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger initialize_automatic_goal_progress
  before insert or update of
    tracking_mode,
    goal_type,
    exercise_library_id,
    skill_id,
    starting_value,
    target_value,
    start_date,
    target_date,
    status,
    current_value
  on public.goals
  for each row execute function public.initialize_automatic_goal_progress();

revoke all on function public.initialize_automatic_goal_progress() from public;

-- Keep the source-table refresh path identical to the creation-time
-- calculation above. In particular, a record cannot move an automatic goal
-- below its declared baseline.
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
    select greatest(
      coalesce(max(source.value), 0),
      coalesce(goal_row.starting_value, 0)
    )
    into derived_value
    from (
      select record.value
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
        )

      union all

      select case goal_row.goal_type
        when 'repetitions' then entry.max_repetitions::numeric
        when 'hold_time' then entry.best_hold_seconds
        else entry.added_weight
      end as value
      from public.skill_entries as entry
      where goal_row.skill_id is not null
        and entry.user_id = affected_user_id
        and entry.skill_id = goal_row.skill_id
        and coalesce(entry.achieved_on, entry.recorded_at::date) >= goal_row.start_date
        and (
          goal_row.target_date is null
          or coalesce(entry.achieved_on, entry.recorded_at::date) <= goal_row.target_date
        )
    ) as source;

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

-- Skill-goal refreshes use the achievement date when supplied, fall back to
-- the log date, and recompute both sides when an entry changes skills.
create or replace function public.sync_skill_goal_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_user_id uuid;
  old_skill_id uuid;
  new_skill_id uuid;
  goal_row public.goals%rowtype;
  derived_value numeric;
begin
  affected_user_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
  old_skill_id := case when tg_op in ('DELETE', 'UPDATE') then old.skill_id end;
  new_skill_id := case when tg_op in ('INSERT', 'UPDATE') then new.skill_id end;

  for goal_row in
    select *
    from public.goals
    where user_id = affected_user_id
      and tracking_mode = 'automatic'
      and status in ('active', 'completed')
      and goal_type in ('skill', 'repetitions', 'hold_time', 'added_weight')
      and (skill_id = old_skill_id or skill_id = new_skill_id)
    for update
  loop
    if goal_row.goal_type = 'skill' then
      select case when exists (
        select 1
        from public.skill_entries as entry
        where entry.user_id = affected_user_id
          and entry.skill_id = goal_row.skill_id
          and entry.status in ('achieved', 'mastered')
          and coalesce(entry.achieved_on, entry.recorded_at::date) >= goal_row.start_date
          and (
            goal_row.target_date is null
            or coalesce(entry.achieved_on, entry.recorded_at::date) <= goal_row.target_date
          )
      ) then greatest(coalesce(goal_row.starting_value, 0), 1)
        else coalesce(goal_row.starting_value, 0)
      end
      into derived_value;
    else
      select greatest(
        coalesce(max(source.value), 0),
        coalesce(goal_row.starting_value, 0)
      )
      into derived_value
      from (
        select record.value
        from public.personal_records as record
        where record.user_id = affected_user_id
          and record.skill_id = goal_row.skill_id
          and record.achieved_at::date >= goal_row.start_date
          and (
            goal_row.target_date is null
            or record.achieved_at::date <= goal_row.target_date
          )
          and (
            (goal_row.goal_type = 'repetitions' and record.record_type = 'repetitions')
            or (goal_row.goal_type = 'hold_time' and record.record_type = 'hold_seconds')
            or (goal_row.goal_type = 'added_weight' and record.record_type = 'added_weight')
          )

        union all

        select case goal_row.goal_type
          when 'repetitions' then entry.max_repetitions::numeric
          when 'hold_time' then entry.best_hold_seconds
          else entry.added_weight
        end as value
        from public.skill_entries as entry
        where entry.user_id = affected_user_id
          and entry.skill_id = goal_row.skill_id
          and coalesce(entry.achieved_on, entry.recorded_at::date) >= goal_row.start_date
          and (
            goal_row.target_date is null
            or coalesce(entry.achieved_on, entry.recorded_at::date) <= goal_row.target_date
          )
      ) as source;
    end if;

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

drop trigger sync_skill_goal_progress_update on public.skill_entries;
create trigger sync_skill_goal_progress_update
  after update of
    status,
    skill_id,
    achieved_on,
    recorded_at,
    best_hold_seconds,
    max_repetitions,
    added_weight
  on public.skill_entries
  for each row execute function public.sync_skill_goal_progress();

create or replace function public.emit_goal_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  should_emit boolean := false;
begin
  if tg_op = 'INSERT' then
    should_emit := new.status = 'completed';
  else
    should_emit :=
      new.status = 'completed'
      and old.status is distinct from 'completed';
  end if;

  if should_emit then
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
    )
    on conflict do nothing;
  elsif tg_op = 'UPDATE'
    and old.status = 'completed'
    and new.status <> 'completed'
  then
    delete from public.activity_feed
    where entity_type = 'goal'
      and entity_id = new.id
      and activity_type = 'goal_completed';
  end if;

  return new;
end;
$$;

drop trigger emit_goal_activity on public.goals;
create trigger emit_goal_activity
  after insert or update of status on public.goals
  for each row execute function public.emit_goal_activity();

create or replace function public.initialize_challenge_member_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge_row public.challenges%rowtype;
  completed_count numeric;
begin
  select *
  into challenge_row
  from public.challenges
  where id = new.challenge_id;

  if challenge_row.metric_key <> 'workouts_completed'
    or challenge_row.status not in ('upcoming', 'active')
  then
    return new;
  end if;

  select count(*)::numeric
  into completed_count
  from public.workouts as workout
  where workout.user_id = new.user_id
    and workout.status = 'completed'
    and workout.visibility = 'partner'
    and workout.workout_date between
      challenge_row.starts_on and challenge_row.ends_on;

  new.current_value := completed_count;
  if completed_count >= challenge_row.target_value then
    new.status := 'completed';
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.status := 'joined';
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger initialize_challenge_member_progress
  before insert on public.challenge_members
  for each row execute function public.initialize_challenge_member_progress();

revoke all on function public.initialize_challenge_member_progress() from public;

create or replace function public.sync_challenge_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_count integer;
  all_completed boolean;
  challenge_start date;
begin
  select
    count(*)::integer,
    coalesce(bool_and(member.status = 'completed'), false)
  into member_count, all_completed
  from public.challenge_members as member
  where member.challenge_id = new.challenge_id
    and member.status <> 'left';

  select starts_on
  into challenge_start
  from public.challenges
  where id = new.challenge_id;

  if member_count >= 2 and all_completed then
    update public.challenges
    set status = 'completed'
    where id = new.challenge_id
      and status in ('upcoming', 'active');
  elsif member_count >= 2 then
    update public.challenges
    set status = case
      when challenge_start > current_date then 'upcoming'
      else 'active'
    end
    where id = new.challenge_id
      and status = 'completed';
  end if;

  return new;
end;
$$;

create trigger sync_challenge_completion
  after insert or update of status on public.challenge_members
  for each row execute function public.sync_challenge_completion();

revoke all on function public.sync_challenge_completion() from public;
