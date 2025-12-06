-- Table pour stocker les scores des jeux
DROP TABLE IF EXISTS public.game_scores;

CREATE TABLE public.game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Changé de auth.users à public.profiles
    score INTEGER NOT NULL,
    game_type TEXT NOT NULL DEFAULT 'christmas_runner',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour trier rapidement par score
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON public.game_scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON public.game_scores (game_type);

-- Sécurité (RLS)
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les scores
CREATE POLICY "Lecture publique des scores" ON public.game_scores
    FOR SELECT USING (true);

-- Les utilisateurs connectés peuvent ajouter leur propre score
CREATE POLICY "Insertion authentifiée" ON public.game_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);
