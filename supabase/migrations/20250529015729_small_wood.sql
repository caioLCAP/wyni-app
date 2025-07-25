-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_grape_characteristics_characteristic_id 
ON grape_characteristics(characteristic_id);

CREATE INDEX IF NOT EXISTS idx_grape_aromas_aroma_id 
ON grape_aromas(aroma_id);

CREATE INDEX IF NOT EXISTS idx_grape_food_pairings_food_id 
ON grape_food_pairings(food_pairing_id);

-- Create a view to help with wine and food pairing recommendations
CREATE OR REPLACE VIEW wine_food_recommendations AS
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
  f.dietary_restrictions
FROM grapes g
LEFT JOIN grape_characteristics gc ON g.id = gc.grape_id
LEFT JOIN characteristics c ON gc.characteristic_id = c.id
LEFT JOIN grape_aromas ga ON g.id = ga.grape_id
LEFT JOIN aromas a ON ga.aroma_id = a.id
LEFT JOIN grape_food_pairings gf ON g.id = gf.grape_id
LEFT JOIN food_pairings f ON gf.food_pairing_id = f.id;

-- Add some example relationships between characteristics and food pairings
INSERT INTO grape_food_pairings (grape_id, food_pairing_id)
SELECT DISTINCT g.id, f.id
FROM grapes g
JOIN grape_characteristics gc ON g.id = gc.grape_id
JOIN characteristics c ON gc.characteristic_id = c.id
JOIN food_pairings f ON 
  (c.name = 'Encorpado' AND f.category IN ('Carnes', 'Queijos')) OR
  (c.name = 'Leve' AND f.category IN ('Saladas', 'Frutos do Mar')) OR
  (c.name = 'Frutado' AND f.category IN ('Sobremesas', 'Aperitivos'))
ON CONFLICT DO NOTHING;

-- Add relationships between aromas and food pairings
INSERT INTO grape_food_pairings (grape_id, food_pairing_id)
SELECT DISTINCT g.id, f.id
FROM grapes g
JOIN grape_aromas ga ON g.id = ga.grape_id
JOIN aromas a ON ga.aroma_id = a.id
JOIN food_pairings f ON 
  (a.category = 'Frutas' AND f.category IN ('Sobremesas', 'Saladas')) OR
  (a.category = 'Especiarias' AND f.category IN ('Carnes', 'Massas')) OR
  (a.category = 'Floral' AND f.category IN ('Aperitivos', 'Saladas'))
ON CONFLICT DO NOTHING;