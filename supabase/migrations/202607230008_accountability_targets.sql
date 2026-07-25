-- User-defined weekly targets make the optional accountability score explicit
-- and reproducible. Only these two non-sensitive preferences are exposed to an
-- accepted partner, through the narrow RPC below.

alter table public.user_preferences
  add column weekly_workout_target smallint not null default 4
    check (weekly_workout_target between 1 and 14),
  add column weekly_skill_practice_target smallint not null default 2
    check (weekly_skill_practice_target between 1 and 14);

create or replace function public.get_accountability_targets()
returns table (
  user_id uuid,
  weekly_workout_target smallint,
  weekly_skill_practice_target smallint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with allowed_users as (
    select auth.uid() as id
    where auth.uid() is not null

    union

    select case
      when connection.requester_id = auth.uid() then connection.addressee_id
      else connection.requester_id
    end
    from public.friend_connections as connection
    where connection.status = 'accepted'
      and auth.uid() in (connection.requester_id, connection.addressee_id)
  )
  select
    allowed.id,
    coalesce(preferences.weekly_workout_target, 4::smallint),
    coalesce(preferences.weekly_skill_practice_target, 2::smallint)
  from allowed_users as allowed
  left join public.user_preferences as preferences
    on preferences.user_id = allowed.id;
$$;

revoke all on function public.get_accountability_targets() from public;
grant execute on function public.get_accountability_targets() to authenticated;
