/*
  # Sistema de Vinhos Salvos e Favoritos

  1. Novas Tabelas
    - `saved_wines` - Vinhos salvos da análise de IA
    - `user_favorites` - Favoritos dos usuários

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados

  3. Funcionalidades
    - Salvar vinhos analisados pela IA
    - Sistema de favoritos
    - Histórico de vinhos salvos
*/

-- Tabela para vinhos salvos da IA
CREATE TABLE IF NOT EXISTS saved_wines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_name TEXT NOT NULL,
  winery TEXT,
  wine_type TEXT,
  vintage TEXT,
  region TEXT,
  country TEXT,
  grape_varieties TEXT[],
  alcohol_content TEXT,
  tasting_notes TEXT,
  food_pairings TEXT[],
  price_range TEXT,
  description TEXT,
  rating DECIMAL(2,1),
  image_url TEXT,
  ai_analysis JSONB, -- Dados completos da análise da IA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para favoritos dos usuários
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES saved_wines(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, wine_id)
);

-- Habilitar RLS
ALTER TABLE saved_wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas para saved_wines
CREATE POLICY "Users can view own saved wines"
  ON saved_wines
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved wines"
  ON saved_wines
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved wines"
  ON saved_wines
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved wines"
  ON saved_wines
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para user_favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para updated_at em saved_wines
CREATE TRIGGER update_saved_wines_updated_at
  BEFORE UPDATE ON saved_wines
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Índices para performance
CREATE INDEX idx_saved_wines_user_id ON saved_wines(user_id);
CREATE INDEX idx_saved_wines_created_at ON saved_wines(created_at DESC);
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_wine_id ON user_favorites(wine_id);