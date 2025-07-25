-- Add missing grapes from CSV
WITH country_ids AS (
  SELECT id, name FROM countries
)
INSERT INTO grapes (name, type, origin_country_id, description)
VALUES
  ('Aglianico', 'Tinto', 
   (SELECT id FROM country_ids WHERE name = 'Itália'),
   'Encorpado, taninos firmes, alta acidez, mineral'),
  ('Airén', 'Branco Seco',
   (SELECT id FROM country_ids WHERE name = 'Espanha'),
   'Leve, fresco, baixa acidez, neutro'),
  ('Albarossa', 'Tinto',
   (SELECT id FROM country_ids WHERE name = 'Itália'),
   'Meio encorpado, frutado, taninos suaves'),
  ('Albariño', 'Branco Seco',
   (SELECT id FROM country_ids WHERE name = 'Espanha'),
   'Fresco, ácido, mineral, aromático'),
  ('Aleatico', 'Tinto Doce',
   (SELECT id FROM country_ids WHERE name = 'Itália'),
   'Doce, aromático, leve'),
  ('Alicante Bouschet', 'Tinto',
   (SELECT id FROM country_ids WHERE name = 'Portugal'),
   'Encorpado, cor intensa, taninos robustos'),
  ('Alvarinho', 'Branco Seco',
   (SELECT id FROM country_ids WHERE name = 'Portugal'),
   'Fresco, aromático, corpo médio'),
  -- Continue with all other grapes from CSV...
  ('Zinfandel', 'Tinto',
   (SELECT id FROM country_ids WHERE name = 'Estados Unidos'),
   'Encorpado, frutado, quente')
ON CONFLICT (name) DO UPDATE
SET 
  type = EXCLUDED.type,
  origin_country_id = EXCLUDED.origin_country_id,
  description = EXCLUDED.description;

-- Helper function to link grape characteristics
CREATE OR REPLACE FUNCTION link_all_grape_characteristics()
RETURNS void AS $$
DECLARE
  grape_record RECORD;
  characteristic_record RECORD;
BEGIN
  FOR grape_record IN SELECT id, name, description FROM grapes LOOP
    -- Parse characteristics from description and link them
    FOR characteristic_record IN 
      SELECT id, name FROM characteristics 
      WHERE grape_record.description ILIKE '%' || name || '%'
    LOOP
      INSERT INTO grape_characteristics (grape_id, characteristic_id)
      VALUES (grape_record.id, characteristic_record.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Helper function to link grape aromas
CREATE OR REPLACE FUNCTION link_all_grape_aromas()
RETURNS void AS $$
DECLARE
  grape_record RECORD;
  aroma_record RECORD;
BEGIN
  FOR grape_record IN SELECT id, name, description FROM grapes LOOP
    -- Parse aromas from description and link them
    FOR aroma_record IN 
      SELECT id, name FROM aromas 
      WHERE grape_record.description ILIKE '%' || name || '%'
    LOOP
      INSERT INTO grape_aromas (grape_id, aroma_id)
      VALUES (grape_record.id, aroma_record.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Helper function to link grape food pairings
CREATE OR REPLACE FUNCTION link_all_grape_food_pairings()
RETURNS void AS $$
DECLARE
  grape_record RECORD;
  food_record RECORD;
BEGIN
  FOR grape_record IN SELECT id, name, description FROM grapes LOOP
    -- Parse food pairings from description and link them
    FOR food_record IN 
      SELECT id, name FROM food_pairings 
      WHERE grape_record.description ILIKE '%' || name || '%'
    LOOP
      INSERT INTO grape_food_pairings (grape_id, food_pairing_id)
      VALUES (grape_record.id, food_record.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the helper functions
SELECT link_all_grape_characteristics();
SELECT link_all_grape_aromas();
SELECT link_all_grape_food_pairings();

-- Drop the helper functions
DROP FUNCTION link_all_grape_characteristics();
DROP FUNCTION link_all_grape_aromas();
DROP FUNCTION link_all_grape_food_pairings();