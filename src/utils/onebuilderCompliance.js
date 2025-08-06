import _ from 'lodash';

/**
 * Analyzes Onebuilder compliance with focus on market-by-market breakdown
 * @param {Array} data - Parsed CSV data
 * @param {Array} historicalData - Historical compliance data for MoM calculations
 * @returns {Object} Compliance analysis results
 */
export const analyzeOnebuilderCompliance = (data, historicalData = []) => {
  if (!data || data.length === 0) {
    return {
      overallCompliance: 0,
      marketCompliance: [],
      unmappedDataTypes: {},
      trend: null
    };
  }

  // Split rows by dimension so we can treat them differently
  // Separate rows
  const detailRows = data.filter(row => row.dimension !== 'All');

  // Helper to extract consistent 2-letter market code
  const extractMarketCode = (row) => {
    // If country field already looks like a 2-char ISO, keep it
    if (row.country && row.country.length === 2) {
      return row.country.toUpperCase();
    }
    // Otherwise try to read from the filename e.g. BMW_CS_Model_2025_07.csv → CS
    if (row.file_source) {
      const m = row.file_source.match(/BMW_([A-Z]{2})_/);
      if (m) return m[1];
    }
    // Fallback – use the country string itself (may not match the history)
    return row.country;
  };

  // Re-group detail rows by this market code
  const marketData = _.groupBy(detailRows, extractMarketCode);
  
  // Analyze each market
  const marketCompliance = Object.entries(marketData).map(([country, complianceRows]) => {
    // Market code is simply the country ISO
    const marketCode = country;

    // Detailed rows (not "All") for unmapped analysis
    const detailRowsMarket = detailRows.filter(r => extractMarketCode(r) === marketCode);

    // Initialise unmapped counters per field
    const unmappedByField = {
      model: 0,
      phase: 0,
      channelType: 0,
      channelName: 0,
      campaignType: 0
    };

    const isNotMapped = (val) => !val || val.trim() === '' || val.toString().toLowerCase().includes('not mapped');

    let totalUnmapped = 0;
    detailRowsMarket.forEach(row => {
      // Determine which field to check based on this row's dimension
      const fieldUnmapped = {
        model: row.dimension === 'Model' ? isNotMapped(row.Model) : false,
        phase: row.dimension === 'Phase' ? isNotMapped(row.Phase) : false,
        channelType: row.dimension === 'ChannelType' ? isNotMapped(row['Channel Type']) : false,
        channelName: row.dimension === 'ChannelName' ? isNotMapped(row['Channel Name']) : false,
        campaignType: row.dimension === 'CampaignType' ? isNotMapped(row['Campaign Type']) : false
      };

      Object.keys(fieldUnmapped).forEach(key => {
        if (fieldUnmapped[key]) {
          unmappedByField[key]++;
        }
      });

      if (Object.values(fieldUnmapped).some(Boolean)) {
        totalUnmapped++;
      }
    });

    const totalRecords = detailRowsMarket.length;
    const mappedRecords = totalRecords - totalUnmapped;
    const compliance = totalRecords > 0 ? (mappedRecords / totalRecords) * 100 : 0;

    // Impact metrics based on detail rows
    const totalNVWR = _.sumBy(detailRowsMarket, row => parseFloat(row.NVWR) || 0);
    const unmappedNVWR = _.sumBy(detailRowsMarket.filter(row => {
      switch (row.dimension) {
        case 'Model':
          return isNotMapped(row.Model);
        case 'Phase':
          return isNotMapped(row.Phase);
        case 'ChannelType':
          return isNotMapped(row['Channel Type']);
        case 'ChannelName':
          return isNotMapped(row['Channel Name']);
        case 'CampaignType':
          return isNotMapped(row['Campaign Type']);
        default:
          return false;
      }
    }), row => parseFloat(row.NVWR) || 0);

    return {
      marketCode,
      totalRecords,
      totalUnmapped,
      mappedRecords,
      compliance,
      unmappedByField,
      totalNVWR,
      unmappedNVWR,
      unmappedNVWRPercentage: totalNVWR > 0 ? (unmappedNVWR / totalNVWR) * 100 : 0,
      severity: getSeverityLevel(compliance),
      status: getComplianceStatus(compliance)
    };
  });
  
  // Sort by severity (worst first)
  const sortedMarketCompliance = _.orderBy(marketCompliance, ['compliance'], ['asc']);
  
  // Calculate MoM changes for each market
  const marketComplianceWithMoM = sortedMarketCompliance.map(market => {
    const momChange = calculateMoMChange(market, historicalData, data);
    return {
      ...market,
      momChange
    };
  });
  
  // Overall compliance = average of market compliance values
  const overallCompliance = marketCompliance.length > 0 ? _.meanBy(marketCompliance, 'compliance') : 0;
  
  // Analyze unmapped data types across all markets
  const unmappedDataTypes = {
    model: _.sumBy(marketCompliance, 'unmappedByField.model'),
    phase: _.sumBy(marketCompliance, 'unmappedByField.phase'),
    channelType: _.sumBy(marketCompliance, 'unmappedByField.channelType'),
    channelName: _.sumBy(marketCompliance, 'unmappedByField.channelName'),
    campaignType: _.sumBy(marketCompliance, 'unmappedByField.campaignType')
  };
  
  // Trend analysis (placeholder for future implementation)
  const trend = null;
  
  return {
    overallCompliance,
    marketCompliance: marketComplianceWithMoM,
    unmappedDataTypes,
    trend,
    summary: {
      totalRecords: detailRows.length,
      totalUnmapped: _.sumBy(marketCompliance, 'totalUnmapped'),
      mappedRecords: detailRows.length - _.sumBy(marketCompliance, 'totalUnmapped'),
      complianceStatus: getComplianceStatus(overallCompliance)
    }
  };
};

