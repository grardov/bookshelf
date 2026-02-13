create table "public"."releases" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "discogs_release_id" integer not null,
    "discogs_instance_id" integer not null,
    "title" text not null,
    "artist_name" text not null,
    "year" integer,
    "cover_image_url" text,
    "format" text,
    "genres" text[] default '{}'::text[],
    "styles" text[] default '{}'::text[],
    "labels" text[] default '{}'::text[],
    "catalog_number" text,
    "country" text,
    "added_to_discogs_at" timestamp with time zone,
    "synced_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."releases" enable row level security;

CREATE INDEX idx_releases_artist_name ON public.releases USING btree (artist_name);

CREATE INDEX idx_releases_discogs_release_id ON public.releases USING btree (discogs_release_id);

CREATE INDEX idx_releases_title ON public.releases USING btree (title);

CREATE INDEX idx_releases_user_id ON public.releases USING btree (user_id);

CREATE INDEX idx_releases_year ON public.releases USING btree (year);

CREATE UNIQUE INDEX releases_pkey ON public.releases USING btree (id);

CREATE UNIQUE INDEX releases_user_instance_unique ON public.releases USING btree (user_id, discogs_instance_id);

alter table "public"."releases" add constraint "releases_pkey" PRIMARY KEY using index "releases_pkey";

alter table "public"."releases" add constraint "releases_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."releases" validate constraint "releases_user_id_fkey";

alter table "public"."releases" add constraint "releases_user_instance_unique" UNIQUE using index "releases_user_instance_unique";

grant delete on table "public"."releases" to "anon";

grant insert on table "public"."releases" to "anon";

grant references on table "public"."releases" to "anon";

grant select on table "public"."releases" to "anon";

grant trigger on table "public"."releases" to "anon";

grant truncate on table "public"."releases" to "anon";

grant update on table "public"."releases" to "anon";

grant delete on table "public"."releases" to "authenticated";

grant insert on table "public"."releases" to "authenticated";

grant references on table "public"."releases" to "authenticated";

grant select on table "public"."releases" to "authenticated";

grant trigger on table "public"."releases" to "authenticated";

grant truncate on table "public"."releases" to "authenticated";

grant update on table "public"."releases" to "authenticated";

grant delete on table "public"."releases" to "service_role";

grant insert on table "public"."releases" to "service_role";

grant references on table "public"."releases" to "service_role";

grant select on table "public"."releases" to "service_role";

grant trigger on table "public"."releases" to "service_role";

grant truncate on table "public"."releases" to "service_role";

grant update on table "public"."releases" to "service_role";

create policy "Users can delete own releases"
on "public"."releases"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own releases"
on "public"."releases"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own releases"
on "public"."releases"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own releases"
on "public"."releases"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_releases_updated_at BEFORE UPDATE ON public.releases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


