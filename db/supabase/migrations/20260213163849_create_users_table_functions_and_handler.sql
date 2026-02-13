create table "public"."users" (
    "id" uuid not null default auth.uid(),
    "email" text not null,
    "display_name" text,
    "avatar_url" text,
    "discogs_username" text,
    "discogs_access_token" text,
    "discogs_connected_at" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."users" enable row level security;

CREATE INDEX idx_users_discogs_username ON public.users USING btree (discogs_username);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE UNIQUE INDEX users_id_key ON public.users USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."users" add constraint "users_id_key" UNIQUE using index "users_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.users (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "Users can update own profile"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Users can view own profile"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));


CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


