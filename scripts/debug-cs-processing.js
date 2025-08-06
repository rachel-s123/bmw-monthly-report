/**
 * Debug script to test CS file processing
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

try {
  config({ path: envPath });
} catch (error) {
  console.log('No .env file found, using default values');
}

// Supabase configuration for Node.js
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gggzidmccdxfidrbutbd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔧 Supabase Configuration Debug:');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'NOT SET');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugCSProcessing() {
  console.log('🔍 Debugging CS File Processing...\n');

  try {
    // Step 1: Get CS files from database
    console.log('📁 Step 1: Getting CS files from database...');
    const { data: csFiles, error: filesError } = await supabase
      .from('bmw_files')
      .select('*')
      .eq('country', 'CS')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (filesError) {
      console.error('❌ Error getting CS files:', filesError);
      return;
    }

    console.log(`✅ Found ${csFiles.length} CS files in database`);
    console.log('CS Files:', csFiles.map(f => `${f.filename} (${f.status})`));
    console.log('');

    // Step 2: Test processing a single CS file
    if (csFiles.length > 0) {
      const testFile = csFiles[0]; // Use the first CS file
      console.log(`🧪 Step 2: Testing processing for ${testFile.filename}...`);
      
      // Get the file content from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('bmw-csv-files')
        .download(testFile.file_path);

      if (downloadError) {
        console.error('❌ Error downloading file:', downloadError);
        return;
      }

      if (!fileData) {
        console.error('❌ No file data received');
        return;
      }

      // Convert to text
      const csvText = await fileData.text();
      console.log(`✅ Downloaded file: ${csvText.length} characters`);
      
      // Show first few lines
      const lines = csvText.split('\n');
      console.log('📋 First 5 lines of CSV:');
      lines.slice(0, 5).forEach((line, index) => {
        console.log(`${index + 1}: ${line}`);
      });
      console.log('');

      // Parse CSV to check structure
      const Papa = await import('papaparse');
      const { data: parsedData, errors } = Papa.default.parse(csvText, {
        header: true,
        skipEmptyLines: true
      });

      console.log(`✅ Parsed CSV: ${parsedData.length} rows`);
      if (errors.length > 0) {
        console.log('⚠️ CSV parsing errors:', errors);
      }

      // Check data structure
      if (parsedData.length > 0) {
        const firstRow = parsedData[0];
        console.log('📊 First row structure:', Object.keys(firstRow));
        console.log('📊 Sample data:', {
          Country: firstRow.Country,
          'Media Cost': firstRow['Media Cost'],
          Impressions: firstRow.Impressions,
          dimension: testFile.dimension
        });
      }
      console.log('');

      // Step 3: Test the processing function
      console.log('🔄 Step 3: Testing processing function...');
      try {
        const { processCSVFileFromSupabase } = await import('../src/utils/supabaseCsvProcessor.js');
        
        // Create a mock file record
        const mockFileRecord = {
          ...testFile,
          file_path: testFile.file_path
        };

        const result = await processCSVFileFromSupabase(mockFileRecord);
        console.log('✅ Processing result:', result);
      } catch (processError) {
        console.error('❌ Processing error:', processError);
      }
    }

    // Step 4: Check current processed data
    console.log('📊 Step 4: Checking current processed data...');
    const { data: processedData, error: dataError } = await supabase
      .from('bmw_processed_data')
      .select('data')
      .eq('id', 'latest')
      .single();

    if (dataError) {
      console.error('❌ Error getting processed data:', dataError);
    } else if (processedData && processedData.data) {
      const countries = [...new Set(processedData.data.map(row => row.country))];
      console.log('✅ Countries in processed data:', countries);
      
      const csRecords = processedData.data.filter(row => row.country === 'CS');
      console.log(`✅ CS records in processed data: ${csRecords.length}`);
      
      if (csRecords.length > 0) {
        console.log('📊 Sample CS record:', {
          country: csRecords[0].country,
          dimension: csRecords[0].dimension,
          year: csRecords[0].year,
          month: csRecords[0].month,
          'Media Cost': csRecords[0]['Media Cost']
        });
      }
    }

    console.log('\n🎉 Debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugCSProcessing(); 