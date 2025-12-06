-- Ce script nettoie et recrée les politiques pour éviter les erreurs "already exists"

-- 1. Autoriser la lecture pour tous (Suppression avant création)
DROP POLICY IF EXISTS "Lecture publique des scores" ON public.game_scores;
CREATE POLICY "Lecture publique des scores" ON public.game_scores FOR SELECT USING (true);

-- 2. Autoriser l'insertion pour soi-même
DROP POLICY IF EXISTS "Insertion de ses propres scores" ON public.game_scores;
CREATE POLICY "Insertion de ses propres scores" ON public.game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Autoriser la MISE À JOUR pour soi-même (C'était le manquant !)
DROP POLICY IF EXISTS "Mise à jour de ses propres scores" ON public.game_scores;
CREATE POLICY "Mise à jour de ses propres scores"
ON public.game_scores
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Autoriser la suppression pour les Admins
DROP POLICY IF EXISTS "Admins can delete all scores" ON public.game_scores;
CREATE POLICY "Admins can delete all scores"
ON public.game_scores
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
