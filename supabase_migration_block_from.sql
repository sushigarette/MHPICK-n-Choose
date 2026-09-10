-- =====================================================================
-- MHPick — Plage de blocage des ressources
--
-- A EXECUTER dans l'editeur SQL de Supabase.
--
-- Ajoute une date de DEBUT de blocage. Jusqu'ici seule block_until
-- existait : un blocage prenait effet immediatement et expirait a la
-- date de fin. Avec block_from, l'admin definit une fenetre complete.
--
-- Compatibilite : la colonne est nullable, sans defaut. Les blocages
-- existants gardent block_from = NULL, ce qui signifie "effet
-- immediat" et reproduit exactement le comportement actuel.
-- =====================================================================

alter table public.resources
  add column if not exists block_from timestamptz;

comment on column public.resources.block_from is
  'Debut de la fenetre de blocage. NULL = effet immediat.';

comment on column public.resources.block_until is
  'Fin de la fenetre de blocage. NULL = blocage permanent jusqu''a reactivation manuelle.';


-- =====================================================================
-- VERIFICATION
-- =====================================================================
--
--   select column_name, data_type, is_nullable, column_default
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'resources'
--      and column_name in ('is_active', 'block_from', 'block_until');


-- =====================================================================
-- ROLLBACK
-- =====================================================================
--
--   alter table public.resources drop column if exists block_from;
