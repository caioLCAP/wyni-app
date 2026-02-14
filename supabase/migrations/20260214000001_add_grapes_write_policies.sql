-- Add INSERT, UPDATE, and DELETE policies for authenticated users on grapes table
-- This allows logged-in users to add, modify, and delete wine entries

-- Policy for INSERT on grapes table
CREATE POLICY "Authenticated users can insert grapes"
  ON grapes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for UPDATE on grapes table  
CREATE POLICY "Authenticated users can update grapes"
  ON grapes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for DELETE on grapes table
CREATE POLICY "Authenticated users can delete grapes"
  ON grapes
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for grape_characteristics junction table
CREATE POLICY "Authenticated users can insert grape_characteristics"
  ON grape_characteristics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete grape_characteristics"
  ON grape_characteristics
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for grape_aromas junction table
CREATE POLICY "Authenticated users can insert grape_aromas"
  ON grape_aromas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete grape_aromas"
  ON grape_aromas
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for grape_regions junction table
CREATE POLICY "Authenticated users can insert grape_regions"
  ON grape_regions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete grape_regions"
  ON grape_regions
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for grape_food_pairings junction table
CREATE POLICY "Authenticated users can insert grape_food_pairings"
  ON grape_food_pairings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete grape_food_pairings"
  ON grape_food_pairings
  FOR DELETE
  TO authenticated
  USING (true);
