/**
 * Comprehensive data processing utilities for trend analysis visualizations
 */

// BMW Brand Colors
export const BMW_COLORS = {
  primary: '#0066CC',
  secondary: '#1E40AF',
  accent: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  neutral: '#6B7280',
  light: '#F3F4F6'
};

// Metric configurations
export const METRICS_CONFIG = {
  volume: {
    impressions: { label: 'Impressions', color: BMW_COLORS.primary, format: 'number' },
    clicks: { label: 'Clicks', color: BMW_COLORS.accent, format: 'number' },
    iv: { label: 'IV', color: BMW_COLORS.secondary, format: 'number' },
    nvwr: { label: 'NVWR', color: BMW_COLORS.success, format: 'number' },
    dcs_orders: { label: 'DCS Orders', color: BMW_COLORS.warning, format: 'number' }
  },
  rates: {
    ctr: { label: 'CTR', color: BMW_COLORS.accent, format: 'percentage' },
    cvr: { label: 'CVR', color: BMW_COLORS.success, format: 'percentage' },
    iv_rate: { label: 'IV Rate', color: BMW_COLORS.secondary, format: 'percentage' },
    nvwr_rate: { label: 'NVWR Rate', color: BMW_COLORS.warning, format: 'percentage' }
  },
  costs: {
    cpc: { label: 'CPC', color: BMW_COLORS.neutral, format: 'currency' },
    cp_iv: { label: 'CP IV', color: BMW_COLORS.neutral, format: 'currency' },
    cp_nvwr: { label: 'CP NVWR', color: BMW_COLORS.neutral, format: 'currency' },
    cp_dcs: { label: 'CP DCS', color: BMW_COLORS.neutral, format: 'currency' }
  }
};

/**
 * Calculate month-over-month percentage change
 */
export const calculateMoMChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

/**
 * Format values based on type
 */
export const formatValue = (value, format = 'number') => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (format) {
    case 'number':
      return value.toLocaleString();
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    default:
      return value.toString();
  }
};

/**
 * Get performance color based on value and thresholds
 */
export const getPerformanceColor = (value, thresholds = { good: 2, warning: 1 }) => {
  if (value >= thresholds.good) return BMW_COLORS.success;
  if (value >= thresholds.warning) return BMW_COLORS.warning;
  return BMW_COLORS.danger;
};

/**
 * Process data for multi-metric performance trend chart
 */
