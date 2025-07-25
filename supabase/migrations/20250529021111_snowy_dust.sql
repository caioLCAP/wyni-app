-- Helper function to extract regions from grape descriptions
CREATE OR REPLACE FUNCTION extract_regions(description TEXT)
RETURNS TEXT[] AS $$
DECLARE
  regions TEXT[];
BEGIN
  -- Extract regions mentioned in the description
  -- This is a simplified example - in production you'd want more sophisticated text analysis
  SELECT ARRAY(
    SELECT DISTINCT r.name 
    FROM regions r 
    WHERE description ILIKE '%' || r.name || '%'
  ) INTO regions;
  
  RETURN regions;
END;
$$ LANGUAGE plpgsql;

-- Add missing regions from the CSV data
WITH country_ids AS (
  SELECT id, name FROM countries
)
INSERT INTO regions (name, country_id)
VALUES
  -- France
  ('Côtes du Rhône', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Provence', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Languedoc', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Médoc', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Saint-Émilion', (SELECT id FROM country_ids WHERE name = 'França')),
  
  -- Italy
  ('Chianti', (SELECT id FROM country_ids WHERE name = 'Itália')),
  ('Barolo', (SELECT id FROM country_ids WHERE name = 'Itália')),
  ('Brunello di Montalcino', (SELECT id FROM country_ids WHERE name = 'Itália')),
  ('Prosecco', (SELECT id FROM country_ids WHERE name = 'Itália')),
  
  -- Spain
  ('Priorat', (SELECT id FROM country_ids WHERE name = 'Espanha')),
  ('Ribera del Duero', (SELECT id FROM country_ids WHERE name = 'Espanha')),
  ('Rías Baixas', (SELECT id FROM country_ids WHERE name = 'Espanha')),
  
  -- Portugal
  ('Vinho Verde', (SELECT id FROM country_ids WHERE name = 'Portugal')),
  ('Dão', (SELECT id FROM country_ids WHERE name = 'Portugal')),
  
  -- Germany
  ('Mosel', (SELECT id FROM country_ids WHERE name = 'Alemanha')),
  ('Rheingau', (SELECT id FROM country_ids WHERE name = 'Alemanha')),
  
  -- Argentina
  ('Uco Valley', (SELECT id FROM country_ids WHERE name = 'Argentina')),
  ('Luján de Cuyo', (SELECT id FROM country_ids WHERE name = 'Argentina')),
  
  -- Chile
  ('Maipo Valley', (SELECT id FROM country_ids WHERE name = 'Chile')),
  ('Casablanca Valley', (SELECT id FROM country_ids WHERE name = 'Chile')),
  
  -- United States
  ('Sonoma', (SELECT id FROM country_ids WHERE name = 'Estados Unidos')),
  ('Russian River Valley', (SELECT id FROM country_ids WHERE name = 'Estados Unidos')),
  ('Willamette Valley', (SELECT id FROM country_ids WHERE name = 'Estados Unidos'))
ON CONFLICT (name, country_id) DO NOTHING;

-- Link grapes to regions based on their origin country and typical growing regions
INSERT INTO grape_regions (grape_id, region_id)
SELECT DISTINCT g.id, r.id
FROM grapes g
JOIN regions r ON r.country_id = g.origin_country_id
WHERE 
  -- Link based on description mentions
  g.description ILIKE '%' || r.name || '%'
  -- Or link based on typical growing regions for specific grapes
  OR (g.name = 'Cabernet Sauvignon' AND r.name IN ('Médoc', 'Napa Valley'))
  OR (g.name = 'Sangiovese' AND r.name IN ('Chianti', 'Brunello di Montalcino'))
  OR (g.name = 'Tempranillo' AND r.name IN ('Rioja', 'Ribera del Duero'))
  OR (g.name = 'Riesling' AND r.name IN ('Mosel', 'Rheingau'))
  OR (g.name = 'Nebbiolo' AND r.name IN ('Barolo', 'Barbaresco'))
  OR (g.name = 'Malbec' AND r.name IN ('Mendoza', 'Uco Valley'))
  OR (g.name = 'Glera' AND r.name = 'Prosecco')
  OR (g.name = 'Albariño' AND r.name = 'Rías Baixas')
  OR (g.name = 'Touriga Nacional' AND r.name IN ('Douro', 'Dão'))
ON CONFLICT DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_grape_regions_region_id ON grape_regions(region_id);
CREATE INDEX IF NOT EXISTS idx_regions_country_id ON regions(country_id);

-- Update the wine_food_recommendations view to include region information
DROP VIEW IF EXISTS wine_food_recommendations;
CREATE VIEW wine_food_recommendations AS
SELECT 
  g.id as grape_id,
  g.name as grape_name,
  g.type as grape_type,
  g.wine_type,
  g.description as grape_description,
  c.id as characteristic_id,
  c.name as characteristic_name,
  a.id as aroma_id,
  a.name as aroma_name,
  f.id as food_id,
  f.name as food_name,
  f.category as food_category,
  f.dietary_restrictions,
  array_agg(DISTINCT r.name) as regions,
  co.name as country_name
FROM grapes g
LEFT JOIN grape_characteristics gc ON g.id = gc.grape_id
LEFT JOIN characteristics c ON gc.characteristic_id = c.id
LEFT JOIN grape_aromas ga ON g.id = ga.grape_id
LEFT JOIN aromas a ON ga.aroma_id = a.id
LEFT JOIN grape_food_pairings gf ON g.id = gf.grape_id
LEFT JOIN food_pairings f ON gf.food_pairing_id = f.id
LEFT JOIN grape_regions gr ON g.id = gr.grape_id
LEFT JOIN regions r ON gr.region_id = r.id
LEFT JOIN countries co ON g.origin_country_id = co.id
GROUP BY 
  g.id, g.name, g.type, g.wine_type, g.description,
  c.id, c.name,
  a.id, a.name,
  f.id, f.name, f.category, f.dietary_restrictions,
  co.name;