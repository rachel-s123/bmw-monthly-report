-- Create table for storing historical compliance data
CREATE TABLE IF NOT EXISTS bmw_compliance_history (
  id SERIAL PRIMARY KEY,
  market_code VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  total_records INTEGER NOT NULL,
  mapped_records INTEGER NOT NULL,
  unmapped_records INTEGER NOT NULL,
  compliance_percentage DECIMAL(5,2) NOT NULL,
  total_nvwr DECIMAL(15,2) NOT NULL,
  unmapped_nvwr DECIMAL(15,2) NOT NULL,
  unmapped_nvwr_percentage DECIMAL(5,2) NOT NULL,
  unmapped_by_field JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(market_code, year, month)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_compliance_history_market ON bmw_compliance_history(market_code);
CREATE INDEX IF NOT EXISTS idx_compliance_history_year_month ON bmw_compliance_history(year, month);
CREATE INDEX IF NOT EXISTS idx_compliance_history_created_at ON bmw_compliance_history(created_at);

-- Add trigger to update updated_at column
CREATE TRIGGER update_compliance_history_updated_at 
  BEFORE UPDATE ON bmw_compliance_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE bmw_compliance_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to compliance_history" ON bmw_compliance_history
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to compliance_history" ON bmw_compliance_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to compliance_history" ON bmw_compliance_history
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to compliance_history" ON bmw_compliance_history
  FOR DELETE USING (true); 