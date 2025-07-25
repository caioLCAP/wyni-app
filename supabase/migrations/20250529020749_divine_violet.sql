-- Add more grape varieties with complete information
WITH country_ids AS (
  SELECT id, name FROM countries
)
INSERT INTO grapes (name, type, wine_type, origin_country_id, description)
VALUES
  ('Tempranillo', 'Tinto', 'Vinho Tinto',
   (SELECT id FROM country_ids WHERE name = 'Espanha'),
   'Uva tinta espanhola que produz vinhos encorpados com aromas de frutas vermelhas maduras, couro e especiarias. Taninos firmes e boa acidez.'),
  
  ('Sangiovese', 'Tinto', 'Vinho Tinto',
   (SELECT id FROM country_ids WHERE name = 'Itália'),
   'Uva tinta italiana com alta acidez e taninos médios. Aromas de cerejas, ameixas, ervas e terra.'),
  
  ('Riesling', 'Branco', 'Vinho Branco',
   (SELECT id FROM country_ids WHERE name = 'Alemanha'),
   'Uva branca aromática com alta acidez. Notas de pêssego, maçã verde, mel e minerais.'),
  
  ('Syrah', 'Tinto', 'Vinho Tinto',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva tinta que produz vinhos encorpados com aromas de frutas negras, pimenta preta e defumados.'),
  
  ('Nebbiolo', 'Tinto', 'Vinho Tinto',
   (SELECT id FROM country_ids WHERE name = 'Itália'),
   'Uva tinta italiana com taninos firmes e alta acidez. Aromas de rosas, alcatrão e frutas vermelhas.'),
  
  ('Chenin Blanc', 'Branco', 'Vinho Branco',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva branca versátil com boa acidez. Aromas de maçã, pera, mel e flores.'),
  
  ('Grenache', 'Tinto', 'Vinho Tinto',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva tinta que produz vinhos frutados e especiados com teor alcoólico elevado.'),
  
  ('Viognier', 'Branco', 'Vinho Branco',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva branca aromática com notas de pêssego, damasco e flores brancas.'),
  
  ('Carménère', 'Tinto', 'Vinho Tinto',
   (SELECT id FROM country_ids WHERE name = 'Chile'),
   'Uva tinta com aromas de frutas vermelhas, pimentão verde e especiarias.'),
  
  ('Gewürztraminer', 'Branco', 'Vinho Branco',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva branca muito aromática com notas de lichia, rosas e especiarias.'),
  
  ('Touriga Nacional', 'Tinto', 'Vinho Tinto',
   (SELECT id FROM country_ids WHERE name = 'Portugal'),
   'Uva tinta portuguesa com aromas intensos de frutas negras, violetas e especiarias.'),
  
  ('Verdicchio', 'Branco', 'Vinho Branco',
   (SELECT id FROM country_ids WHERE name = 'Itália'),
   'Uva branca italiana com notas minerais, cítricas e de amêndoas.'),
  
  -- Continue with more grape varieties...
  
  ('Glera', 'Branco', 'Espumante',
   (SELECT id FROM country_ids WHERE name = 'Itália'),
   'Uva branca usada no Prosecco, com aromas de maçã, pera e flores.'),
  
  ('Tannat', 'Tinto', 'Vinho Tinto',
   (SELECT id FROM country_ids WHERE name = 'França'),
   'Uva tinta com taninos muito firmes e aromas de frutas negras e especiarias.')
ON CONFLICT (name) DO UPDATE
SET 
  type = EXCLUDED.type,
  wine_type = EXCLUDED.wine_type,
  origin_country_id = EXCLUDED.origin_country_id,
  description = EXCLUDED.description;

-- Update characteristics relationships
INSERT INTO grape_characteristics (grape_id, characteristic_id)
SELECT g.id, c.id
FROM grapes g
CROSS JOIN characteristics c
WHERE 
  (g.description ILIKE '%' || c.name || '%') OR
  (g.type = 'Tinto' AND c.name IN ('Encorpado', 'Taninos Firmes')) OR
  (g.type = 'Branco' AND c.name IN ('Fresco', 'Mineral'))
ON CONFLICT DO NOTHING;

-- Update aroma relationships
INSERT INTO grape_aromas (grape_id, aroma_id)
SELECT g.id, a.id
FROM grapes g
CROSS JOIN aromas a
WHERE 
  g.description ILIKE '%' || a.name || '%'
ON CONFLICT DO NOTHING;

-- Update food pairing relationships based on characteristics
INSERT INTO grape_food_pairings (grape_id, food_pairing_id)
SELECT DISTINCT g.id, f.id
FROM grapes g
JOIN grape_characteristics gc ON g.id = gc.grape_id
JOIN characteristics c ON gc.characteristic_id = c.id
JOIN food_pairings f ON 
  (c.name = 'Encorpado' AND f.category IN ('Carnes', 'Queijos')) OR
  (c.name = 'Fresco' AND f.category IN ('Frutos do Mar', 'Saladas')) OR
  (c.name = 'Mineral' AND f.category IN ('Frutos do Mar', 'Queijos')) OR
  (c.name = 'Frutado' AND f.category IN ('Sobremesas', 'Aperitivos'))
ON CONFLICT DO NOTHING;