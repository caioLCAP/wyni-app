-- Add new optional columns to grapes table for detailed wine information
ALTER TABLE grapes
ADD COLUMN IF NOT EXISTS vintage TEXT,
ADD COLUMN IF NOT EXISTS producer TEXT,
ADD COLUMN IF NOT EXISTS alcohol_content TEXT,
ADD COLUMN IF NOT EXISTS serving_temperature TEXT,
ADD COLUMN IF NOT EXISTS aging_potential TEXT,
ADD COLUMN IF NOT EXISTS price TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to document the purpose of these columns
COMMENT ON COLUMN grapes.vintage IS 'Year or vintage of the wine (e.g., "2020")';
COMMENT ON COLUMN grapes.producer IS 'Producer or winery name';
COMMENT ON COLUMN grapes.alcohol_content IS 'Alcohol content percentage (e.g., "13.5%")';
COMMENT ON COLUMN grapes.serving_temperature IS 'Recommended serving temperature (e.g., "16-18°C")';
COMMENT ON COLUMN grapes.aging_potential IS 'Aging potential in years (e.g., "5-10 anos")';
COMMENT ON COLUMN grapes.price IS 'Price of the wine (e.g., "R$ 150,00")';
COMMENT ON COLUMN grapes.image_url IS 'URL of the wine bottle image in Supabase Storage';
