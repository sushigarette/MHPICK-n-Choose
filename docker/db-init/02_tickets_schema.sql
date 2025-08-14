-- Table pour les tickets de support
CREATE TABLE IF NOT EXISTS public.tickets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id TEXT REFERENCES public.resources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'envoyé' CHECK (status IN ('envoyé', 'ouvert', 'traité', 'fermé')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('basse', 'normal', 'haute', 'urgente')),
  admin_response TEXT,
  admin_response_date TIMESTAMPTZ,
  admin_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON public.tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 