-- =====================================================================
-- MHPick — Activation de Row Level Security
--
-- A EXECUTER dans l'editeur SQL de Supabase (role service_role).
-- Ne peut pas etre applique avec la cle anon : c'est justement l'objet
-- de ce script que de retirer ses privileges.
--
-- CONTEXTE : les tables publiques etaient accessibles en lecture ET en
-- ecriture avec la seule cle anon, laquelle est publique par conception
-- (elle est livree dans le bundle JavaScript de l'application). Les
-- gardes PrivateRoute / AdminRoute et les verifications is_admin /
-- is_active du code React ne protegent rien : ils ne s'executent que
-- dans le navigateur, et l'API REST est joignable directement.
--
-- A LIRE AVANT D'EXECUTER :
--   - Ce script est enveloppe dans une transaction : en cas d'erreur,
--     rien n'est applique.
--   - Il n'a pas pu etre teste. Testez-le sur une branche Supabase ou
--     un projet de recette avant la production.
--   - La section ROLLBACK en fin de fichier annule tout.
--   - Les 14 comptes ayant is_active = false perdront tout acces aux
--     donnees, et non plus seulement l'acces a l'interface. C'est
--     l'effet recherche.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Fonctions d'aide
--
-- SECURITY DEFINER est indispensable : une politique sur "profiles" qui
-- lirait "profiles" directement declencherait une recursion infinie.
-- search_path est fige pour empecher le detournement par une table
-- homonyme placee dans un schema anterieur.
-- ---------------------------------------------------------------------

create or replace function public.current_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$fn$;

create or replace function public.current_is_active()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $fn$
  select coalesce(
    (select p.is_active from public.profiles p where p.id = auth.uid()),
    false
  );
$fn$;

revoke all on function public.current_is_admin() from public, anon;
revoke all on function public.current_is_active() from public, anon;
grant execute on function public.current_is_admin() to authenticated;
grant execute on function public.current_is_active() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Garde-fou contre l'escalade de privileges
--
-- Une politique RLS s'applique a la ligne entiere, pas colonne par
-- colonne : sans ce declencheur, un utilisateur autorise a modifier son
-- propre profil pourrait y passer is_admin = true.
-- ---------------------------------------------------------------------

create or replace function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  -- Un administrateur a le droit de tout changer.
  if public.current_is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.is_admin is distinct from old.is_admin
     or new.is_active is distinct from old.is_active then
    raise exception
      'Modification non autorisee des colonnes privilegiees (id, is_admin, is_active)';
  end if;

  return new;
end;
$fn$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.profiles_guard_privileged_columns();

-- ---------------------------------------------------------------------
-- 3. profiles — annuaire interne
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;

revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select, update on public.profiles to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (public.current_is_active());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() and public.current_is_active())
  with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

-- ---------------------------------------------------------------------
-- 4. resources — bureaux, salles, places de parking
--    Lecture pour tout compte actif, ecriture reservee aux admins.
-- ---------------------------------------------------------------------

alter table public.resources enable row level security;

revoke all on public.resources from anon;
revoke all on public.resources from authenticated;
grant select, insert, update, delete on public.resources to authenticated;

drop policy if exists resources_select on public.resources;
create policy resources_select on public.resources
  for select to authenticated
  using (public.current_is_active());

drop policy if exists resources_admin_write on public.resources;
create policy resources_admin_write on public.resources
  for all to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

-- ---------------------------------------------------------------------
-- 5. reservations — donnees de presence, nominatives
-- ---------------------------------------------------------------------

alter table public.reservations enable row level security;

revoke all on public.reservations from anon;
revoke all on public.reservations from authenticated;
grant select, insert, update, delete on public.reservations to authenticated;

drop policy if exists reservations_select on public.reservations;
create policy reservations_select on public.reservations
  for select to authenticated
  using (public.current_is_active());

drop policy if exists reservations_insert_self on public.reservations;
create policy reservations_insert_self on public.reservations
  for insert to authenticated
  with check (user_id = auth.uid() and public.current_is_active());

drop policy if exists reservations_update_own on public.reservations;
create policy reservations_update_own on public.reservations
  for update to authenticated
  using (user_id = auth.uid() and public.current_is_active())
  with check (user_id = auth.uid());

drop policy if exists reservations_delete_own on public.reservations;
create policy reservations_delete_own on public.reservations
  for delete to authenticated
  using (user_id = auth.uid() and public.current_is_active());

