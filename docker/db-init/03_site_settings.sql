-- Table pour les paramètres globaux du site
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des paramètres pour le mode Halloween global
INSERT INTO site_settings (key, value, description) 
VALUES 
  ('global_halloween_mode', 'false', 'Contrôle global du thème Halloween pour tout le site'),
  ('halloween_random_audio', 'true', 'Active/désactive les sons aléatoires Halloween (chouette, hibou, rire)'),
  ('halloween_storm_audio', 'true', 'Active/désactive l''audio d''orage Halloween'),
  ('halloween_storm_visual', 'true', 'Active/désactive les effets visuels d''orage (éclairs, pluie intense)'),
  ('halloween_rain', 'true', 'Active/désactive la pluie normale Halloween'),
  ('halloween_surprise', 'true', 'Active/désactive les images surprises qui apparaissent brusquement'),
  ('halloween_particles', 'false', 'Active/désactive les chauves-souris émojis qui volent'),
  ('halloween_flying_bats', 'true', 'Active/désactive les chauves-souris animées qui sautent de bas en haut')
ON CONFLICT (key) DO NOTHING;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at 
    BEFORE UPDATE ON site_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Seuls les admins peuvent modifier
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to read site settings" ON site_settings;
DROP POLICY IF EXISTS "Allow admins to modify site settings" ON site_settings;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to read site settings" ON site_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre la modification seulement aux admins
CREATE POLICY "Allow admins to modify site settings" ON site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );
