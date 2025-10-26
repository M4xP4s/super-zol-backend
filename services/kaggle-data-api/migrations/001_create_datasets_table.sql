-- Create datasets table for storing Kaggle dataset metadata

CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  source_url VARCHAR(1024),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster queries
CREATE INDEX IF NOT EXISTS idx_datasets_name ON datasets(name);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets(created_at);

-- Create trigger to automatically update updated_at on row updates
CREATE OR REPLACE FUNCTION update_datasets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_datasets_updated_at_trigger
BEFORE UPDATE ON datasets
FOR EACH ROW
EXECUTE FUNCTION update_datasets_updated_at();
