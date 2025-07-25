-- Add missing food pairings from CSV
INSERT INTO food_pairings (name, category, dietary_restrictions)
VALUES
  -- Meat dishes
  ('Carnes de Caça', 'Carnes', NULL),
  ('Carne de Sol', 'Carnes', NULL),
  ('Carne de Porco', 'Carnes', NULL),
  ('Carne de Panela', 'Carnes', NULL),
  ('Picanha', 'Carnes', NULL),
  ('Costela', 'Carnes', NULL),
  ('Frango Grelhado', 'Aves', NULL),
  ('Aves com Molho Cremoso', 'Aves', NULL),
  ('Aves de Caça', 'Aves', NULL),
  
  -- Seafood
  ('Bacalhau à Brás', 'Frutos do Mar', NULL),
  ('Bacalhau com Natas', 'Frutos do Mar', NULL),
  ('Polvo Grelhado', 'Frutos do Mar', NULL),
  ('Salmão Grelhado', 'Frutos do Mar', NULL),
  ('Peixes Grelhados', 'Frutos do Mar', NULL),
  ('Peixes Fritos', 'Frutos do Mar', NULL),
  ('Ostras', 'Frutos do Mar', NULL),
  ('Lagosta', 'Frutos do Mar', NULL),
  ('Camarões', 'Frutos do Mar', NULL),
  ('Sushi', 'Frutos do Mar', NULL),
  ('Ceviche', 'Frutos do Mar', NULL),
  
  -- Brazilian dishes
  ('Bobó de Camarão', 'Pratos Brasileiros', NULL),
  ('Moqueca de Peixe', 'Pratos Brasileiros', NULL),
  ('Moqueca de Camarão', 'Pratos Brasileiros', NULL),
  ('Vatapá', 'Pratos Brasileiros', NULL),
  ('Churrasco Gaúcho', 'Pratos Brasileiros', NULL),
  
  -- Pasta and rice
  ('Lasanha', 'Massas', NULL),
  ('Massas com Molho Rico', 'Massas', NULL),
  ('Massas com Molho Leve', 'Massas', NULL),
  ('Massas com Molho Vermelho', 'Massas', NULL),
  ('Massas com Molho Branco', 'Massas', NULL),
  ('Massas Cremosas', 'Massas', NULL),
  ('Risoto de Parmesão', 'Risotos', NULL),
  ('Risoto de Limão', 'Risotos', NULL),
  ('Risoto de Funghi', 'Risotos', NULL),
  ('Risoto de Abóbora', 'Risotos', ARRAY['sem glúten']),
  
  -- Vegetarian/Vegan dishes
  ('Moqueca de Palmito', 'Vegetariano', ARRAY['vegano']),
  ('Berinjela Assada', 'Vegetariano', ARRAY['vegano']),
  ('Berinjela à Parmegiana', 'Vegetariano', ARRAY['vegetariano']),
  ('Pimentões Recheados', 'Vegetariano', ARRAY['vegano']),
  ('Cogumelos Grelhados', 'Vegetariano', ARRAY['vegano']),
  ('Legumes Assados', 'Vegetariano', ARRAY['vegano']),
  ('Legumes Salteados', 'Vegetariano', ARRAY['vegano']),
  ('Tofu Grelhado', 'Vegetariano', ARRAY['vegano']),
  ('Abobrinha Recheada', 'Vegetariano', ARRAY['vegano']),
  ('Curry de Vegetais', 'Vegetariano', ARRAY['vegano']),
  ('Curry de Legumes', 'Vegetariano', ARRAY['vegano']),
  ('Curry de Coco', 'Vegetariano', ARRAY['vegano']),
  ('Ratatouille', 'Vegetariano', ARRAY['vegano']),
  ('Caponata', 'Vegetariano', ARRAY['vegano']),
  
  -- Appetizers and snacks
  ('Tapas', 'Aperitivos', NULL),
  ('Bruschetta', 'Aperitivos', ARRAY['vegano']),
  ('Pão de Queijo', 'Aperitivos', ARRAY['sem glúten']),
  ('Tapioca com Queijo', 'Aperitivos', ARRAY['sem glúten']),
  ('Tapioca com Coco', 'Aperitivos', ARRAY['vegano', 'sem glúten']),
  ('Empanadas', 'Aperitivos', NULL),
  ('Falafel', 'Aperitivos', ARRAY['vegano']),
  ('Hummus', 'Aperitivos', ARRAY['vegano', 'sem glúten']),
  
  -- Salads
  ('Salada Caprese', 'Saladas', ARRAY['vegetariano']),
  ('Salada Mediterrânea', 'Saladas', ARRAY['vegano']),
  ('Salada Niçoise', 'Saladas', NULL),
  ('Saladas Verdes', 'Saladas', ARRAY['vegano', 'sem glúten']),
  ('Saladas Asiáticas', 'Saladas', ARRAY['vegano']),
  ('Saladas Cítricas', 'Saladas', ARRAY['vegano', 'sem glúten']),
  ('Tábule', 'Saladas', ARRAY['vegano', 'sem glúten']),
  
  -- Cheese and dairy
  ('Queijo Serra da Estrela', 'Queijos', NULL),
  ('Queijos Macios', 'Queijos', NULL),
  ('Queijos Curados', 'Queijos', NULL),
  ('Queijos de Cabra', 'Queijos', NULL),
  ('Queijos Azuis', 'Queijos', NULL),
  ('Queijos Duros', 'Queijos', NULL),
  ('Queijos Manchego', 'Queijos', NULL),
  
  -- Desserts
  ('Sobremesas de Goiabada', 'Sobremesas', NULL),
  ('Sobremesas de Frutas', 'Sobremesas', NULL),
  ('Sobremesas Leves', 'Sobremesas', NULL),
  ('Sobremesas Asiáticas', 'Sobremesas', NULL),
  ('Sobremesas Brasileiras', 'Sobremesas', NULL),
  ('Doce de Abóbora', 'Sobremesas', NULL),
  ('Doce de Leite', 'Sobremesas', ARRAY['sem glúten']),
  ('Goiabada com Queijo', 'Sobremesas', NULL),
  ('Frutas Secas', 'Sobremesas', ARRAY['vegano', 'sem glúten']),
  ('Chocolate', 'Sobremesas', NULL),
  ('Bolos', 'Sobremesas', NULL),
  ('Bolos Leves', 'Sobremesas', NULL),
  ('Pavê de Morango', 'Sobremesas', ARRAY['sem glúten']),
  ('Pudim de Leite', 'Sobremesas', ARRAY['sem glúten']),
  ('Panetone', 'Sobremesas', NULL),
  
  -- International dishes
  ('Pizza', 'Pizzas', NULL),
  ('Pizza Margherita', 'Pizzas', NULL),
  ('Pizza Vegetariana', 'Pizzas', ARRAY['vegetariano']),
  ('Dim Sum', 'Pratos Asiáticos', NULL),
  ('Pato à Pequim', 'Pratos Asiáticos', NULL),
  ('Curry Indiano', 'Pratos Asiáticos', NULL),
  ('Moussaka', 'Pratos Mediterrâneos', NULL),
  ('Goulash', 'Pratos Europeus', NULL),
  ('Kebabs', 'Pratos Mediterrâneos', NULL)
ON CONFLICT (name) DO UPDATE
SET 
  category = EXCLUDED.category,
  dietary_restrictions = EXCLUDED.dietary_restrictions;

-- Helper function to parse food pairings from CSV data and link them to grapes
CREATE OR REPLACE FUNCTION link_csv_food_pairings()
RETURNS void AS $$
DECLARE
  grape_record RECORD;
  food_record RECORD;
BEGIN
  -- For each grape, parse its food pairings and create relationships
  FOR grape_record IN SELECT id, name FROM grapes LOOP
    -- Find matching food pairings and create relationships
    FOR food_record IN 
      SELECT DISTINCT fp.id, fp.name 
      FROM food_pairings fp
    LOOP
      -- Insert relationship if description contains food pairing
      INSERT INTO grape_food_pairings (grape_id, food_pairing_id)
      SELECT grape_record.id, food_record.id
      WHERE EXISTS (
        SELECT 1 FROM grapes g
        WHERE g.id = grape_record.id
        AND g.description ILIKE '%' || food_record.name || '%'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the helper function
SELECT link_csv_food_pairings();

-- Drop the helper function
DROP FUNCTION link_csv_food_pairings();