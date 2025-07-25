-- Insert countries (unique values from Origem column)
INSERT INTO countries (name) 
VALUES 
  ('França'),
  ('Itália'),
  ('Espanha'),
  ('Portugal'),
  ('Grécia'),
  ('Hungria'),
  ('Estados Unidos'),
  ('Argentina'),
  ('Chile'),
  ('Brasil'),
  ('China'),
  ('Bulgária'),
  ('Chipre'),
  ('Geórgia'),
  ('Japão'),
  ('África do Sul'),
  ('Uruguai'),
  ('Áustria')
ON CONFLICT (name) DO NOTHING;

-- Insert regions with country references
WITH country_ids AS (
  SELECT id, name FROM countries
)
INSERT INTO regions (name, country_id)
VALUES 
  ('Bordeaux', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Borgonha', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Loire', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Rhône', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Alsácia', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Champagne', (SELECT id FROM country_ids WHERE name = 'França')),
  ('Piemonte', (SELECT id FROM country_ids WHERE name = 'Itália')),
  ('Toscana', (SELECT id FROM country_ids WHERE name = 'Itália')),
  ('Vêneto', (SELECT id FROM country_ids WHERE name = 'Itália')),
  ('Rioja', (SELECT id FROM country_ids WHERE name = 'Espanha')),
  ('Ribera del Duero', (SELECT id FROM country_ids WHERE name = 'Espanha')),
  ('Douro', (SELECT id FROM country_ids WHERE name = 'Portugal')),
  ('Alentejo', (SELECT id FROM country_ids WHERE name = 'Portugal')),
  ('Mendoza', (SELECT id FROM country_ids WHERE name = 'Argentina')),
  ('Vale dos Vinhedos', (SELECT id FROM country_ids WHERE name = 'Brasil')),
  ('Serra Gaúcha', (SELECT id FROM country_ids WHERE name = 'Brasil')),
  ('Napa Valley', (SELECT id FROM country_ids WHERE name = 'Estados Unidos'))
ON CONFLICT (name, country_id) DO NOTHING;

-- Insert characteristics (parsed from Características column)
INSERT INTO characteristics (name, category)
VALUES 
  ('Encorpado', 'Corpo'),
  ('Meio Encorpado', 'Corpo'),
  ('Leve', 'Corpo'),
  ('Taninos Firmes', 'Taninos'),
  ('Taninos Suaves', 'Taninos'),
  ('Alta Acidez', 'Acidez'),
  ('Acidez Moderada', 'Acidez'),
  ('Mineral', 'Perfil'),
  ('Frutado', 'Perfil'),
  ('Floral', 'Perfil'),
  ('Herbáceo', 'Perfil'),
  ('Especiado', 'Perfil'),
  ('Complexo', 'Perfil'),
  ('Elegante', 'Perfil'),
  ('Fresco', 'Perfil')
ON CONFLICT (name) DO NOTHING;

-- Insert aromas (parsed from Principais Aromas column)
INSERT INTO aromas (name, category)
VALUES 
  ('Frutas Vermelhas', 'Frutas'),
  ('Frutas Negras', 'Frutas'),
  ('Cereja', 'Frutas'),
  ('Amora', 'Frutas'),
  ('Cassis', 'Frutas'),
  ('Morango', 'Frutas'),
  ('Framboesa', 'Frutas'),
  ('Maçã', 'Frutas'),
  ('Pêssego', 'Frutas'),
  ('Limão', 'Cítricos'),
  ('Flores', 'Floral'),
  ('Rosas', 'Floral'),
  ('Violeta', 'Floral'),
  ('Especiarias', 'Especiarias'),
  ('Pimenta', 'Especiarias'),
  ('Baunilha', 'Especiarias'),
  ('Carvalho', 'Madeira'),
  ('Tabaco', 'Outros'),
  ('Couro', 'Outros'),
  ('Mineral', 'Outros')
ON CONFLICT (name) DO NOTHING;

-- Insert food pairings (parsed from Enogastronomia column)
INSERT INTO food_pairings (name, category, dietary_restrictions)
VALUES 
  ('Carnes Vermelhas', 'Carnes', NULL),
  ('Cordeiro', 'Carnes', NULL),
  ('Aves', 'Carnes', NULL),
  ('Peixes', 'Frutos do Mar', NULL),
  ('Frutos do Mar', 'Frutos do Mar', NULL),
  ('Queijos Envelhecidos', 'Queijos', NULL),
  ('Queijos Frescos', 'Queijos', NULL),
  ('Massas', 'Massas', NULL),
  ('Cogumelos', 'Vegetariano', ARRAY['vegetariano']),
  ('Legumes Grelhados', 'Vegetariano', ARRAY['vegetariano', 'vegano']),
  ('Saladas', 'Vegetariano', ARRAY['vegetariano', 'vegano']),
  ('Feijoada', 'Pratos Brasileiros', NULL),
  ('Acarajé', 'Pratos Brasileiros', NULL),
  ('Moqueca', 'Pratos Brasileiros', NULL)
ON CONFLICT (name) DO NOTHING;

-- Insert grapes with country references
WITH country_ids AS (
  SELECT id, name FROM countries
)
INSERT INTO grapes (name, type, origin_country_id, description)
VALUES 
  ('Cabernet Sauvignon', 'Tinto', 
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva tinta encorpada com taninos firmes e aromas de frutas negras'),
  ('Merlot', 'Tinto',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva tinta macia com aromas de frutas vermelhas e especiarias'),
  ('Chardonnay', 'Branco',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva branca versátil com aromas de frutas tropicais e notas de carvalho'),
  ('Pinot Noir', 'Tinto',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva tinta elegante com aromas delicados de frutas vermelhas'),
  ('Sauvignon Blanc', 'Branco',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva branca aromática com notas herbáceas e cítricas')
ON CONFLICT (name) DO NOTHING;

-- Create helper function to link grapes with characteristics
CREATE OR REPLACE FUNCTION link_grape_characteristics()
RETURNS void AS $$
DECLARE
  grape_id uuid;
  characteristic_id uuid;
BEGIN
  -- Example: Link Cabernet Sauvignon with its characteristics
  SELECT id INTO grape_id FROM grapes WHERE name = 'Cabernet Sauvignon';
  SELECT id INTO characteristic_id FROM characteristics WHERE name = 'Encorpado';
  INSERT INTO grape_characteristics (grape_id, characteristic_id)
  VALUES (grape_id, characteristic_id)
  ON CONFLICT DO NOTHING;
  
  -- Add more grape-characteristic relationships here
END;
$$ LANGUAGE plpgsql;

-- Create helper function to link grapes with aromas
CREATE OR REPLACE FUNCTION link_grape_aromas()
RETURNS void AS $$
DECLARE
  grape_id uuid;
  aroma_id uuid;
BEGIN
  -- Example: Link Cabernet Sauvignon with its aromas
  SELECT id INTO grape_id FROM grapes WHERE name = 'Cabernet Sauvignon';
  SELECT id INTO aroma_id FROM aromas WHERE name = 'Frutas Negras';
  INSERT INTO grape_aromas (grape_id, aroma_id)
  VALUES (grape_id, aroma_id)
  ON CONFLICT DO NOTHING;
  
  -- Add more grape-aroma relationships here
END;
$$ LANGUAGE plpgsql;

-- Create helper function to link grapes with food pairings
CREATE OR REPLACE FUNCTION link_grape_food_pairings()
RETURNS void AS $$
DECLARE
  grape_id uuid;
  food_pairing_id uuid;
BEGIN
  -- Example: Link Cabernet Sauvignon with its food pairings
  SELECT id INTO grape_id FROM grapes WHERE name = 'Cabernet Sauvignon';
  SELECT id INTO food_pairing_id FROM food_pairings WHERE name = 'Carnes Vermelhas';
  INSERT INTO grape_food_pairings (grape_id, food_pairing_id)
  VALUES (grape_id, food_pairing_id)
  ON CONFLICT DO NOTHING;
  
  -- Add more grape-food pairing relationships here
END;
$$ LANGUAGE plpgsql;

-- Execute the helper functions
SELECT link_grape_characteristics();
SELECT link_grape_aromas();
SELECT link_grape_food_pairings();

-- Drop the helper functions
DROP FUNCTION link_grape_characteristics();
DROP FUNCTION link_grape_aromas();
DROP FUNCTION link_grape_food_pairings();