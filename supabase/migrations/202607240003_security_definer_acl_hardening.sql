-- PostgreSQL's EXECUTE grant to PUBLIC is a global default, while Supabase's
-- explicit anon/authenticated grants are public-schema defaults. Revoke both
-- at their respective scopes so future RPC exposure always requires opt-in.
alter default privileges
  revoke execute on functions from public, anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from anon, authenticated;

-- Reset every SECURITY DEFINER function created by this migration history.
-- This removes both inherited PUBLIC execution and Supabase's explicit anon
-- and authenticated ACL entries before the narrow grants below are restored.
revoke execute on function
  public.is_active_partner(uuid, uuid),
  public.can_view_content(uuid, public.content_visibility, uuid),
  public.can_view_workout(uuid, uuid),
  public.owns_workout(uuid, uuid),
  public.owns_workout_exercise(uuid, uuid),
  public.owns_template(uuid, uuid),
  public.owns_template_exercise(uuid, uuid),
  public.can_view_skill(uuid, uuid),
  public.can_view_exercise(uuid, uuid),
  public.can_manage_skill(uuid, uuid),
  public.can_log_skill(uuid, uuid),
  public.can_view_challenge(uuid, uuid),
  public.can_join_challenge(uuid, uuid),
  public.can_view_activity(uuid, uuid),
  public.handle_new_auth_user(),
  public.enforce_connection_invariants(),
  public.create_friend_invite(interval),
  public.accept_friend_invite(text),
  public.disconnect_friend(uuid),
  public.get_my_partner_id(),
  public.get_partner_measurement_summary(uuid, timestamptz, timestamptz),
  public.save_workout_with_exercises(jsonb, uuid),
  public.emit_workout_activity(),
  public.emit_personal_record_activity(),
  public.remove_personal_record_activity(),
  public.emit_skill_activity(),
  public.emit_goal_activity(),
  public.emit_challenge_join_activity(),
  public.notify_partner_of_activity(),
  public.notify_activity_reaction(),
  public.sync_workout_progress(),
  public.sync_record_goal_progress(),
  public.sync_skill_goal_progress(),
  public.is_partner_visible_media_reference(text, uuid, uuid),
  public.initialize_automatic_goal_progress(),
  public.initialize_challenge_member_progress(),
  public.sync_challenge_completion(),
  public.get_accountability_targets(),
  public.get_partner_measurement_photo_refs(uuid),
  public.sync_skill_activity(),
  public.sync_goal_activity(),
  public.send_encouragement(text)
from public, anon, authenticated;

-- These read-only helpers are invoked directly by authenticated RLS policies.
-- Their bodies bind any viewer/user parameter back to auth.uid(), so exposing
-- EXECUTE to authenticated does not let callers evaluate another identity.
grant execute on function
  public.is_active_partner(uuid, uuid),
  public.can_view_content(uuid, public.content_visibility, uuid),
  public.can_view_workout(uuid, uuid),
  public.owns_workout(uuid, uuid),
  public.owns_workout_exercise(uuid, uuid),
  public.owns_template(uuid, uuid),
  public.owns_template_exercise(uuid, uuid),
  public.can_view_skill(uuid, uuid),
  public.can_view_exercise(uuid, uuid),
  public.can_manage_skill(uuid, uuid),
  public.can_log_skill(uuid, uuid),
  public.can_view_challenge(uuid, uuid),
  public.can_join_challenge(uuid, uuid),
  public.can_view_activity(uuid, uuid),
  public.is_partner_visible_media_reference(text, uuid, uuid)
to authenticated;

-- These are the authenticated application RPC surface. Each function either
-- rejects a missing auth.uid() or scopes all reads/writes to that identity.
grant execute on function
  public.create_friend_invite(interval),
  public.accept_friend_invite(text),
  public.disconnect_friend(uuid),
  public.get_my_partner_id(),
  public.get_partner_measurement_summary(uuid, timestamptz, timestamptz),
  public.save_workout_with_exercises(jsonb, uuid),
  public.get_accountability_targets(),
  public.get_partner_measurement_photo_refs(uuid),
  public.send_encouragement(text)
to authenticated;

-- Trigger/internal functions intentionally receive no client role grant.
-- PostgreSQL triggers continue to invoke them, and SECURITY DEFINER functions
-- retain their owner's implicit execution privilege for nested calls.
