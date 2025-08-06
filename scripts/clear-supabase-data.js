#!/usr/bin/env node

/**
 * Script to clear all current data from Supabase
 * This will remove all files, processed data, and metadata
 * Use this before uploading the new multi-file structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name
const STORAGE_BUCKET = 'bmw-csv-files';

// Database table names
const TABLES = {
  FILES: 'bmw_files',
  PROCESSED_DATA: 'bmw_processed_data',
  METADATA: 'bmw_metadata',
  COMPLIANCE_HISTORY: 'bmw_compliance_history',
  KPI_HISTORY: 'bmw_kpi_history'
};

/**
 * Clear all data from Supabase
 */
async function clearAllData() {
  console.log('🚀 Starting Supabase data cleanup...');
  
  try {
    // Step 1: Get all file records
    console.log('📁 Fetching file records...');
    const { data: files, error: filesError } = await supabase
      .from(TABLES.FILES)
      .select('*');

    if (filesError) {
      throw new Error(`Error fetching files: ${filesError.message}`);
    }

    console.log(`📊 Found ${files?.length || 0} file records`);

    // Step 2: Delete all files from storage
    if (files && files.length > 0) {
      console.log('🗑️ Deleting files from storage...');
      const filePaths = files.map(f => f.file_path);
      
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(filePaths);

      if (storageError) {
        console.warn('⚠️ Warning: Could not delete all files from storage:', storageError.message);
        console.log('ℹ️ This might be due to RLS policies. Files may need to be deleted manually.');
      } else {
        console.log(`✅ Deleted ${filePaths.length} files from storage`);
      }
    }

    // Step 3: Clear database tables
    console.log('🗑️ Clearing database tables...');
    
    // Clear processed data
    const { error: processedDataError } = await supabase
      .from(TABLES.PROCESSED_DATA)
      .delete()
      .neq('id', 0);

    if (processedDataError) {
      throw new Error(`Error clearing processed data: ${processedDataError.message}`);
    }
    console.log('✅ Cleared processed data table');

    // Clear metadata
    const { error: metadataError } = await supabase
      .from(TABLES.METADATA)
      .delete()
      .neq('id', 0);

    if (metadataError) {
      throw new Error(`Error clearing metadata: ${metadataError.message}`);
    }
    console.log('✅ Cleared metadata table');

    // Clear compliance history
    const { error: complianceError } = await supabase
      .from(TABLES.COMPLIANCE_HISTORY)
      .delete()
      .neq('id', 0);

    if (complianceError) {
      throw new Error(`Error clearing compliance history: ${complianceError.message}`);
    }
    console.log('✅ Cleared compliance history table');

    // Clear KPI history
    const { error: kpiError } = await supabase
      .from(TABLES.KPI_HISTORY)
      .delete()
      .neq('id', 0);

    if (kpiError) {
      throw new Error(`Error clearing KPI history: ${kpiError.message}`);
    }
    console.log('✅ Cleared KPI history table');

    // Clear files
    const { error: filesDeleteError } = await supabase
      .from(TABLES.FILES)
      .delete()
      .neq('id', 0);

    if (filesDeleteError) {
      throw new Error(`Error clearing files table: ${filesDeleteError.message}`);
    }
    console.log('✅ Cleared files table');

    console.log('\n✅ Supabase data cleanup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Upload your new multi-file CSV structure');
    console.log('   2. The system will automatically process the new format');
    console.log('   3. All data will be organized by market, month, and dimension');

  } catch (error) {
    console.error('❌ Error during data cleanup:', error.message);
    process.exit(1);
  }
}

/**
 * Verify data has been cleared
 */
async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup...');
  
  try {
    // Check files table
    const { data: files, error: filesError } = await supabase
      .from(TABLES.FILES)
      .select('count')
      .limit(1);

    if (filesError) {
      console.warn('⚠️ Could not verify files table:', filesError.message);
    } else {
      console.log(`📁 Files table: ${files?.length || 0} records remaining`);
    }

    // Check processed data table
    const { data: processedData, error: processedError } = await supabase
      .from(TABLES.PROCESSED_DATA)
      .select('count')
      .limit(1);

    if (processedError) {
      console.warn('⚠️ Could not verify processed data table:', processedError.message);
    } else {
      console.log(`📊 Processed data table: ${processedData?.length || 0} records remaining`);
    }

    // Check metadata table
    const { data: metadata, error: metadataError } = await supabase
      .from(TABLES.METADATA)
      .select('count')
      .limit(1);

    if (metadataError) {
      console.warn('⚠️ Could not verify metadata table:', metadataError.message);
    } else {
      console.log(`📋 Metadata table: ${metadata?.length || 0} records remaining`);
    }

    console.log('✅ Cleanup verification completed');

  } catch (error) {
    console.warn('⚠️ Could not complete verification:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('⚠️ WARNING: This will delete ALL data from Supabase!');
  console.log('This action cannot be undone.');
  console.log('');
  
  // Simple confirmation prompt
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question('Type "YES" to confirm deletion: ', resolve);
  });

  rl.close();

  if (answer !== 'YES') {
    console.log('❌ Deletion cancelled');
    process.exit(0);
  }

  await clearAllData();
  await verifyCleanup();
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 