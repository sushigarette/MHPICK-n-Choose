-- =============================================================
-- Réservations par créneau : empêcher tout chevauchement horaire
-- sur une même ressource (fix double réservation + créneaux).
-- À exécuter dans Supabase : SQL Editor > New query > Run
-- =============================================================

-- Nécessaire pour combiner une égalité (resource_id) et un opérateur
-- de plage (&&) dans une même contrainte d'exclusion GiST.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Si une ancienne contrainte d'unicité "1 résa par ressource et par jour"
-- avait été posée, on la retire (elle empêcherait les créneaux multiples).
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS unique_resource_per_day;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS unique_resource_timespan;

-- Contrainte d'exclusion : deux réservations de la MÊME ressource, le MÊME
-- jour, ne peuvent pas avoir des plages horaires qui se chevauchent.
-- La plage est [start_time, end_time) : deux créneaux jointifs (…-12h / 12h-…)
-- sont autorisés. Le client attrape l'erreur Postgres 23P01 (exclusion_violation).
ALTER TABLE reservations
  ADD CONSTRAINT reservations_no_overlap
  EXCLUDE USING gist (
    resource_id WITH =,
    tsrange((date + start_time), (date + end_time)) WITH &&
  );

-- NB : si l'ALTER échoue avec "conflicting key value violates exclusion
-- constraint", c'est qu'il existe déjà des réservations qui se chevauchent
-- dans les données actuelles. Il faut les corriger/supprimer avant de rejouer.
-- Pour les lister :
--   SELECT a.id, b.id, a.resource_id, a.date,
--          a.start_time, a.end_time, b.start_time, b.end_time
--   FROM reservations a
--   JOIN reservations b
--     ON a.resource_id = b.resource_id
--    AND a.date = b.date
--    AND a.id < b.id
--    AND a.start_time < b.end_time
--    AND b.start_time < a.end_time;
