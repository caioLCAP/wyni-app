/*
  # Enable Row Level Security for wine database tables

  1. Security Updates
    - Enable RLS on all tables that don't have it enabled
    - Add public read policies for wine-related data
    - Ensure consistent security across all tables

  2. Tables Updated
    - grapes
    - grape_characteristics  
    - grape_regions
    - food_pairings
    - characteristics
    - aromas
    - grape_aromas
    - countries
    - grape_food_pairings
    - regions

  3. Policies Added
    - Public read access for all wine-related data
    - This allows the app to function without authentication for browsing
*/

-- Enable RLS on all tables
ALTER TABLE grapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grape_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grape_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE aromas ENABLE ROW LEVEL SECURITY;
ALTER TABLE grape_aromas ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE grape_food_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Create public read policies for all tables
CREATE POLICY "Public read access for grapes"
  ON grapes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for grape_characteristics"
  ON grape_characteristics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for grape_regions"
  ON grape_regions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for food_pairings"
  ON food_pairings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for characteristics"
  ON characteristics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for aromas"
  ON aromas
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for grape_aromas"
  ON grape_aromas
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for countries"
  ON countries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for grape_food_pairings"
  ON grape_food_pairings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for regions"
  ON regions
  FOR SELECT
  TO public
  USING (true);