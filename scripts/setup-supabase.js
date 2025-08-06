#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

// Load environment variables
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('.env file not found!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

// Create Supabase client with service role key
function createSupabaseClient(env) {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logError('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// Setup storage bucket
async function setupStorage(supabase) {
  logInfo('Setting up storage bucket...');
  
  const bucketName = 'bmw-csv-files';
  
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Create bucket
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: ['text/csv'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        logError(`Failed to create storage bucket: ${error.message}`);
        return false;
      }
      
      logSuccess('Storage bucket created successfully');
    } else {
      logSuccess('Storage bucket already exists');
    }

    // Setup storage policies
    const storagePolicies = [
      {
        name: 'Allow authenticated uploads',
        definition: `CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = '${bucketName}');`
      },
      {
        name: 'Allow authenticated downloads',
        definition: `CREATE POLICY "Allow authenticated downloads" ON storage.objects FOR SELECT USING (bucket_id = '${bucketName}');`
      },
      {
        name: 'Allow authenticated deletes',
        definition: `CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE USING (bucket_id = '${bucketName}');`
      },
      {
        name: 'Allow authenticated updates',
        definition: `CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE USING (bucket_id = '${bucketName}');`
      }
    ];

    for (const policy of storagePolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy.definition });
        if (error) {
          logWarning(`Policy "${policy.name}" may already exist: ${error.message}`);
        } else {
          logSuccess(`Policy "${policy.name}" created`);
        }
      } catch (err) {
        logWarning(`Could not create policy "${policy.name}": ${err.message}`);
      }
    }

    return true;
  } catch (error) {
    logError(`Storage setup failed: ${error.message}`);
    return false;
  }
}

