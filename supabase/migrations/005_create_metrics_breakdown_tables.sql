-- Create tables for metrics breakdown and market totals

-- Table for market-level monthly totals
CREATE TABLE IF NOT EXISTS bmw_market_month_totals (
  id SERIAL PRIMARY KEY,
  market_code VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  media_cost DECIMAL(15,2) NOT NULL,
  impressions BIGINT NOT NULL,
  clicks BIGINT NOT NULL,
  iv BIGINT NOT NULL,
  nvwr BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(market_code, year, month)
);

-- Table for metrics breakdown by dimension
CREATE TABLE IF NOT EXISTS bmw_metrics_breakdown (
  id SERIAL PRIMARY KEY,
  market_code VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  dimension VARCHAR(50) NOT NULL,
  dimension_value VARCHAR(100) NOT NULL,
  media_cost DECIMAL(15,2) NOT NULL,
  impressions BIGINT NOT NULL,
  clicks BIGINT NOT NULL,
  iv BIGINT NOT NULL,
  nvwr BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(market_code, year, month, dimension, dimension_value)
);

-- Table for compliance breakdown history
CREATE TABLE IF NOT EXISTS bmw_compliance_breakdown_history (
  id SERIAL PRIMARY KEY,
  market_code VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  dimension VARCHAR(50) NOT NULL,
  total_records INTEGER NOT NULL,
  unmapped_records INTEGER NOT NULL,
  compliance_percentage DECIMAL(5,2) NOT NULL,
  total_nvwr DECIMAL(15,2) NOT NULL,
  unmapped_nvwr DECIMAL(15,2) NOT NULL,
  unmapped_nvwr_percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(market_code, year, month, dimension)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_totals_market ON bmw_market_month_totals(market_code);
CREATE INDEX IF NOT EXISTS idx_market_totals_year_month ON bmw_market_month_totals(year, month);

CREATE INDEX IF NOT EXISTS idx_metrics_breakdown_market ON bmw_metrics_breakdown(market_code);
CREATE INDEX IF NOT EXISTS idx_metrics_breakdown_year_month ON bmw_metrics_breakdown(year, month);
CREATE INDEX IF NOT EXISTS idx_metrics_breakdown_dimension ON bmw_metrics_breakdown(dimension);

CREATE INDEX IF NOT EXISTS idx_compliance_breakdown_market ON bmw_compliance_breakdown_history(market_code);
CREATE INDEX IF NOT EXISTS idx_compliance_breakdown_year_month ON bmw_compliance_breakdown_history(year, month);
CREATE INDEX IF NOT EXISTS idx_compliance_breakdown_dimension ON bmw_compliance_breakdown_history(dimension);

-- Triggers for updated_at
CREATE TRIGGER update_market_month_totals_updated_at
  BEFORE UPDATE ON bmw_market_month_totals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_breakdown_updated_at
  BEFORE UPDATE ON bmw_metrics_breakdown
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_breakdown_history_updated_at
  BEFORE UPDATE ON bmw_compliance_breakdown_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE bmw_market_month_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bmw_metrics_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE bmw_compliance_breakdown_history ENABLE ROW LEVEL SECURITY;

-- Policies for public access
CREATE POLICY "Allow public read access to market_month_totals" ON bmw_market_month_totals
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to market_month_totals" ON bmw_market_month_totals
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to market_month_totals" ON bmw_market_month_totals
  FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to market_month_totals" ON bmw_market_month_totals
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to metrics_breakdown" ON bmw_metrics_breakdown
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to metrics_breakdown" ON bmw_metrics_breakdown
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to metrics_breakdown" ON bmw_metrics_breakdown
  FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to metrics_breakdown" ON bmw_metrics_breakdown
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to compliance_breakdown_history" ON bmw_compliance_breakdown_history
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to compliance_breakdown_history" ON bmw_compliance_breakdown_history
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to compliance_breakdown_history" ON bmw_compliance_breakdown_history
  FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to compliance_breakdown_history" ON bmw_compliance_breakdown_history
  FOR DELETE USING (true);
