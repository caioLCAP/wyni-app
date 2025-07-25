-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create countries table
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create regions table
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country_id UUID REFERENCES countries(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(name, country_id)
);

-- Create characteristics table
CREATE TABLE characteristics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- body, tannins, acidity, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create aromas table
CREATE TABLE aromas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- fruits, flowers, spices, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create food_pairings table
CREATE TABLE food_pairings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- meat, seafood, vegetarian, vegan, etc.
  dietary_restrictions TEXT[], -- vegan, gluten-free, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create grapes table
CREATE TABLE grapes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- Red, White, Rosé, etc.
  origin_country_id UUID REFERENCES countries(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create grape_characteristics junction table
CREATE TABLE grape_characteristics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grape_id UUID REFERENCES grapes(id) ON DELETE CASCADE,
  characteristic_id UUID REFERENCES characteristics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(grape_id, characteristic_id)
);

-- Create grape_aromas junction table
CREATE TABLE grape_aromas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grape_id UUID REFERENCES grapes(id) ON DELETE CASCADE,
  aroma_id UUID REFERENCES aromas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(grape_id, aroma_id)
);

-- Create grape_food_pairings junction table
CREATE TABLE grape_food_pairings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grape_id UUID REFERENCES grapes(id) ON DELETE CASCADE,
  food_pairing_id UUID REFERENCES food_pairings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(grape_id, food_pairing_id)
);

-- Create grape_regions junction table
CREATE TABLE grape_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grape_id UUID REFERENCES grapes(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(grape_id, region_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_grapes_type ON grapes(type);
CREATE INDEX idx_characteristics_category ON characteristics(category);
CREATE INDEX idx_aromas_category ON aromas(category);
CREATE INDEX idx_food_pairings_category ON food_pairings(category);
CREATE INDEX idx_food_pairings_dietary ON food_pairings USING GIN(dietary_restrictions);