-- Add dimension field to existing bmw_files table
-- This migration adds support for the new multi-file structure where each market/month has separate CSV files for different dimensions

-- Add dimension column to bmw_files table
ALTER TABLE bmw_files ADD COLUMN IF NOT EXISTS dimension VARCHAR(50);

-- Update existing records to have a default dimension value
-- Since old files didn't have dimensions, we'll set them to 'Legacy' to distinguish them
UPDATE bmw_files SET dimension = 'Legacy' WHERE dimension IS NULL;

-- Make dimension column NOT NULL after setting default values
ALTER TABLE bmw_files ALTER COLUMN dimension SET NOT NULL;

-- Create index for dimension field for better query performance
CREATE INDEX IF NOT EXISTS idx_bmw_files_dimension ON bmw_files(dimension);

-- Create composite index for country, dimension, year, month for efficient filtering
CREATE INDEX IF NOT EXISTS idx_bmw_files_country_dimension_year_month ON bmw_files(country, dimension, year, month); 