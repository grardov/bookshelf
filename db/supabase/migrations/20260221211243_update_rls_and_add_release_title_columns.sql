BEGIN;

drop policy "Users can delete playlist tracks for own playlists" on "public"."playlist_tracks";

drop policy "Users can insert playlist tracks for own playlists" on "public"."playlist_tracks";

drop policy "Users can update playlist tracks for own playlists" on "public"."playlist_tracks";

drop policy "Users can view playlist tracks for own playlists" on "public"."playlist_tracks";

drop policy "Users can delete own playlists" on "public"."playlists";

drop policy "Users can insert own playlists" on "public"."playlists";

drop policy "Users can update own playlists" on "public"."playlists";

drop policy "Users can view own playlists" on "public"."playlists";

drop policy "Users can delete own releases" on "public"."releases";

drop policy "Users can insert own releases" on "public"."releases";

drop policy "Users can update own releases" on "public"."releases";

drop policy "Users can view own releases" on "public"."releases";

drop policy "Users can update own profile" on "public"."users";

drop policy "Users can view own profile" on "public"."users";

alter table "public"."playlist_tracks" add column "release_title" text;

create policy "Users can delete playlist tracks for own playlists"
on "public"."playlist_tracks"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can insert playlist tracks for own playlists"
on "public"."playlist_tracks"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can update playlist tracks for own playlists"
on "public"."playlist_tracks"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = ( SELECT auth.uid() AS uid))))))
with check ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can view playlist tracks for own playlists"
on "public"."playlist_tracks"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM playlists
  WHERE ((playlists.id = playlist_tracks.playlist_id) AND (playlists.user_id = ( SELECT auth.uid() AS uid))))));


create policy "Users can delete own playlists"
on "public"."playlists"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert own playlists"
on "public"."playlists"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update own playlists"
on "public"."playlists"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view own playlists"
on "public"."playlists"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can delete own releases"
on "public"."releases"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert own releases"
on "public"."releases"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update own releases"
on "public"."releases"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view own releases"
on "public"."releases"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update own profile"
on "public"."users"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Users can view own profile"
on "public"."users"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = id));

COMMIT;



