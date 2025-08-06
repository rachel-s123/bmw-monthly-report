#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables from the project root BEFORE importing any other modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

// Debug environment variables
console.log('Environment check:');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

// Now import modules after environment is loaded
import { processAllMonthsCompliance } from '../src/utils/autoComplianceProcessor.js';

async function runCompliance() {
  console.log('🔄 Running compliance processing...');
  
  try {
    // First check what's in the processed data table
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: processedData, error } = await supabase
      .from('bmw_processed_data')
      .select('*')
      .eq('id', 'latest')
      .single();
    
    if (error) {
      console.error('❌ Error fetching processed data:', error);
      return;
    }
    
    if (!processedData) {
      console.log('ℹ️ No processed data found');
      return;
    }
    
    console.log('✅ Found processed data:');
    console.log('- Total records:', processedData.total_records);
    console.log('- Has data field:', !!processedData.data);
    console.log('- Data length:', processedData.data?.length);
    
    // Force the compliance processor to use the same client
    const { processAllMonthsCompliance } = await import('../src/utils/autoComplianceProcessor.js');
    const result = await processAllMonthsCompliance();
    console.log('✅ Compliance processing completed:', result);
  } catch (error) {
    console.error('❌ Compliance processing failed:', error);
  }
}

runCompliance(); 