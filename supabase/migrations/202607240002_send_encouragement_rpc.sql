-- Encouragement is the only user-authored activity-feed event. Keep its
-- trusted fields and recipient selection inside one narrow RPC instead of
-- relying on a direct Data API insert to satisfy a complex RLS policy.
create or replace function public.send_encouragement(
  p_encouragement text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  partner_id uuid;
  activity_id uuid;
  server_time timestamptz := clock_timestamp();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_encouragement is null
    or p_encouragement not in ('Strong work', 'New record', 'Keep going', 'Respect')
  then
    raise exception 'Unsupported encouragement' using errcode = '22023';
  end if;

  select case
    when connection.requester_id = current_user_id
      then connection.addressee_id
    else connection.requester_id
  end
  into partner_id
  from public.friend_connections as connection
  where connection.status = 'accepted'
    and connection.disconnected_at is null
    and current_user_id in (connection.requester_id, connection.addressee_id)
  limit 1;

  if partner_id is null then
    raise exception 'No connected partner' using errcode = 'P0002';
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
    visibility,
    created_at,
    updated_at
  )
  values (
    current_user_id,
    'encouragement',
    'profile',
    partner_id,
    p_encouragement,
    'A private encouragement from your accountability partner.',
    jsonb_build_object(
      'recipient_id', partner_id,
      'encouragement', p_encouragement
    ),
    server_time,
    'partner',
    server_time,
    server_time
  )
  returning id into activity_id;

  return activity_id;
end;
$$;

revoke all on function public.send_encouragement(text) from public;
grant execute on function public.send_encouragement(text) to authenticated;

-- Derived activity remains trigger-owned. Authenticated callers can create
-- only the bounded encouragement event exposed by the RPC above.
revoke insert on table public.activity_feed from authenticated;
drop policy if exists "activity_insert_encouragement" on public.activity_feed;
