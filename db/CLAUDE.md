# DB — Supabase (PostgreSQL 17)

Local development stack managed by Supabase CLI. Requires Docker.

## Commands

```sh
supabase start                  # Start local Supabase stack
supabase stop                   # Stop local stack
supabase migration new <name>   # Create a new migration
supabase db reset               # Apply all migrations + seed.sql
supabase status                 # Show local credentials and ports
```

**Default ports:** API=54321, DB=54322, Studio=54323, Inbucket=54324.
Override ports via root `make config-ports` (see root CLAUDE.md).

## Schema

### Tables

**`public.users`** — extends `auth.users` with profile data
- `id` (uuid, PK, FK → auth.users), `email`, `display_name`, `avatar_url`
- Discogs fields: `discogs_username`, `discogs_access_token`, `discogs_access_token_secret`, `discogs_connected_at`
- `created_at`, `updated_at`
- Indexes: `email`, `discogs_username`
- Trigger: `handle_new_user()` auto-creates profile on auth signup
- Trigger: `update_updated_at_column()` auto-updates `updated_at`

**`public.releases`** — user's synced Discogs collection
- `id` (uuid, PK), `user_id` (FK → users ON DELETE CASCADE)
- `discogs_release_id`, `discogs_instance_id`, `title`, `artist_name`, `year`
- `cover_image_url`, `format`, `genres` (array), `styles` (array), `labels` (array)
- `catalog_number`, `country`, `added_to_discogs_at`, `synced_at`
- `discogs_metadata` (jsonb) — enriched metadata from Discogs API
- `created_at`, `updated_at`
- Indexes: `user_id`, `discogs_release_id`, `title`, `artist_name`, `year`
- Unique: `(user_id, discogs_instance_id)`

**`public.playlists`** — user playlists
- `id` (uuid, PK), `user_id` (FK → users ON DELETE CASCADE)
- `name`, `description`, `tags` (array)
- `created_at`, `updated_at`
- Indexes: `user_id`, `name`, `created_at`

**`public.playlist_tracks`** — track snapshots in playlists
- `id` (uuid, PK), `playlist_id` (FK → playlists ON DELETE CASCADE)
- `release_id` (FK → releases ON DELETE CASCADE), `discogs_release_id`
- `position`, `title`, `artist`, `duration`, `cover_image_url`
- `track_order` (integer, for sorting)
- `created_at`, `updated_at`
- Indexes: `playlist_id`, `release_id`, `track_order`

### Relationships

```
auth.users ──1:1──> public.users
public.users ──1:N──> public.releases
public.users ──1:N──> public.playlists
public.playlists ──1:N──> public.playlist_tracks
public.releases ──1:N──> public.playlist_tracks
```

All foreign keys use `ON DELETE CASCADE`.

## Row Level Security (RLS)

All tables have RLS enabled. Policies enforce user-scoped access:

| Table             | SELECT      | INSERT      | UPDATE      | DELETE      |
|-------------------|-------------|-------------|-------------|-------------|
| `users`           | Own row     | (trigger)   | Own row     | —           |
| `releases`        | Own rows    | Own rows    | Own rows    | Own rows    |
| `playlists`       | Own rows    | Own rows    | Own rows    | Own rows    |
| `playlist_tracks` | Own playlists | Own playlists | Own playlists | Own playlists |

## Migrations

Location: `db/supabase/migrations/` (7 migration files).

Migration files are ordered chronologically with timestamps. Each handles a specific schema change.

**Conventions:**
- One concern per migration (create table, add column, fix trigger, etc.)
- Always include RLS policies and grants when creating tables
- Grant to `anon`, `authenticated`, `service_role` as needed
- Include indexes for foreign keys and frequently queried columns

## Seed data

`db/supabase/seed.sql` — currently empty, ready for dev data.
