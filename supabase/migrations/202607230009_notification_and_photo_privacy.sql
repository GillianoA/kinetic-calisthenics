-- Keep notification visibility aligned with the underlying activity. This
-- immediately hides stale notification text when content becomes private,
-- activity sharing is disabled, or an accountability connection ends.
drop policy if exists "notifications_select_recipient" on public.notifications;
create policy "notifications_select_visible_recipient"
  on public.notifications for select to authenticated
  using (
    recipient_user_id = auth.uid()
    and (
      activity_id is null
      or public.can_view_activity(activity_id)
    )
  );

drop policy if exists "notifications_update_recipient" on public.notifications;
create policy "notifications_update_visible_recipient"
  on public.notifications for update to authenticated
  using (
    recipient_user_id = auth.uid()
    and (
      activity_id is null
      or public.can_view_activity(activity_id)
    )
  )
  with check (
    recipient_user_id = auth.uid()
    and (
      activity_id is null
      or public.can_view_activity(activity_id)
    )
  );

drop policy if exists "notifications_delete_recipient" on public.notifications;
create policy "notifications_delete_visible_recipient"
  on public.notifications for delete to authenticated
  using (
    recipient_user_id = auth.uid()
    and (
      activity_id is null
      or public.can_view_activity(activity_id)
    )
  );

-- Measurement-detail sharing and progress-photo sharing are independent
-- preferences. Return only explicitly shared media references and their dates;
-- no measurement values are exposed by this function.
create or replace function public.get_partner_measurement_photo_refs(
  p_owner_id uuid
)
returns table (
  measured_at timestamptz,
  photo_path text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  photo_sharing public.content_visibility;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select profile.progress_photo_visibility
  into photo_sharing
  from public.profiles as profile
  where profile.id = p_owner_id;

  if photo_sharing <> 'partner'
    or not public.is_active_partner(p_owner_id, current_user_id)
  then
    raise exception 'Progress photos are not shared with this account'
      using errcode = '42501';
  end if;

  return query
  select
    measurement.measured_at,
    media.path
  from public.body_measurements as measurement
  cross join lateral unnest(measurement.photo_paths) as media(path)
  where measurement.user_id = p_owner_id
    and measurement.visibility = 'partner'
    and split_part(media.path, '/', 1) = p_owner_id::text
    and split_part(media.path, '/', 2) = 'shared'
  order by measurement.measured_at;
end;
$$;

revoke all on function public.get_partner_measurement_photo_refs(uuid)
  from public;
grant execute on function public.get_partner_measurement_photo_refs(uuid)
  to authenticated;
