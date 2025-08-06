-- Create table for storing historical dimension coverage data
CREATE TABLE IF NOT EXISTS bmw_dimension_coverage_history (
  id SERIAL PRIMARY KEY,
  market_code VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  dimension VARCHAR(50) NOT NULL,
  overall_coverage DECIMAL(5,2) NOT NULL,
  media_cost_gap DECIMAL(5,2) NOT NULL,
  impressions_gap DECIMAL(5,2) NOT NULL,
  clicks_gap DECIMAL(5,2) NOT NULL,
  iv_gap DECIMAL(5,2) NOT NULL,
  nvwr_gap DECIMAL(5,2) NOT NULL,
  total_missing_media_cost DECIMAL(15,2) NOT NULL,
  total_missing_impressions INTEGER NOT NULL,
  total_missing_clicks INTEGER NOT NULL,
  total_missing_iv INTEGER NOT NULL,
  total_missing_nvwr INTEGER NOT NULL,
  all_media_cost DECIMAL(15,2) NOT NULL,
  all_impressions INTEGER NOT NULL,
  all_clicks INTEGER NOT NULL,
  all_iv INTEGER NOT NULL,
  all_nvwr INTEGER NOT NULL,
  dimension_media_cost DECIMAL(15,2) NOT NULL,
  dimension_impressions INTEGER NOT NULL,
  dimension_clicks INTEGER NOT NULL,
  dimension_iv INTEGER NOT NULL,
  dimension_nvwr INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(market_code, year, month, dimension)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dimension_coverage_history_market ON bmw_dimension_coverage_history(market_code);
CREATE INDEX IF NOT EXISTS idx_dimension_coverage_history_year_month ON bmw_dimension_coverage_history(year, month);
CREATE INDEX IF NOT EXISTS idx_dimension_coverage_history_dimension ON bmw_dimension_coverage_history(dimension);
CREATE INDEX IF NOT EXISTS idx_dimension_coverage_history_created_at ON bmw_dimension_coverage_history(created_at);

-- Add trigger to update updated_at column
CREATE TRIGGER update_dimension_coverage_history_updated_at 
  BEFORE UPDATE ON bmw_dimension_coverage_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE bmw_dimension_coverage_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to dimension_coverage_history" ON bmw_dimension_coverage_history
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to dimension_coverage_history" ON bmw_dimension_coverage_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to dimension_coverage_history" ON bmw_dimension_coverage_history
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to dimension_coverage_history" ON bmw_dimension_coverage_history
  FOR DELETE USING (true); 