export const processTrendData = (data, selectedMetrics = [], selectedMarkets = [], dateRange = '6') => {
  if (!data || data.length === 0) return [];


  
  // Check all unique year-month combinations
  const allYearMonths = data.map(row => ({ year: row.year, month: row.month }));
  const uniqueYearMonths = [...new Set(allYearMonths.map(ym => `${ym.year}-${ym.month}`))];

  // Filter by date range
  const monthStrings = data.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`);
  const months = [...new Set(monthStrings)].sort();
  const requestedMonths = parseInt(dateRange);
  const availableMonths = months.length;
  
  // If we have fewer months than requested, show all available months
  const monthsToShow = Math.min(requestedMonths, availableMonths);
  const startIndex = Math.max(0, availableMonths - monthsToShow);
  const filteredMonths = months.slice(startIndex);

  // Filter by markets
  let filteredData = data;
  if (selectedMarkets.length > 0 && !selectedMarkets.includes('all')) {
    filteredData = data.filter(row => {
      if (row.file_source) {
        const match = row.file_source.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/);
        return match && selectedMarkets.includes(match[1]);
      }
      return false;
    });
  }

  // Group by month and calculate metrics
  const monthlyData = {};
  
  filteredData.forEach(row => {
    const monthKey = `${row.year}-${row.month.toString().padStart(2, '0')}`;
    if (!filteredMonths.includes(monthKey)) return;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        monthName: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        impressions: 0,
        clicks: 0,
        iv: 0,
        nvwr: 0,
        dcs_orders: 0,
        spend: 0,
        ctr: 0,
        cvr: 0,
        iv_rate: 0,
        nvwr_rate: 0,
        cpc: 0,
        cp_iv: 0,
        cp_nvwr: 0,
        cp_dcs: 0
      };
    }
    
    const month = monthlyData[monthKey];
    month.impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
    month.clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
    month.iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;
    month.nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
    month.dcs_orders += parseFloat(row['DCS_Orders'] || row['dcs_orders'] || 0) || 0;
    month.spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
  });

  // Calculate derived metrics
  Object.values(monthlyData).forEach(month => {
    month.ctr = month.impressions > 0 ? (month.clicks / month.impressions) * 100 : 0;
    month.cvr = month.clicks > 0 ? (month.nvwr / month.clicks) * 100 : 0;
    month.iv_rate = month.impressions > 0 ? (month.iv / month.impressions) * 100 : 0;
    month.nvwr_rate = month.impressions > 0 ? (month.nvwr / month.impressions) * 100 : 0;
    month.cpc = month.clicks > 0 ? month.spend / month.clicks : 0;
    month.cp_iv = month.iv > 0 ? month.spend / month.iv : 0;
    month.cp_nvwr = month.nvwr > 0 ? month.spend / month.nvwr : 0;
    month.cp_dcs = month.dcs_orders > 0 ? month.spend / month.dcs_orders : 0;
  });

  // Calculate MoM changes
  const sortedMonths = Object.keys(monthlyData).sort();
  sortedMonths.forEach((monthKey, index) => {
    if (index > 0) {
      const current = monthlyData[monthKey];
      const previous = monthlyData[sortedMonths[index - 1]];
      
      Object.keys(METRICS_CONFIG.volume).forEach(metric => {
        if (current[metric] !== undefined) {
          const momChange = calculateMoMChange(current[metric], previous[metric]);
          current[`${metric}_mom`] = typeof momChange === 'number' ? momChange : null;
        }
      });
    }
  });

  const result = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  
  return result;
};

/**
 * Process data for conversion funnel chart
 */
export const processFunnelData = (data, selectedMarket = 'all', selectedMonth = 'latest') => {
  if (!data || data.length === 0) return null;

  // Filter data
  let filteredData = data;
  
  if (selectedMarket !== 'all') {
    filteredData = data.filter(row => {
      if (row.file_source) {
        const match = row.file_source.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/);
        return match && match[1] === selectedMarket;
      }
      return false;
    });
  }

  if (selectedMonth !== 'latest') {
    filteredData = filteredData.filter(row => 
      `${row.year}-${row.month.toString().padStart(2, '0')}` === selectedMonth
    );
  } else {
    // Get latest month
    const months = [...new Set(data.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))].sort();
    const latestMonth = months[months.length - 1];
    filteredData = filteredData.filter(row => 
      `${row.year}-${row.month.toString().padStart(2, '0')}` === latestMonth
    );
  }

  // Calculate totals
  const totals = {
    impressions: 0,
    clicks: 0,
    iv: 0,
    nvwr: 0,
    dcs_orders: 0,
    spend: 0
  };

  filteredData.forEach(row => {
    totals.impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
    totals.clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
    totals.iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;
    totals.nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
    totals.dcs_orders += parseFloat(row['DCS_Orders'] || row['dcs_orders'] || 0) || 0;
    totals.spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
  });

  // Create funnel stages
  const stages = [
    {
      name: 'Impressions',
      value: totals.impressions,
      percentage: 100,
      conversionRate: null,
      costPerConversion: null,
      color: BMW_COLORS.primary
    },
    {
      name: 'Clicks',
      value: totals.clicks,
      percentage: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      conversionRate: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      costPerConversion: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      color: BMW_COLORS.accent
    },
    {
      name: 'IV',
      value: totals.iv,
      percentage: totals.impressions > 0 ? (totals.iv / totals.impressions) * 100 : 0,
      conversionRate: totals.clicks > 0 ? (totals.iv / totals.clicks) * 100 : 0,
      costPerConversion: totals.iv > 0 ? totals.spend / totals.iv : 0,
      color: BMW_COLORS.secondary
    },
    {
      name: 'NVWR',
      value: totals.nvwr,
      percentage: totals.impressions > 0 ? (totals.nvwr / totals.impressions) * 100 : 0,
      conversionRate: totals.iv > 0 ? (totals.nvwr / totals.iv) * 100 : 0,
      costPerConversion: totals.nvwr > 0 ? totals.spend / totals.nvwr : 0,
      color: BMW_COLORS.success
    },
    {
      name: 'DCS Orders',
      value: totals.dcs_orders,
      percentage: totals.impressions > 0 ? (totals.dcs_orders / totals.impressions) * 100 : 0,
      conversionRate: totals.nvwr > 0 ? (totals.dcs_orders / totals.nvwr) * 100 : 0,
      costPerConversion: totals.dcs_orders > 0 ? totals.spend / totals.dcs_orders : 0,
      color: BMW_COLORS.warning
    }
  ];

  return {
    stages,
    totalSpend: totals.spend,
    selectedMarket,
    selectedMonth
  };
};

/**
 * Process data for market performance heatmap
 */
export const processHeatmapData = (data, selectedMonth = 'latest') => {
  if (!data || data.length === 0) return [];

  // Filter by month
  let filteredData = data;
  if (selectedMonth !== 'latest') {
    filteredData = data.filter(row => 
      `${row.year}-${row.month.toString().padStart(2, '0')}` === selectedMonth
    );
  } else {
    // Get latest month
    const months = [...new Set(data.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))].sort();
    const latestMonth = months[months.length - 1];
    filteredData = data.filter(row => 
      `${row.year}-${row.month.toString().padStart(2, '0')}` === latestMonth
    );
  }

  // Group by market
  const marketData = {};
  
  filteredData.forEach(row => {
    if (row.file_source) {
      const match = row.file_source.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/);
      if (match) {
        const market = match[1];
        if (!marketData[market]) {
          marketData[market] = {
            market,
            impressions: 0,
            clicks: 0,
            iv: 0,
            nvwr: 0,
            dcs_orders: 0,
            spend: 0
          };
        }
        
        marketData[market].impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
        marketData[market].clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
        marketData[market].iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;
        marketData[market].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        marketData[market].dcs_orders += parseFloat(row['DCS_Orders'] || row['dcs_orders'] || 0) || 0;
        marketData[market].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
      }
    }
  });

  // Calculate derived metrics
  Object.values(marketData).forEach(market => {
    market.ctr = market.impressions > 0 ? (market.clicks / market.impressions) * 100 : 0;
    market.cvr = market.clicks > 0 ? (market.nvwr / market.clicks) * 100 : 0;
    market.cost_per_nvwr = market.nvwr > 0 ? market.spend / market.nvwr : 0;
    market.conversion_rate = market.impressions > 0 ? (market.nvwr / market.impressions) * 100 : 0;
  });

  // Calculate rankings and performance scores
  const markets = Object.values(marketData);
  const metrics = ['nvwr', 'cost_per_nvwr', 'ctr', 'spend', 'conversion_rate'];
  
  metrics.forEach(metric => {
    const sorted = [...markets].sort((a, b) => {
      if (metric === 'cost_per_nvwr') {
        return a[metric] - b[metric]; // Lower is better for cost
      }
      return b[metric] - a[metric]; // Higher is better for others
    });
    
    markets.forEach((market, index) => {
      const rank = sorted.findIndex(m => m.market === market.market) + 1;
      market[`${metric}_rank`] = rank;
      market[`${metric}_percentile`] = ((markets.length - rank + 1) / markets.length) * 100;
    });
  });

  // Calculate performance score (weighted average of percentiles)
  markets.forEach(market => {
    market.performance_score = (
      market.nvwr_percentile * 0.4 +
      (100 - market.cost_per_nvwr_percentile) * 0.3 + // Invert cost percentile
      market.ctr_percentile * 0.2 +
      market.conversion_rate_percentile * 0.1
    );
  });

  // Sort by performance score
  return markets.sort((a, b) => b.performance_score - a.performance_score);
};

/**
 * Get sparkline data for market trends
 */
export const getSparklineData = (data, market, months = 3) => {
  if (!data || data.length === 0) return [];

  const marketData = data.filter(row => {
    if (row.file_source) {
      const match = row.file_source.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/);
      return match && match[1] === market;
    }
    return false;
  });

  const monthlyData = {};
  marketData.forEach(row => {
    const monthKey = `${row.year}-${row.month.toString().padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        nvwr: 0,
        spend: 0
      };
    }
    monthlyData[monthKey].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
    monthlyData[monthKey].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const recentMonths = sortedMonths.slice(-months);
  
  return recentMonths.map(month => ({
    month,
    value: monthlyData[month].nvwr,
    cost: monthlyData[month].spend
  }));
}; 