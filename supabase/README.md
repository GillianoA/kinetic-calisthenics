# Supabase database package

This directory is the source of truth for the Kinetic database.
Migrations are deliberately split by responsibility:

1. `202607230001_extensions_and_types.sql` — extensions and stable enums.
2. `202607230002_schema.sql` — relational tables, constraints, and indexes.
3. `202607230003_security_and_rls.sql` — helper functions, RLS, grants, and
   the security-invoker skill summary view.
4. `202607230004_automation_storage_realtime.sql` — auth/activity triggers,
   transactional RPCs, private buckets, Storage RLS, and Realtime publication.
5. `202607230005_catalog.sql` — immutable exercise/skill catalogs and ordered
   progression ladders.
6. `202607230006_catalog_privacy.sql` — schema-creation lockdown, reference-
   scoped partner access to custom catalogs and private media, and hardened
   activity-feed mutation rules.
7. `202607230007_initial_progress_sync.sql` — historical initialization and
   ongoing alignment for automatic goals and `workouts_completed` challenge
   membership, including challenge completion state.
8. `202607230008_accountability_targets.sql` — editable weekly workout and
   skill-practice targets plus a narrow partner-safe score-target RPC.
9. `202607230009_notification_and_photo_privacy.sql` — notification visibility
   tied to source activity plus partner-safe measurement-photo references.
10. `202607230010_activity_and_goal_hardening.sql` — source-validated activity,
    server-controlled encouragements, read-only notification content, and
    live weekly-frequency goal progress.

## Local reset and tests

Install the Supabase CLI and Docker, then run from the repository root:

```sh
supabase start
supabase db reset
supabase test db
```

`db reset` applies every migration and `seed.sql`. Both demo accounts use
`CalisthenicsDemo!26`:

- `ava.martin@demo.calisthenics.local`
- `noah.chen@demo.calisthenics.local`

When run against the local stack, the test suite impersonates authenticated
JWTs and verifies owner writes, partner-only shared reads, private-row denial,
unrelated-account denial, measurement/photo masking, custom-catalog/reference
privacy, source-bound notifications, activity-feed forgery denial,
server-controlled encouragement, and RPC ownership checks.

## Production migration

Link the CLI to the intended project and push migrations. Do **not** run
`seed.sql` unless demo accounts are wanted:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

In Authentication settings:

- Enable email/password and require email verification.
- Set Site URL to `https://calisthenics.gillianoagard.com`.
- Add
  `https://calisthenics.gillianoagard.com/auth/callback`,
  `https://calisthenics.gillianoagard.com/reset-password`, and local
  equivalents to Redirect URLs.
- Configure production SMTP before inviting users.
- Keep secure password changes enabled. Also enable leaked-password protection
  if the selected Supabase plan provides it.

Migrations create both private buckets:

| Bucket | Limit | Allowed MIME types |
| --- | ---: | --- |
| `avatars` | 5 MiB | JPEG, PNG, WebP, AVIF |
| `progress-media` | 50 MiB | JPEG, PNG, WebP, AVIF, MP4, WebM, QuickTime |

Use these object keys:

- avatar: `<user_uuid>/<random_file_name>`
- progress media:
  `<user_uuid>/<private-or-shared>/<entity-or-date>/<random_file_name>`

Storage policies derive ownership from the first segment. A connected partner
can read the avatar currently attached to the owner's profile; there is no
separate avatar-sharing preference. Progress media additionally requires the
owner's `progress_photo_visibility = 'partner'` preference and an exact
reference from a partner-visible workout, skill entry, or measurement. A
`shared` path alone grants no access. MIME allowlists and maximum sizes are
enforced by the buckets.

Realtime is enabled in SQL for workouts, skill entries, personal records,
goals, activity items, reactions, challenge memberships, and notifications.
Clients must subscribe with their normal user session; RLS filters every
change. Never use a secret or legacy service-role administrative key in a
browser.

## Transactional workout JSON

Call:

```sql
select public.save_workout_with_exercises(payload, optional_workout_uuid);
```

The function derives `user_id` from `auth.uid()`. A null UUID creates a
workout; a supplied UUID replaces that owner's child exercise/set graph in one
transaction. Foreign UUIDs are rejected. Sets marked `isPersonalRecord` also
create a linked personal-record row and activity item atomically.

The JSON shape uses camelCase:

```json
{
  "workoutDate": "2026-07-23",
  "startTime": "2026-07-23T07:00:00-04:00",
  "endTime": "2026-07-23T08:00:00-04:00",
  "name": "Pull strength",
  "workoutType": "strength",
  "customWorkoutType": null,
  "status": "completed",
  "notes": "Strict reps.",
  "perceivedDifficulty": 8,
  "energyLevel": 8,
  "location": "Park",
  "photoPath": null,
  "visibility": "partner",
  "exercises": [
    {
      "exerciseLibraryId": "20000000-0000-4000-8000-000000000004",
      "exerciseName": "Pull-Up",
      "category": "pull",
      "position": 0,
      "notes": null,
      "sets": [
        {
          "setNumber": 1,
          "repetitions": 8,
          "holdSeconds": null,
          "addedWeight": 0,
          "assistanceWeight": null,
          "distanceMeters": null,
          "restSeconds": 120,
          "tempo": "21X1",
          "bandLevel": null,
          "notes": null,
          "completed": true,
          "isPersonalRecord": false
        }
      ]
    }
  ]
}
```

Accepted workout types are `strength`, `skill`, `mobility`, `conditioning`,
`recovery`, `mixed`, and `custom`. `customWorkoutType` is required when type is
`custom`.

## Invitations and measurement privacy

- `create_friend_invite(interval)` returns a one-time 144-bit code. Only its
  SHA-256 digest is stored.
- `accept_friend_invite(text)` atomically claims a code and connects the two
  accounts.
- `disconnect_friend(uuid)` disconnects either participant.
- `get_my_partner_id()` returns the current partner UUID.
- `get_partner_measurement_summary(uuid, from, to)` returns only date, weight,
  and body-fat trend columns when the owner chose `summary` or `detailed`.
- `get_partner_measurement_photo_refs(uuid)` returns only dates and exact
  shared photo paths when an accepted partner enabled progress-photo sharing
  and the source measurement is partner-visible. This is independent of
  `measurement_sharing`.

Direct measurement-table access for a partner is possible only at the
`detailed` setting and only for rows marked `partner`.

## Removing demo data

`demo_cleanup.sql` selects only profiles marked `is_demo`, removes their stored
objects, and deletes their Auth users. Foreign-key cascades remove all related
application data:

```sql
select p.id, p.display_name, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.is_demo
order by u.email;
```

Review that result, confirm the connected project, and then run:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/demo_cleanup.sql
```

Never run cleanup on a production database until that preflight result has
been reviewed.
