-- Insertion des paramètres pour le thème de Noël
INSERT INTO site_settings (key, value, description) 
VALUES 
  ('noel_theme_enabled', 'true', 'Active/désactive le thème de Noël globalement'),
  ('noel_colors', 'true', 'Active/désactive les couleurs de Noël (rouge, vert, blanc, doré)'),
  ('noel_primary_color', 'true', 'Active/désactive la couleur rouge pour les boutons principaux'),
  ('noel_secondary_color', 'true', 'Active/désactive la couleur verte pour les éléments secondaires'),
  ('noel_background', 'true', 'Active/désactive le fond de Noël'),
  ('noel_borders', 'true', 'Active/désactive les bordures de Noël'),
  ('noel_snow', 'true', 'Active/désactive l''animation de neige qui tombe')
ON CONFLICT (key) DO NOTHING;

