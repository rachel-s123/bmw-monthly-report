// Import will be handled by the calling function

/**
 * Save dimension coverage data to the database for historical tracking
 * @param {Object} recordOrMarketAnalysis - Either a single record or market analysis data from quality scoring
 * @param {Object} supabaseClient - Supabase client instance
 * @param {number} year - Year of the data (only needed if passing marketAnalysis)
 * @param {number} month - Month of the data (only needed if passing marketAnalysis)
 * @param {string} monthName - Name of the month (only needed if passing marketAnalysis)
 */
export const saveDimensionCoverageHistory = async (recordOrMarketAnalysis, supabaseClient, year = null, month = null, monthName = null) => {
  try {
    const records = [];
    
    // Check if this is a single record or market analysis
    if (recordOrMarketAnalysis.market_code) {
      // Single record - use as is
      records.push(recordOrMarketAnalysis);
    } else {
      // Market analysis object - process each market and dimension
      Object.entries(recordOrMarketAnalysis).forEach(([marketCode, marketData]) => {
        // Iterate through each dimension for this market
        Object.entries(marketData.dimensionScores).forEach(([dimension, dimensionData]) => {
          const gaps = dimensionData.gaps;
          
          const record = {
            market_code: marketCode,
            year: year,
            month: month,
            month_name: monthName,
            dimension: dimension,
            overall_coverage: dimensionData.coverage,
            media_cost_gap: gaps['Media Cost']?.gap || 0,
            impressions_gap: gaps['Impressions']?.gap || 0,
            clicks_gap: gaps['Clicks']?.gap || 0,
            iv_gap: gaps['IV']?.gap || 0,
            nvwr_gap: gaps['NVWR']?.gap || 0,
            total_missing_media_cost: gaps['Media Cost']?.missingValue || 0,
            total_missing_impressions: gaps['Impressions']?.missingValue || 0,
            total_missing_clicks: gaps['Clicks']?.missingValue || 0,
            total_missing_iv: gaps['IV']?.missingValue || 0,
            total_missing_nvwr: gaps['NVWR']?.missingValue || 0,
            all_media_cost: gaps['Media Cost']?.allValue || 0,
            all_impressions: gaps['Impressions']?.allValue || 0,
            all_clicks: gaps['Clicks']?.allValue || 0,
            all_iv: gaps['IV']?.allValue || 0,
            all_nvwr: gaps['NVWR']?.allValue || 0,
            dimension_media_cost: gaps['Media Cost']?.dimensionValue || 0,
            dimension_impressions: gaps['Impressions']?.dimensionValue || 0,
            dimension_clicks: gaps['Clicks']?.dimensionValue || 0,
            dimension_iv: gaps['IV']?.dimensionValue || 0,
            dimension_nvwr: gaps['NVWR']?.dimensionValue || 0
          };
          
          records.push(record);
        });
      });
    }

    if (records.length === 0) {
      console.log('No dimension coverage data to save');
      return [];
    }

    const { data, error } = await supabaseClient
      .from('bmw_dimension_coverage_history')
      .upsert(records, { 
        onConflict: 'market_code,year,month,dimension',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error saving dimension coverage history:', error);
      throw error;
    }

    console.log(`Saved dimension coverage history for ${records.length} dimension-market combinations`);
    return data;
  } catch (error) {
    console.error('Error in saveDimensionCoverageHistory:', error);
    throw error;
  }
};

/**
 * Get historical dimension coverage data for trend analysis
 * @param {Object} supabaseClient - Supabase client instance
 * @param {string} marketCode - Optional market code to filter by
 * @param {string} dimension - Optional dimension to filter by
 * @param {number} limit - Number of records to return
 * @returns {Array} Historical dimension coverage data
 */
export const getDimensionCoverageHistory = async (supabaseClient, marketCode = null, dimension = null, limit = 100) => {
  try {
    let query = supabaseClient
      .from('bmw_dimension_coverage_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (marketCode) {
      query = query.eq('market_code', marketCode);
    }

    if (dimension) {
      query = query.eq('dimension', dimension);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching dimension coverage history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDimensionCoverageHistory:', error);
    throw error;
  }
};

/**
 * Get dimension coverage trends for a specific market and dimension
 * @param {Object} supabaseClient - Supabase client instance
 * @param {string} marketCode - Market code
 * @param {string} dimension - Dimension name
 * @param {number} months - Number of months to look back
 * @returns {Array} Trend data for the specified market and dimension
 */
export const getDimensionCoverageTrends = async (supabaseClient, marketCode, dimension, months = 6) => {
  try {
    const { data, error } = await supabaseClient
      .from('bmw_dimension_coverage_history')
      .select('*')
      .eq('market_code', marketCode)
      .eq('dimension', dimension)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(months);

    if (error) {
      console.error('Error fetching dimension coverage trends:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDimensionCoverageTrends:', error);
    throw error;
  }
};

/**
 * Get month name from month number
 * @param {number} month - Month number (1-12)
 * @returns {string} Month name
 */
export const getMonthName = (month) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1] || 'Unknown';
}; 