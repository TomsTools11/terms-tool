-- Create terms table for shared glossary
CREATE TABLE IF NOT EXISTS terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  acronym TEXT,
  definition TEXT NOT NULL,
  category TEXT,
  related_terms TEXT[],
  calculation TEXT,
  confidence INTEGER,
  source_context TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_terms_term ON terms(term);
CREATE INDEX IF NOT EXISTS idx_terms_definition ON terms USING gin(to_tsvector('english', definition));

-- Enable Row Level Security
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read all terms (shared glossary)
CREATE POLICY "Anyone can read terms" ON terms
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Anyone authenticated can insert terms
CREATE POLICY "Anyone can insert terms" ON terms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Anyone authenticated can update terms
CREATE POLICY "Anyone can update terms" ON terms
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Anyone authenticated can delete terms
CREATE POLICY "Anyone can delete terms" ON terms
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_terms_updated_at
  BEFORE UPDATE ON terms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