// Setup database tables
async function setupDatabase(supabase) {
  logInfo('Setting up database tables...');
  
  const sqlCommands = [
    // Create tables
    `CREATE TABLE IF NOT EXISTS bmw_files (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      file_path VARCHAR(500) NOT NULL,
      file_url TEXT,
      file_size BIGINT NOT NULL,
      country VARCHAR(10) NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      month_name VARCHAR(20) NOT NULL,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      status VARCHAR(50) DEFAULT 'uploaded',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    `CREATE TABLE IF NOT EXISTS bmw_processed_data (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'latest',
      data JSONB NOT NULL,
      total_records INTEGER NOT NULL,
      processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    `CREATE TABLE IF NOT EXISTS bmw_metadata (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'latest',
      metadata JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    `CREATE TABLE IF NOT EXISTS bmw_compliance_history (
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
    );`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_bmw_files_country ON bmw_files(country);`,
    `CREATE INDEX IF NOT EXISTS idx_bmw_files_year_month ON bmw_files(year, month);`,
    `CREATE INDEX IF NOT EXISTS idx_bmw_files_uploaded_at ON bmw_files(uploaded_at);`,
    `CREATE INDEX IF NOT EXISTS idx_bmw_files_status ON bmw_files(status);`,
    
    `CREATE INDEX IF NOT EXISTS idx_compliance_history_market ON bmw_compliance_history(market_code);`,
    `CREATE INDEX IF NOT EXISTS idx_compliance_history_year_month ON bmw_compliance_history(year, month);`,
    `CREATE INDEX IF NOT EXISTS idx_compliance_history_created_at ON bmw_compliance_history(created_at);`,
    
    // Create updated_at trigger function
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';`,
    
    // Add triggers
    `DROP TRIGGER IF EXISTS update_bmw_files_updated_at ON bmw_files;
    CREATE TRIGGER update_bmw_files_updated_at 
      BEFORE UPDATE ON bmw_files 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    
    `DROP TRIGGER IF EXISTS update_bmw_processed_data_updated_at ON bmw_processed_data;
    CREATE TRIGGER update_bmw_processed_data_updated_at 
      BEFORE UPDATE ON bmw_processed_data 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    
    `DROP TRIGGER IF EXISTS update_bmw_metadata_updated_at ON bmw_metadata;
    CREATE TRIGGER update_bmw_metadata_updated_at 
      BEFORE UPDATE ON bmw_metadata 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    
    `DROP TRIGGER IF EXISTS update_compliance_history_updated_at ON bmw_compliance_history;
    CREATE TRIGGER update_compliance_history_updated_at 
      BEFORE UPDATE ON bmw_compliance_history 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    
    // Enable RLS
    `ALTER TABLE bmw_files ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE bmw_processed_data ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE bmw_metadata ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE bmw_compliance_history ENABLE ROW LEVEL SECURITY;`,
    
    // Create RLS policies for bmw_files
    `DROP POLICY IF EXISTS "Allow public read access to bmw_files" ON bmw_files;
    CREATE POLICY "Allow public read access to bmw_files" ON bmw_files FOR SELECT USING (true);`,
    
    `DROP POLICY IF EXISTS "Allow public insert access to bmw_files" ON bmw_files;
    CREATE POLICY "Allow public insert access to bmw_files" ON bmw_files FOR INSERT WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Allow public update access to bmw_files" ON bmw_files;
    CREATE POLICY "Allow public update access to bmw_files" ON bmw_files FOR UPDATE USING (true);`,
    
    `DROP POLICY IF EXISTS "Allow public delete access to bmw_files" ON bmw_files;
    CREATE POLICY "Allow public delete access to bmw_files" ON bmw_files FOR DELETE USING (true);`,
    
    // Create RLS policies for bmw_processed_data
    `DROP POLICY IF EXISTS "Allow public read access to bmw_processed_data" ON bmw_processed_data;
    CREATE POLICY "Allow public read access to bmw_processed_data" ON bmw_processed_data FOR SELECT USING (true);`,
    
    `DROP POLICY IF EXISTS "Allow public insert access to bmw_processed_data" ON bmw_processed_data;
    CREATE POLICY "Allow public insert access to bmw_processed_data" ON bmw_processed_data FOR INSERT WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Allow public update access to bmw_processed_data" ON bmw_processed_data;
    CREATE POLICY "Allow public update access to bmw_processed_data" ON bmw_processed_data FOR UPDATE USING (true);`,
    
    `DROP POLICY IF EXISTS "Allow public delete access to bmw_processed_data" ON bmw_processed_data;
    CREATE POLICY "Allow public delete access to bmw_processed_data" ON bmw_processed_data FOR DELETE USING (true);`,
    
    // Create RLS policies for bmw_metadata
    `DROP POLICY IF EXISTS "Allow public read access to bmw_metadata" ON bmw_metadata;
    CREATE POLICY "Allow public read access to bmw_metadata" ON bmw_metadata FOR SELECT USING (true);`,
    
    `DROP POLICY IF EXISTS "Allow public insert access to bmw_metadata" ON bmw_metadata;
    CREATE POLICY "Allow public insert access to bmw_metadata" ON bmw_metadata FOR INSERT WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Allow public update access to bmw_metadata" ON bmw_metadata;
    CREATE POLICY "Allow public update access to bmw_metadata" ON bmw_metadata FOR UPDATE USING (true);`,
    
    `DROP POLICY IF EXISTS "Allow public delete access to bmw_metadata" ON bmw_metadata;
    CREATE POLICY "Allow public delete access to bmw_metadata" ON bmw_metadata FOR DELETE USING (true);`,
    
    // Create RLS policies for bmw_compliance_history
    `DROP POLICY IF EXISTS "Allow public read access to compliance_history" ON bmw_compliance_history;
    CREATE POLICY "Allow public read access to compliance_history" ON bmw_compliance_history FOR SELECT USING (true);`,
    
    `DROP POLICY IF EXISTS "Allow public insert access to compliance_history" ON bmw_compliance_history;
    CREATE POLICY "Allow public insert access to compliance_history" ON bmw_compliance_history FOR INSERT WITH CHECK (true);`,
    
    `DROP POLICY IF EXISTS "Allow public update access to compliance_history" ON bmw_compliance_history;
    CREATE POLICY "Allow public update access to compliance_history" ON bmw_compliance_history FOR UPDATE USING (true);`,
    
    `DROP POLICY IF EXISTS "Allow public delete access to compliance_history" ON bmw_compliance_history;
    CREATE POLICY "Allow public delete access to compliance_history" ON bmw_compliance_history FOR DELETE USING (true);`
  ];

  try {
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
          logWarning(`SQL command ${i + 1} may have failed: ${error.message}`);
        } else {
          logSuccess(`SQL command ${i + 1} executed successfully`);
        }
      } catch (err) {
        logWarning(`Could not execute SQL command ${i + 1}: ${err.message}`);
      }
    }
    
    logSuccess('Database setup completed');
    return true;
  } catch (error) {
    logError(`Database setup failed: ${error.message}`);
    return false;
  }
}

// Main setup function
async function setupSupabase() {
  log('🚀 Setting up BMW Monthly Report Dashboard with Supabase...', 'bright');
  log('', 'reset');

  try {
    // Load environment variables
    logInfo('Loading environment variables...');
    const env = loadEnv();
    logSuccess('Environment variables loaded');

    // Create Supabase client
    logInfo('Creating Supabase client...');
    const supabase = createSupabaseClient(env);
    logSuccess('Supabase client created');

    // Setup storage
    const storageSuccess = await setupStorage(supabase);
    
    // Setup database
    const databaseSuccess = await setupDatabase(supabase);

    log('', 'reset');
    if (storageSuccess && databaseSuccess) {
      logSuccess('Supabase setup completed successfully!');
      log('', 'reset');
      log('🎯 Your BMW Dashboard is now ready to use!', 'bright');
      log('📱 Start the development server with: npm run dev', 'cyan');
    } else {
      logWarning('Supabase setup completed with some issues.');
      log('📱 You may need to manually configure some settings in your Supabase dashboard.', 'yellow');
    }

  } catch (error) {
    logError('Setup failed!');
    logError(error.message);
    process.exit(1);
  }
}

// Run the setup
setupSupabase(); 