drop policy if exists reservations_admin_all on public.reservations;
create policy reservations_admin_all on public.reservations
  for all to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

-- ---------------------------------------------------------------------
-- 6. tickets — contenu potentiellement sensible
--    Chacun ne voit que les siens ; les admins voient tout.
-- ---------------------------------------------------------------------

alter table public.tickets enable row level security;

revoke all on public.tickets from anon;
revoke all on public.tickets from authenticated;
grant select, insert, update, delete on public.tickets to authenticated;

drop policy if exists tickets_select_own_or_admin on public.tickets;
create policy tickets_select_own_or_admin on public.tickets
  for select to authenticated
  using (
    (user_id = auth.uid() and public.current_is_active())
    or public.current_is_admin()
  );

drop policy if exists tickets_insert_self on public.tickets;
create policy tickets_insert_self on public.tickets
  for insert to authenticated
  with check (user_id = auth.uid() and public.current_is_active());

drop policy if exists tickets_admin_write on public.tickets;
create policy tickets_admin_write on public.tickets
  for all to authenticated
  using (public.current_is_admin())
  with check (public.current_is_admin());

-- ---------------------------------------------------------------------
-- 7. tt_reports — signalements de penurie
-- ---------------------------------------------------------------------

alter table public.tt_reports enable row level security;

revoke all on public.tt_reports from anon;
revoke all on public.tt_reports from authenticated;
grant select, insert on public.tt_reports to authenticated;

drop policy if exists tt_reports_select_own_or_admin on public.tt_reports;
create policy tt_reports_select_own_or_admin on public.tt_reports
  for select to authenticated
  using (
    (user_id = auth.uid() and public.current_is_active())
    or public.current_is_admin()
  );

drop policy if exists tt_reports_insert_self on public.tt_reports;
create policy tt_reports_insert_self on public.tt_reports
  for insert to authenticated
  with check (user_id = auth.uid() and public.current_is_active());

-- ---------------------------------------------------------------------
-- 8. Sequences
--    Sans USAGE, un INSERT sur une table a colonne serial echoue.
-- ---------------------------------------------------------------------

revoke usage on all sequences in schema public from anon;
grant usage on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------
-- 9. Refuser tout acces anonyme aux tables futures
-- ---------------------------------------------------------------------

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- ---------------------------------------------------------------------
-- 10. Storage — bucket "avatars"
--
-- La lecture reste publique : l'application affiche les avatars via
-- getPublicUrl(), sans jeton. Seuls les admins peuvent deposer,
-- remplacer ou supprimer, ce qui correspond au seul chemin d'upload
-- existant (AdminPanel.handleAvatarChange).
-- ---------------------------------------------------------------------

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists avatars_admin_insert on storage.objects;
create policy avatars_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and public.current_is_admin());

drop policy if exists avatars_admin_update on storage.objects;
create policy avatars_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and public.current_is_admin())
  with check (bucket_id = 'avatars' and public.current_is_admin());

drop policy if exists avatars_admin_delete on storage.objects;
create policy avatars_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and public.current_is_admin());

commit;


-- =====================================================================
-- VERIFICATION — a executer apres le commit
-- =====================================================================
--
-- RLS active partout ?
--
--   select relname, relrowsecurity
--     from pg_class
--    where relnamespace = 'public'::regnamespace
--      and relkind = 'r'
--    order by relname;
--
-- Politiques en place ?
--
--   select schemaname, tablename, policyname, cmd, roles
--     from pg_policies
--    where schemaname in ('public', 'storage')
--    order by tablename, policyname;
--
-- Privileges residuels du role anon ? (doit renvoyer zero ligne)
--
--   select table_name, privilege_type
--     from information_schema.role_table_grants
--    where grantee = 'anon' and table_schema = 'public';


-- =====================================================================
-- ROLLBACK — en cas de blocage
-- =====================================================================
--
-- begin;
--   alter table public.profiles     disable row level security;
--   alter table public.resources    disable row level security;
--   alter table public.reservations disable row level security;
--   alter table public.tickets      disable row level security;
--   alter table public.tt_reports   disable row level security;
--   drop trigger if exists profiles_guard_privileged_columns on public.profiles;
--   grant select, insert, update, delete
--     on all tables in schema public to anon, authenticated;
--   grant usage on all sequences in schema public to anon, authenticated;
-- commit;
