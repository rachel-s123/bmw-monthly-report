import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugMoMCalculation() {
  console.log('🔍 Debugging MoM calculation...');
  
  try {
    // 1. Get historical compliance data
    console.log('\n1. Fetching historical compliance data...');
    const { data: historicalData, error: historyError } = await supabase
      .from('bmw_compliance_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('❌ Error fetching historical data:', historyError);
      return;
    }

    console.log(`✅ Found ${historicalData.length} historical records:`);
    historicalData.forEach(record => {
      console.log(`  - ${record.market_code} ${record.month_name} ${record.year}: ${record.compliance_percentage}%`);
    });

    // 2. Get current processed data
    console.log('\n2. Fetching current processed data...');
    const { data: processedData, error: processedError } = await supabase
      .from('bmw_processed_data')
      .select('data')
      .eq('id', 'latest')
      .single();

    if (processedError) {
      console.error('❌ Error fetching processed data:', processedError);
      return;
    }

    if (!processedData || !processedData.data) {
      console.log('ℹ️ No processed data found');
      return;
    }

    console.log(`✅ Found ${processedData.data.length} current records`);

    // 3. Test data extraction
    console.log('\n3. Testing data extraction...');
    const currentData = processedData.data;
    
    // Check what fields are available
    const firstRecord = currentData[0];
    console.log('First record fields:', Object.keys(firstRecord));
    console.log('Sample record:', {
      country: firstRecord.country,
      year: firstRecord.year,
      month: firstRecord.month,
      _year: firstRecord._year,
      _month: firstRecord._month,
      dimension: firstRecord.dimension
    });

    // 4. Test month extraction
    console.log('\n4. Testing month extraction...');
    const months = [...new Set(currentData.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))].sort();
    console.log('Available months:', months);
    
    if (months.length > 0) {
      const latestMonth = months[months.length - 1];
      const [year, month] = latestMonth.split('-');
      console.log(`Latest month: ${year}-${month}`);
      
      // 5. Test MoM calculation for each market
      console.log('\n5. Testing MoM calculation...');
      
      // Group data by market
      const marketData = {};
      currentData.forEach(row => {
        if (row.country && row.year === parseInt(year) && row.month === parseInt(month)) {
          if (!marketData[row.country]) {
            marketData[row.country] = [];
          }
          marketData[row.country].push(row);
        }
      });

      Object.keys(marketData).forEach(marketCode => {
        console.log(`\nTesting market: ${marketCode}`);
        
        // Calculate current compliance
        const marketRecords = marketData[marketCode];
        const detailRows = marketRecords.filter(row => row.dimension !== 'All');
        
        let totalUnmapped = 0;
        detailRows.forEach(row => {
          const isNotMapped = (val) => !val || val.trim() === '' || val.toString().toLowerCase().includes('not mapped');
          
          const fieldUnmapped = {
            model: row.dimension === 'Model' ? isNotMapped(row.Model) : false,
            phase: row.dimension === 'Phase' ? isNotMapped(row.Phase) : false,
            channelType: row.dimension === 'ChannelType' ? isNotMapped(row['Channel Type']) : false,
            channelName: row.dimension === 'ChannelName' ? isNotMapped(row['Channel Name']) : false,
            campaignType: row.dimension === 'CampaignType' ? isNotMapped(row['Campaign Type']) : false
          };

          if (Object.values(fieldUnmapped).some(Boolean)) {
            totalUnmapped++;
          }
        });

        const totalRecords = detailRows.length;
        const mappedRecords = totalRecords - totalUnmapped;
        const currentCompliance = totalRecords > 0 ? (mappedRecords / totalRecords) * 100 : 0;
        
        console.log(`  Current compliance: ${currentCompliance.toFixed(2)}%`);
        
        // Calculate previous month
        let previousMonth = parseInt(month) - 1;
        let previousYear = parseInt(year);
        if (previousMonth === 0) {
          previousMonth = 12;
          previousYear = parseInt(year) - 1;
        }
        
        console.log(`  Looking for previous month: ${previousYear}-${previousMonth}`);
        
        // Find historical data
        const previousData = historicalData.find(record => 
          record.market_code === marketCode &&
          record.year === previousYear &&
          record.month === previousMonth
        );

        if (previousData) {
          const previousCompliance = parseFloat(previousData.compliance_percentage);
          const change = currentCompliance - previousCompliance;
          const percentage = previousCompliance > 0 ? (change / previousCompliance) * 100 : 0;
          
          console.log(`  Previous compliance: ${previousCompliance}%`);
          console.log(`  Change: ${change.toFixed(2)}%`);
          console.log(`  MoM percentage: ${percentage.toFixed(2)}%`);
        } else {
          console.log(`  ❌ No historical data found for ${marketCode} ${previousYear}-${previousMonth}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error in debug:', error);
  }
}

debugMoMCalculation(); 