/**
 * Get severity level for ordering
 */
const getSeverityLevel = (compliance) => {
  if (compliance < 80) return 1; // Critical
  if (compliance < 90) return 2; // High
  if (compliance < 95) return 3; // Medium
  return 4; // Low
};

/**
 * Get compliance status with traffic light colors
 */
const getComplianceStatus = (compliance) => {
  if (compliance >= 95) {
    return { status: 'Green', color: 'green', label: 'Excellent' };
  } else if (compliance >= 90) {
    return { status: 'Yellow', color: 'yellow', label: 'Good' };
  } else if (compliance >= 80) {
    return { status: 'Orange', color: 'orange', label: 'Needs Attention' };
  } else {
    return { status: 'Red', color: 'red', label: 'Critical' };
  }
};

/**
 * Format compliance percentage
 */
export const formatCompliancePercentage = (percentage) => {
  return `${percentage.toFixed(1)}%`;
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat().format(Math.round(num));
};

/**
 * Format currency
 */
export const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Calculate Month-over-Month (MoM) change for a market
 * @param {Object} currentMarket - Current market compliance data
 * @param {Array} historicalData - Historical compliance data
 * @param {Array} currentData - Current CSV data to extract year/month
 * @returns {Object} MoM change data
 */
const calculateMoMChange = (currentMarket, historicalData, currentData = []) => {
  if (!historicalData || historicalData.length === 0) {
    return {
      percentage: null,
      direction: null,
      previousCompliance: null,
      change: null
    };
  }

  // Extract current year and month from data
  let currentYear = null;
  let currentMonth = null;
  
  if (currentData && currentData.length > 0) {
    const firstRecord = currentData[0];
    
    // Check for different possible field names
    if (firstRecord.year && firstRecord.month) {
      currentYear = parseInt(firstRecord.year);
      currentMonth = parseInt(firstRecord.month);
    } else if (firstRecord._year && firstRecord._month) {
      currentYear = parseInt(firstRecord._year);
      currentMonth = parseInt(firstRecord._month);
    } else {
      // If no year/month fields, try to get the latest month from all records
      const months = [...new Set(currentData.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))].sort();
      if (months.length > 0) {
        const latestMonth = months[months.length - 1];
        const [year, month] = latestMonth.split('-');
        currentYear = parseInt(year);
        currentMonth = parseInt(month);
      }
    }
  }
  
  // If we still don't have year/month, use current date as fallback
  if (!currentYear || !currentMonth) {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth() + 1;
  }
  
  // Calculate previous month/year
  let previousMonth = currentMonth - 1;
  let previousYear = currentYear;
  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear = currentYear - 1;
  }

  // Find historical data for the previous month
  const previousData = historicalData.find(record => 
    record.market_code === currentMarket.marketCode &&
    record.year === previousYear &&
    record.month === previousMonth
  );

  if (!previousData) {
    return {
      percentage: null,
      direction: null,
      previousCompliance: null,
      change: null
    };
  }

  const currentCompliance = currentMarket.compliance;
  const previousCompliance = parseFloat(previousData.compliance_percentage);
  const change = currentCompliance - previousCompliance;
  const percentage = previousCompliance > 0 ? (change / previousCompliance) * 100 : 0;

  return {
    percentage: percentage,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    previousCompliance: previousCompliance,
    change: change
  };
};

/**
 * Format MoM change for display
 */
export const formatMoMChange = (momChange) => {
  if (momChange.percentage === null) {
    return 'N/A';
  }
  
  const sign = momChange.direction === 'up' ? '+' : '';
  const color = momChange.direction === 'up' ? 'text-green-600' : 
                momChange.direction === 'down' ? 'text-red-600' : 'text-gray-600';
  
  return {
    text: `${sign}${momChange.percentage.toFixed(1)}%`,
    color: color,
    direction: momChange.direction
  };
}; 