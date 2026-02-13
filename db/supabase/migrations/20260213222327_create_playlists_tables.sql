create table "public"."playlist_tracks" (
    "id" uuid not null default gen_random_uuid(),
    "playlist_id" uuid not null,
    "release_id" uuid not null,
    "discogs_release_id" integer not null,
    "position" text not null,
    "title" text not null,
    "artist" text not null,
    "duration" text,
    "track_order" integer not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."playlist_tracks" enable row level security;

create table "public"."playlists" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "description" text,
    "tags" text[] default '{}'::text[],
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."playlists" enable row level security;

CREATE INDEX idx_playlist_tracks_playlist_id ON public.playlist_tracks USING btree (playlist_id);

CREATE INDEX idx_playlist_tracks_release_id ON public.playlist_tracks USING btree (release_id);

CREATE INDEX idx_playlist_tracks_track_order ON public.playlist_tracks USING btree (playlist_id, track_order);

CREATE INDEX idx_playlists_created_at ON public.playlists USING btree (created_at);

CREATE INDEX idx_playlists_name ON public.playlists USING btree (name);

CREATE INDEX idx_playlists_user_id ON public.playlists USING btree (user_id);

CREATE UNIQUE INDEX playlist_tracks_pkey ON public.playlist_tracks USING btree (id);

CREATE UNIQUE INDEX playlists_pkey ON public.playlists USING btree (id);

alter table "public"."playlist_tracks" add constraint "playlist_tracks_pkey" PRIMARY KEY using index "playlist_tracks_pkey";

alter table "public"."playlists" add constraint "playlists_pkey" PRIMARY KEY using index "playlists_pkey";

alter table "public"."playlist_tracks" add constraint "playlist_tracks_playlist_id_fkey" FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE not valid;

alter table "public"."playlist_tracks" validate constraint "playlist_tracks_playlist_id_fkey";

alter table "public"."playlist_tracks" add constraint "playlist_tracks_release_id_fkey" FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE not valid;

alter table "public"."playlist_tracks" validate constraint "playlist_tracks_release_id_fkey";

alter table "public"."playlists" add constraint "playlists_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."playlists" validate constraint "playlists_user_id_fkey";

grant delete on table "public"."playlist_tracks" to "anon";

grant insert on table "public"."playlist_tracks" to "anon";

grant references on table "public"."playlist_tracks" to "anon";

grant select on table "public"."playlist_tracks" to "anon";

grant trigger on table "public"."playlist_tracks" to "anon";

grant truncate on table "public"."playlist_tracks" to "anon";

grant update on table "public"."playlist_tracks" to "anon";

grant delete on table "public"."playlist_tracks" to "authenticated";

grant insert on table "public"."playlist_tracks" to "authenticated";

grant references on table "public"."playlist_tracks" to "authenticated";

grant select on table "public"."playlist_tracks" to "authenticated";

grant trigger on table "public"."playlist_tracks" to "authenticated";

grant truncate on table "public"."playlist_tracks" to "authenticated";

grant update on table "public"."playlist_tracks" to "authenticated";

grant delete on table "public"."playlist_tracks" to "service_role";

grant insert on table "public"."playlist_tracks" to "service_role";

grant references on table "public"."playlist_tracks" to "service_role";

grant select on table "public"."playlist_tracks" to "service_role";

grant trigger on table "public"."playlist_tracks" to "service_role";

grant truncate on table "public"."playlist_tracks" to "service_role";

grant update on table "public"."playlist_tracks" to "service_role";

grant delete on table "public"."playlists" to "anon";

grant insert on table "public"."playlists" to "anon";

grant references on table "public"."playlists" to "anon";

grant select on table "public"."playlists" to "anon";

grant trigger on table "public"."playlists" to "anon";

grant truncate on table "public"."playlists" to "anon";

grant update on table "public"."playlists" to "anon";

grant delete on table "public"."playlists" to "authenticated";

grant insert on table "public"."playlists" to "authenticated";

grant references on table "public"."playlists" to "authenticated";

grant select on table "public"."playlists" to "authenticated";

grant trigger on table "public"."playlists" to "authenticated";

grant truncate on table "public"."playlists" to "authenticated";

grant update on table "public"."playlists" to "authenticated";

grant delete on table "public"."playlists" to "service_role";

grant insert on table "public"."playlists" to "service_role";

grant references on table "public"."playlists" to "service_role";

grant select on table "public"."playlists" to "service_role";

grant trigger on table "public"."playlists" to "service_role";

grant truncate on table "public"."playlists" to "service_role";

grant update on table "public"."playlists" to "service_role";

create policy "Users can delete playlist tracks for own playlists"
on "public"."playlist_tracks"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid())))));


create policy "Users can insert playlist tracks for own playlists"
on "public"."playlist_tracks"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid())))));


create policy "Users can update playlist tracks for own playlists"
on "public"."playlist_tracks"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid())))));


create policy "Users can view playlist tracks for own playlists"
on "public"."playlist_tracks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = auth.uid())))));


create policy "Users can delete own playlists"
on "public"."playlists"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own playlists"
on "public"."playlists"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own playlists"
on "public"."playlists"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own playlists"
on "public"."playlists"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_playlist_tracks_updated_at BEFORE UPDATE ON public.playlist_tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


