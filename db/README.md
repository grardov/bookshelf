# Database (Supabase)

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
- [Docker](https://docs.docker.com/get-docker/) (for local development)

## Getting started

Start the local Supabase stack:

```sh
cd db
supabase start
```

This will spin up a local Postgres database, Auth, Storage, and other Supabase services via Docker.

## Migrations

Create a new migration:

```sh
supabase migration new <migration_name>
```

Apply migrations to the local database:

```sh
supabase db reset
```

## Seed data

Edit `supabase/seed.sql` to add seed data. It runs automatically on `supabase db reset`.
