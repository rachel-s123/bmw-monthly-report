const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSupabaseData() {
  try {
    console.log('🔍 Checking Supabase data...');
    
    // Check processed_data table
    const { data: processedData, error: processedError } = await supabase
      .from('processed_data')
      .select('year, month, file_source');
    
    if (processedError) {
      console.error('❌ Error querying processed_data:', processedError);
      return;
    }
    
    console.log('✅ Processed data records:', processedData?.length || 0);
    
    if (processedData && processedData.length > 0) {
      // Get unique year-month combinations
      const yearMonths = processedData.map(row => ({
        year: row.year,
        month: row.month,
        monthStr: `${row.year}-${row.month.toString().padStart(2, '0')}`,
        file_source: row.file_source
      }));
      
      const uniqueMonths = [...new Set(yearMonths.map(ym => ym.monthStr))].sort();
      console.log('📅 Available months:', uniqueMonths);
      
      // Show sample data
      console.log('📊 Sample records:');
      yearMonths.slice(0, 5).forEach(ym => {
        console.log(`  ${ym.monthStr}: ${ym.file_source}`);
      });
      
      // Check for June 2025 specifically
      const june2025 = yearMonths.filter(ym => ym.monthStr === '2025-06');
      console.log('🔍 June 2025 records:', june2025.length);
      if (june2025.length > 0) {
        console.log('📋 June 2025 files:', june2025.map(ym => ym.file_source));
      }
    }
    
    // Check raw_data table
    const { data: rawData, error: rawError } = await supabase
      .from('raw_data')
      .select('file_name, created_at');
    
    if (rawError) {
      console.error('❌ Error querying raw_data:', rawError);
    } else {
      console.log('📁 Raw data files:', rawData?.length || 0);
      if (rawData && rawData.length > 0) {
        console.log('📋 Raw files:');
        rawData.forEach(file => {
          console.log(`  ${file.file_name} (${file.created_at})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSupabaseData(); 