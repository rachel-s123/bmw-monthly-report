import { supabase } from './supabase.js';
import { calculateKPIMetrics, saveKPIHistory } from './kpiHistory.js';
import { getMonthName } from './complianceHistory.js';

/**
 * Automatically process KPI metrics for all available months in the data
 * This ensures KPI MoM calculations work for all markets and months
 */
export const processAllMonthsKPI = async () => {
  try {
    console.log('🔧 Auto-processing KPI metrics for all available months...');
    
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

    // Group data by file source (market) and month
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
        
        console.log(`📊 Processing KPI for ${marketCode} ${monthName} ${year} (${periodData.length} records)`);
        
        // Calculate KPI metrics for this period
        const kpiMetrics = calculateKPIMetrics(periodData);
        
        if (kpiMetrics) {
          // Save KPI to history
          await saveKPIHistory(kpiMetrics, marketCode, parseInt(year), parseInt(month), monthName);
          
          results.push({
            period: key,
            success: true,
            records: periodData.length,
            total_spend: kpiMetrics.total_spend,
            total_nvwr: kpiMetrics.total_nvwr,
            cpm: kpiMetrics.cpm,
            ctr: kpiMetrics.ctr
          });
          
          console.log(`✅ KPI saved for ${marketCode} ${monthName} ${year} - Spend: $${kpiMetrics.total_spend.toFixed(2)}, NVWR: ${kpiMetrics.total_nvwr.toFixed(2)}`);
        } else {
          results.push({
            period: key,
            success: false,
            error: 'No KPI metrics calculated'
          });
        }
        
      } catch (error) {
        console.error(`❌ Error processing KPI for ${key}:`, error);
        results.push({
          period: key,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`✅ Auto-KPI processing complete: ${successCount}/${totalCount} periods processed successfully`);
    
    return {
      success: true,
      message: `Processed ${successCount}/${totalCount} periods successfully`,
      results
    };

  } catch (error) {
    console.error('❌ Error in auto-KPI processing:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if all available months have KPI data in history
 */
export const checkKPICoverage = async () => {
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

    // Get all periods in KPI history
    const { data: historyData } = await supabase
      .from('bmw_kpi_history')
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
    console.error('Error checking KPI coverage:', error);
    return { hasData: false, coverage: [] };
  }
}; 