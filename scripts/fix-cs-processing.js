/**
 * Fix CS file processing by ensuring data is properly included
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

async function fixCSProcessing() {
  console.log('🔧 Fixing CS File Processing...\n');

  try {
    // Step 1: Clear existing processed data
    console.log('🗑️ Step 1: Clearing existing processed data...');
    const { error: clearError } = await supabase
      .from('bmw_processed_data')
      .delete()
      .eq('id', 'latest');

    if (clearError) {
      console.error('❌ Error clearing processed data:', clearError);
    } else {
      console.log('✅ Cleared existing processed data');
    }
    console.log('');

    // Step 2: Clear existing metadata
    console.log('🗑️ Step 2: Clearing existing metadata...');
    const { error: metadataError } = await supabase
      .from('bmw_metadata')
      .delete()
      .eq('id', 'latest');

    if (metadataError) {
      console.error('❌ Error clearing metadata:', metadataError);
    } else {
      console.log('✅ Cleared existing metadata');
    }
    console.log('');

    // Step 3: Clear dimension coverage history
    console.log('🗑️ Step 3: Clearing dimension coverage history...');
    const { error: historyError } = await supabase
      .from('bmw_dimension_coverage_history')
      .delete()
      .neq('id', 0); // Delete all records

    if (historyError) {
      console.error('❌ Error clearing dimension coverage history:', historyError);
    } else {
      console.log('✅ Cleared existing dimension coverage history');
    }
    console.log('');

    // Step 4: Re-process all files
    console.log('🔄 Step 4: Re-processing all files...');
    console.log('⚠️ Please run "Process All Files" in the frontend now to re-process all data including CS files.');
    console.log('');

    // Step 5: Verify CS files are ready for processing
    console.log('📋 Step 5: Verifying CS files are ready...');
    const { data: csFiles, error: filesError } = await supabase
      .from('bmw_files')
      .select('*')
      .eq('country', 'CS')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (filesError) {
      console.error('❌ Error getting CS files:', filesError);
    } else {
      console.log(`✅ Found ${csFiles.length} CS files ready for processing:`);
      csFiles.forEach(file => {
        console.log(`   - ${file.filename} (${file.status})`);
      });
    }
    console.log('');

    console.log('🎉 CS Processing Fix Completed!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Go to the frontend application');
    console.log('2. Click "Process All Files" button');
    console.log('3. Wait for processing to complete');
    console.log('4. Check that CS data appears in dimension coverage analysis');
    console.log('');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixCSProcessing(); 