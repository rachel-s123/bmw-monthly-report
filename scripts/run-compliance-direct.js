#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

// Create Supabase client directly
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runComplianceDirect() {
  console.log('🔄 Running compliance processing directly...');
  
  try {
    // Get all processed data
    const { data: processedData, error } = await supabase
      .from('bmw_processed_data')
      .select('data')
      .eq('id', 'latest')
      .single();

    if (error) {
      console.error('❌ Error fetching processed data:', error);
      return;
    }

    if (!processedData || !processedData.data) {
      console.log('ℹ️ No processed data found');
      return;
    }

    console.log(`✅ Found ${processedData.data.length} records to process`);

    // Group data by market, year, and month
    const dataByPeriod = {};
    
    processedData.data.forEach(record => {
      if (record.file_source && record.year && record.month) {
        // Determine market code: prefer `country` metadata, fallback to filename
        const marketCode = record.country || record.file_source?.match(/BMW_([A-Z]{2})_[A-Za-z]+_\d{4}_\d{2}\.csv/)?.[1] || record.file_source?.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/)?.[1];
        if (marketCode) {
          const key = `${marketCode}_${record.year}_${record.month}`;
          if (!dataByPeriod[key]) {
            dataByPeriod[key] = [];
          }
          dataByPeriod[key].push(record);
        }
      }
    });

    console.log(`📊 Found data for ${Object.keys(dataByPeriod).length} periods:`, Object.keys(dataByPeriod));

    // Import the compliance analysis function
    const { analyzeOnebuilderCompliance } = await import('../src/utils/onebuilderCompliance.js');
    const { saveComplianceHistory, getMonthName } = await import('../src/utils/complianceHistory.js');

    // Process each period
    const results = [];
    for (const [key, periodData] of Object.entries(dataByPeriod)) {
      try {
        const [marketCode, year, month] = key.split('_');
        const monthName = getMonthName(parseInt(month));
        
        console.log(`📊 Processing ${marketCode} ${monthName} ${year} (${periodData.length} records)`);
        
        // Analyze compliance for this period
        const compliance = analyzeOnebuilderCompliance(periodData);
        
        // Save to history
        await saveComplianceHistory(compliance.marketCompliance, parseInt(year), parseInt(month), monthName);
        
        results.push({
          period: key,
          success: true,
          records: periodData.length,
          markets: compliance.marketCompliance.length
        });
        
        console.log(`✅ Saved compliance for ${marketCode} ${monthName} ${year}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${key}:`, error);
        results.push({
          period: key,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`✅ Compliance processing complete: ${successCount}/${totalCount} periods processed successfully`);
    
    return {
      success: true,
      message: `Processed ${successCount}/${totalCount} periods successfully`,
      results
    };

  } catch (error) {
    console.error('❌ Error in compliance processing:', error);
    return { success: false, error: error.message };
  }
}

runComplianceDirect(); 