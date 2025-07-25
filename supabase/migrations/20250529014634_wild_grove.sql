-- Add type column to grapes table if not exists
ALTER TABLE grapes
ADD COLUMN IF NOT EXISTS wine_type TEXT;

-- Update existing grapes with wine types
UPDATE grapes
SET wine_type = CASE
  WHEN type = 'Tinto' THEN 'Vinho Tinto'
  WHEN type = 'Branco' THEN 'Vinho Branco'
  WHEN type = 'Rosé' THEN 'Vinho Rosé'
  WHEN type = 'Espumante' THEN 'Espumante'
  ELSE type
END;

-- Create grape_food_pairings junction table if not exists
CREATE TABLE IF NOT EXISTS grape_food_pairings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grape_id UUID REFERENCES grapes(id) ON DELETE CASCADE,
  food_pairing_id UUID REFERENCES food_pairings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(grape_id, food_pairing_id)
);

-- Add some example pairings
INSERT INTO grape_food_pairings (grape_id, food_pairing_id)
SELECT g.id, f.id
FROM grapes g
CROSS JOIN food_pairings f
WHERE 
  (g.wine_type = 'Vinho Tinto' AND f.category IN ('Carnes', 'Massas')) OR
  (g.wine_type = 'Vinho Branco' AND f.category IN ('Frutos do Mar', 'Saladas')) OR
  (g.wine_type = 'Espumante' AND f.category IN ('Aperitivos', 'Sobremesas'))
ON CONFLICT DO NOTHING;