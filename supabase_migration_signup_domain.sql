-- =====================================================================
-- MHPick — Restriction du domaine a l'inscription, cote serveur
--
-- A EXECUTER dans l'editeur SQL de Supabase (role service_role),
-- PUIS A ACTIVER dans le tableau de bord :
--   Authentication > Hooks > Before User Created
--   > choisir la fonction "restrict_signup_to_mhcomm"
--
-- Tant que le hook n'est pas selectionne dans le tableau de bord, cette
-- fonction existe mais n'est jamais appelee : creer la fonction ne
-- suffit pas.
--
-- CONTEXTE : la verification du domaine dans AuthContext.tsx (ligne 123)
-- s'execute dans le navigateur. Un appel direct a l'API auth avec une
-- adresse quelconque cree un compte sans jamais la rencontrer. Ce hook
-- deplace le controle cote serveur, ou il ne peut plus etre contourne.
--
-- La verification cote client est conservee : elle donne un message
-- d'erreur immediat, sans aller-retour reseau. Ce n'est plus elle qui
-- protege, c'est du confort d'interface.
-- =====================================================================

create or replace function public.restrict_signup_to_mhcomm(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $fn$
declare
  adresse text := lower(coalesce(event -> 'user' ->> 'email', ''));
begin
  -- Le motif exige "@mhcomm.fr" en fin de chaine : "x@notmhcomm.fr" et
  -- "x@mhcomm.fr.exemple.com" sont donc bien rejetes.
  if adresse like '%@mhcomm.fr' then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Seules les adresses email se terminant par @mhcomm.fr sont autorisees.'
    )
  );
end;
$fn$;

-- Seul le service d'authentification doit pouvoir appeler ce hook.
grant execute on function public.restrict_signup_to_mhcomm(jsonb) to supabase_auth_admin;
revoke execute on function public.restrict_signup_to_mhcomm(jsonb) from authenticated, anon, public;


-- =====================================================================
-- VERIFICATION
-- =====================================================================
--
-- Une adresse du domaine est acceptee (doit renvoyer "{}") :
--
--   select public.restrict_signup_to_mhcomm(
--     '{"user": {"email": "prenom.nom@mhcomm.fr"}}'::jsonb
--   );
--
-- Une adresse hors domaine est refusee (doit renvoyer un objet "error") :
--
--   select public.restrict_signup_to_mhcomm(
--     '{"user": {"email": "attaquant@gmail.com"}}'::jsonb
--   );
--
-- Les contournements par suffixe sont refuses :
--
--   select public.restrict_signup_to_mhcomm(
--     '{"user": {"email": "a@notmhcomm.fr"}}'::jsonb
--   );
--   select public.restrict_signup_to_mhcomm(
--     '{"user": {"email": "a@mhcomm.fr.exemple.com"}}'::jsonb
--   );


-- =====================================================================
-- ROLLBACK
-- =====================================================================
--
-- Desactiver d'abord le hook dans Authentication > Hooks, puis :
--
--   drop function if exists public.restrict_signup_to_mhcomm(jsonb);
