import { supabase } from './supabase.js';

/**
 * Save compliance data to the database for historical tracking
 * @param {Array} marketCompliance - Array of market compliance data
 * @param {number} year - Year of the data
 * @param {number} month - Month of the data
 * @param {string} monthName - Name of the month
 */
export const saveComplianceHistory = async (marketCompliance, year, month, monthName) => {
  try {
    const records = marketCompliance.map(market => ({
      market_code: market.marketCode,
      year: year,
      month: month,
      month_name: monthName,
      total_records: market.totalRecords,
      mapped_records: market.mappedRecords,
      unmapped_records: market.totalUnmapped,
      compliance_percentage: market.compliance,
      total_nvwr: market.totalNVWR,
      unmapped_nvwr: market.unmappedNVWR,
      unmapped_nvwr_percentage: market.unmappedNVWRPercentage,
      unmapped_by_field: market.unmappedByField
    }));

    const { data, error } = await supabase
      .from('bmw_compliance_history')
      .upsert(records, { 
        onConflict: 'market_code,year,month',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error saving compliance history:', error);
      throw error;
    }

    console.log(`Saved compliance history for ${records.length} markets`);
    return data;
  } catch (error) {
    console.error('Error in saveComplianceHistory:', error);
    throw error;
  }
};

/**
 * Get historical compliance data for MoM calculations
 * @param {string} marketCode - Optional market code to filter by
 * @param {number} limit - Number of records to return
 * @returns {Array} Historical compliance data
 */
export const getComplianceHistory = async (marketCode = null, limit = 100) => {
  try {
    let query = supabase
      .from('bmw_compliance_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (marketCode) {
      query = query.eq('market_code', marketCode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching compliance history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getComplianceHistory:', error);
    throw error;
  }
};

/**
 * Extract year and month from data for compliance history
 * @param {Array} data - CSV data
 * @param {string} filename - Optional CSV filename (e.g., "BMW_BE_2025_07.csv")
 * @returns {Object} Year and month information
 */
export const extractDataPeriod = (data, filename = null) => {
  // First try to extract from filename if provided
  if (filename) {
    const match = filename.match(/BMW_[A-Z]{2}_(\d{4})_(\d{2})\.csv/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]);
      return { year, month };
    }
  }

  // Try to extract from data if it has year/month fields
  if (data && data.length > 0) {
    const firstRecord = data[0];
    
    // Check for different possible field names
    if (firstRecord.year && firstRecord.month) {
      return {
        year: parseInt(firstRecord.year),
        month: parseInt(firstRecord.month)
      };
    }
    
    if (firstRecord._year && firstRecord._month) {
      return {
        year: parseInt(firstRecord._year),
        month: parseInt(firstRecord._month)
      };
    }
    
    // If no year/month fields, try to get the latest month from all records
    const months = [...new Set(data.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))].sort();
    if (months.length > 0) {
      const latestMonth = months[months.length - 1];
      const [year, month] = latestMonth.split('-');
      return {
        year: parseInt(year),
        month: parseInt(month)
      };
    }
  }

  // Fallback: return current date
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
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