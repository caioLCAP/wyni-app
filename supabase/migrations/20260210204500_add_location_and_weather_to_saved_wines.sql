-- Adicionar colunas de localização, clima e momento para a tabela saved_wines
ALTER TABLE saved_wines ADD COLUMN IF NOT EXISTS weather TEXT;
ALTER TABLE saved_wines ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE saved_wines ADD COLUMN IF NOT EXISTS location_country TEXT;
ALTER TABLE saved_wines ADD COLUMN IF NOT EXISTS moment_type TEXT;
