import { supabase } from './supabase.js';
import { analyzeOnebuilderCompliance } from './onebuilderCompliance.js';
import { saveComplianceHistory, getMonthName } from './complianceHistory.js';

/**
 * Automatically process compliance for all available months in the data
 * This ensures MoM calculations work for all markets and months
 */
export const processAllMonthsCompliance = async () => {
  try {
    console.log('🔧 Auto-processing compliance for all available months...');
    
    // Get all processed data (always get all data, not filtered)
    const { data: processedData } = await supabase
      .from('bmw_processed_data')
      .select('data')
      .eq('id', 'latest')
      .single();

    if (!processedData || !processedData.data) {
      console.log('ℹ️ No processed data found');
      return { success: true, message: 'No data to process' };
    }

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

    console.log(`📊 Found data for ${Object.keys(dataByPeriod).length} periods`);

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
    
    console.log(`✅ Auto-processing complete: ${successCount}/${totalCount} periods processed successfully`);
    
    return {
      success: true,
      message: `Processed ${successCount}/${totalCount} periods successfully`,
      results
    };

  } catch (error) {
    console.error('❌ Error in auto-compliance processing:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if all available months have compliance data in history
 */
export const checkComplianceCoverage = async () => {
  try {
    // Get all processed data
    const { data: processedData } = await supabase
      .from('bmw_processed_data')
      .select('data')
      .eq('id', 'latest')
      .single();

    if (!processedData || !processedData.data) {
      return { hasData: false, coverage: [] };
    }

    // Get all periods in the data
    const periodsInData = new Set();
    processedData.data.forEach(record => {
      if (record.file_source && record.year && record.month) {
        // Determine market code
        const marketCode = record.country || record.file_source?.match(/BMW_([A-Z]{2})_[A-Za-z]+_\d{4}_\d{2}\.csv/)?.[1] || record.file_source?.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/)?.[1];
        if (marketCode) {
          periodsInData.add(`${marketCode}_${record.year}_${record.month}`);
        }
      }
    });

    // Get all periods in history
    const { data: historyData } = await supabase
      .from('bmw_compliance_history')
      .select('market_code, year, month');

    const periodsInHistory = new Set();
    if (historyData) {
      historyData.forEach(record => {
        periodsInHistory.add(`${record.market_code}_${record.year}_${record.month}`);
      });
    }

    // Find missing periods
    const missingPeriods = Array.from(periodsInData).filter(period => !periodsInHistory.has(period));

    return {
      hasData: periodsInData.size > 0,
      totalPeriods: periodsInData.size,
      coveredPeriods: periodsInHistory.size,
      missingPeriods: missingPeriods.length,
      needsProcessing: missingPeriods.length > 0
    };

  } catch (error) {
    console.error('Error checking compliance coverage:', error);
    return { hasData: false, coverage: [] };
  }
}; 