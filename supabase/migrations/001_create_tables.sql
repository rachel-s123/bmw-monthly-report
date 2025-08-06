-- Create tables for BMW CSV file management

-- Files table to store uploaded CSV file metadata
CREATE TABLE IF NOT EXISTS bmw_files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(500) NOT NULL,
  file_url TEXT,
  file_size BIGINT NOT NULL,
  country VARCHAR(10) NOT NULL,
  dimension VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processed data table to store the combined CSV data
CREATE TABLE IF NOT EXISTS bmw_processed_data (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'latest',
  data JSONB NOT NULL,
  total_records INTEGER NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metadata table to store processing metadata
CREATE TABLE IF NOT EXISTS bmw_metadata (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'latest',
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bmw_files_country ON bmw_files(country);
CREATE INDEX IF NOT EXISTS idx_bmw_files_year_month ON bmw_files(year, month);
CREATE INDEX IF NOT EXISTS idx_bmw_files_uploaded_at ON bmw_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_bmw_files_status ON bmw_files(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at columns
CREATE TRIGGER update_bmw_files_updated_at 
  BEFORE UPDATE ON bmw_files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bmw_processed_data_updated_at 
  BEFORE UPDATE ON bmw_processed_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bmw_metadata_updated_at 
  BEFORE UPDATE ON bmw_metadata 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE bmw_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE bmw_processed_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE bmw_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your security requirements)
CREATE POLICY "Allow public read access to bmw_files" ON bmw_files
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to bmw_files" ON bmw_files
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to bmw_files" ON bmw_files
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to bmw_files" ON bmw_files
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to bmw_processed_data" ON bmw_processed_data
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to bmw_processed_data" ON bmw_processed_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to bmw_processed_data" ON bmw_processed_data
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to bmw_processed_data" ON bmw_processed_data
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to bmw_metadata" ON bmw_metadata
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to bmw_metadata" ON bmw_metadata
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to bmw_metadata" ON bmw_metadata
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to bmw_metadata" ON bmw_metadata
  FOR DELETE USING (true); 