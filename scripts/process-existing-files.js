#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

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

// Create Supabase client
function createSupabaseClient(env) {
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logError('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// Process existing files
async function processExistingFiles() {
  log('🔄 Processing existing uploaded files...', 'bright');
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

    // Get all files from the database
    logInfo('Fetching uploaded files from database...');
    const { data: files, error: filesError } = await supabase
      .from('bmw_files')
      .select('*')
      .order('uploaded_at', { ascending: true });

    if (filesError) {
      logError(`Failed to fetch files: ${filesError.message}`);
      return;
    }

    if (!files || files.length === 0) {
      logInfo('No files found in database');
      return;
    }

    logSuccess(`Found ${files.length} files to process`);

    // Process each file
    for (const file of files) {
      logInfo(`Processing file: ${file.filename}`);
      
      try {
        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('bmw-csv-files')
          .download(file.file_path);

        if (downloadError) {
          logError(`Failed to download ${file.filename}: ${downloadError.message}`);
          continue;
        }

        // Convert to text
        const csvText = await fileData.text();
        
        // Parse CSV data
        const { data: parsedData, errors } = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });

        if (errors.length > 0) {
          logError(`CSV parsing errors for ${file.filename}:`, errors);
          continue;
        }

        logSuccess(`Parsed ${parsedData.length} records from ${file.filename}`);

        // Update file status
        await supabase
          .from('bmw_files')
          .update({ status: 'processed' })
          .eq('id', file.id);

      } catch (error) {
        logError(`Error processing ${file.filename}: ${error.message}`);
      }
    }

    // Aggregate all data
    logInfo('Aggregating all processed data...');
    
    // Get all processed files
    const { data: processedFiles } = await supabase
      .from('bmw_files')
      .select('*')
      .eq('status', 'processed');

    if (processedFiles && processedFiles.length > 0) {
      let allData = [];
      
      for (const file of processedFiles) {
        const { data: fileData } = await supabase.storage
          .from('bmw-csv-files')
          .download(file.file_path);
        
        if (fileData) {
          const csvText = await fileData.text();
          const { data: parsedData } = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
          });
          
          // Add metadata fields to each record
          const enrichedData = parsedData.map(row => ({
            ...row,
            file_source: file.filename,
            country: file.country,
            dimension: file.dimension,
            year: file.year,
            month: file.month
          }));
          
          allData = allData.concat(enrichedData);
        }
      }

      // Save aggregated data
      const { error: saveError } = await supabase
        .from('bmw_processed_data')
        .upsert({
          id: 'latest',
          data: allData,
          total_records: allData.length,
          processed_at: new Date().toISOString()
        });

      if (saveError) {
        logError(`Failed to save processed data: ${saveError.message}`);
      } else {
        logSuccess(`Saved ${allData.length} total records to database`);
      }

      // Generate and save metadata
      const metadata = {
        total_files: processedFiles.length,
        total_records: allData.length,
        countries: [...new Set(allData.map(row => row.Country || row.country))],
        date_range: {
          start: new Date().toISOString(),
          end: new Date().toISOString()
        },
        last_processed: new Date().toISOString()
      };

      const { error: metadataError } = await supabase
        .from('bmw_metadata')
        .upsert({
          id: 'latest',
          metadata: metadata
        });

      if (metadataError) {
        logError(`Failed to save metadata: ${metadataError.message}`);
      } else {
        logSuccess('Metadata saved successfully');
      }
    }

    logSuccess('All files processed successfully!');
    log('', 'reset');
    log('🎯 Your BMW Dashboard should now show the data!', 'bright');

  } catch (error) {
    logError('Processing failed!');
    logError(error.message);
    process.exit(1);
  }
}

// Run the processing
processExistingFiles(); 