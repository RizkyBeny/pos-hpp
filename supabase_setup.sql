-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Ingredients Table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  buy_price DECIMAL NOT NULL,
  buy_quantity DECIMAL NOT NULL,
  buy_unit TEXT NOT NULL,
  weight_per_unit DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Makanan', 'Minuman')),
  portions INTEGER NOT NULL DEFAULT 1,
  margin_percentage INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recipe Ingredients (Many-to-Many)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recipe Overheads
CREATE TABLE IF NOT EXISTS recipe_overheads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost DECIMAL NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional for now to keep it simple, 
-- but recommended once Auth is implemented.
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_overheads ENABLE ROW LEVEL SECURITY;

-- Create simple "Allow All" policies for testing (REMOVE THIS IN PRODUCTION)
CREATE POLICY "Allow All" ON ingredients FOR ALL USING (true);
CREATE POLICY "Allow All" ON recipes FOR ALL USING (true);
CREATE POLICY "Allow All" ON recipe_ingredients FOR ALL USING (true);
CREATE POLICY "Allow All" ON recipe_overheads FOR ALL USING (true);
