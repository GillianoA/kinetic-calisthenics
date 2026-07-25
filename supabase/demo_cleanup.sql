-- Safe, explicit demo cleanup.
-- Run with a database-admin connection:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/demo_cleanup.sql
--
-- Only users whose profile is marked `is_demo = true` are selected. Deleting
-- auth.users cascades through profiles and all application-owned demo content.

begin;

create temporary table demo_user_ids (
  id uuid primary key
) on commit drop;

insert into demo_user_ids (id)
select id
from public.profiles
where is_demo;

delete from storage.objects
where public.storage_path_owner(name) in (select id from demo_user_ids);

delete from auth.users
where id in (select id from demo_user_ids);

commit;

