import _ from 'lodash';

/**
 * Extracts month information from data and organizes by month
 * @param {Array} data - Parsed CSV data
 * @returns {Object} Data organized by month
 */
export const organizeDataByMonth = (data) => {
  if (!data || data.length === 0) return {};

  // Try to extract month from filename or data structure
  // For now, we'll use a simple approach - this can be enhanced based on actual data structure
  const monthGroups = {};
  
  // Group by country first, then by campaign type to simulate month separation
  // In real implementation, this would extract actual month from filename or data
  const countryGroups = _.groupBy(data, 'Country');
  
  Object.keys(countryGroups).forEach((country, index) => {
    const monthKey = `Month_${index + 1}`;
    monthGroups[monthKey] = countryGroups[country];
  });

  return monthGroups;
};

/**
 * Calculates month-over-month change percentage
 * @param {number} current - Current month value
 * @param {number} previous - Previous month value
 * @returns {Object} Change details
 */
export const calculateMoMChange = (current, previous) => {
  if (previous === 0) {
    return {
      percentage: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : 'stable',
      isSignificant: current > 0
    };
  }
  
  const percentage = ((current - previous) / previous) * 100;
  const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable';
  const isSignificant = Math.abs(percentage) >= 5; // 5% threshold for significance
  
  return {
    percentage: Math.abs(percentage),
    direction,
    isSignificant,
    rawChange: current - previous
  };
};

/**
 * Analyzes trends across multiple months
 * @param {Array} data - Parsed CSV data
 * @returns {Object} Trend analysis results
 */
export const analyzeTrends = (data) => {
  if (!data || data.length === 0) {
    return {
      hasMultipleMonths: false,
      trends: {},
      alerts: [],
      successStories: []
    };
  }

  const monthGroups = organizeDataByMonth(data);
  const monthKeys = Object.keys(monthGroups);
  
  if (monthKeys.length < 2) {
    return {
      hasMultipleMonths: false,
      trends: {},
      alerts: [],
      successStories: []
    };
  }

  const trends = {};
  const alerts = [];
  const successStories = [];

  // Sort months chronologically (assuming Month_1, Month_2, etc.)
  const sortedMonths = monthKeys.sort();
  const currentMonth = sortedMonths[sortedMonths.length - 1];
  const previousMonth = sortedMonths[sortedMonths.length - 2];

  const currentData = monthGroups[currentMonth];
  const previousData = monthGroups[previousMonth];

  // NVWR Trend Analysis
  const currentNVWR = _.sumBy(currentData, row => parseFloat(row.NVWR) || 0);
  const previousNVWR = _.sumBy(previousData, row => parseFloat(row.NVWR) || 0);
  const nvwrChange = calculateMoMChange(currentNVWR, previousNVWR);

  trends.nvwr = {
    current: currentNVWR,
    previous: previousNVWR,
    change: nvwrChange,
    trend: nvwrChange.direction === 'up' ? '↗️' : nvwrChange.direction === 'down' ? '↘️' : '➡️'
  };

  // Market Performance Trends
  trends.markets = analyzeMarketTrends(currentData, previousData);
  
  // Channel Performance Trends
  trends.channels = analyzeChannelTrends(currentData, previousData);
  
  // Cost Efficiency Trends
  trends.costEfficiency = analyzeCostEfficiencyTrends(currentData, previousData);
  
  // Onebuilder Compliance Trends
  trends.compliance = analyzeComplianceTrends(currentData, previousData);

  // Generate Alerts
  generateAlerts(trends, alerts);
  
  // Generate Success Stories
  generateSuccessStories(trends, successStories);

  return {
    hasMultipleMonths: true,
    trends,
    alerts,
    successStories,
    monthCount: monthKeys.length
  };
};

/**
 * Analyzes market performance trends
 */
const analyzeMarketTrends = (currentData, previousData) => {
  const currentMarkets = _.groupBy(currentData, 'Country');
  const previousMarkets = _.groupBy(previousData, 'Country');
  
  const marketTrends = {};
  
  Object.keys(currentMarkets).forEach(country => {
    const currentNVWR = _.sumBy(currentMarkets[country], row => parseFloat(row.NVWR) || 0);
    const previousNVWR = _.sumBy(previousMarkets[country] || [], row => parseFloat(row.NVWR) || 0);
    const change = calculateMoMChange(currentNVWR, previousNVWR);
    
    marketTrends[country] = {
      current: currentNVWR,
      previous: previousNVWR,
      change,
      trend: change.direction === 'up' ? '↗️' : change.direction === 'down' ? '↘️' : '➡️'
    };
  });
  
  return marketTrends;
};

/**
 * Analyzes channel performance trends
 */
const analyzeChannelTrends = (currentData, previousData) => {
  const currentChannels = _.groupBy(currentData, 'Channel Type');
  const previousChannels = _.groupBy(previousData, 'Channel Type');
  
  const channelTrends = {};
  
  Object.keys(currentChannels).forEach(channelType => {
    const currentCost = _.sumBy(currentChannels[channelType], row => parseFloat(row['Media Cost']) || 0);
    const currentNVWR = _.sumBy(currentChannels[channelType], row => parseFloat(row.NVWR) || 0);
    const previousCost = _.sumBy(previousChannels[channelType] || [], row => parseFloat(row['Media Cost']) || 0);
    const previousNVWR = _.sumBy(previousChannels[channelType] || [], row => parseFloat(row.NVWR) || 0);
    
    const currentEfficiency = currentNVWR > 0 ? currentCost / currentNVWR : Infinity;
    const previousEfficiency = previousNVWR > 0 ? previousCost / previousNVWR : Infinity;
    
    const efficiencyChange = calculateMoMChange(currentEfficiency, previousEfficiency);
    
    channelTrends[channelType] = {
      currentEfficiency,
      previousEfficiency,
      efficiencyChange,
      currentNVWR,
      previousNVWR,
      nvwrChange: calculateMoMChange(currentNVWR, previousNVWR),
      trend: efficiencyChange.direction === 'down' ? '↗️' : efficiencyChange.direction === 'up' ? '↘️' : '➡️'
    };
  });
  
  return channelTrends;
};

/**
 * Analyzes cost efficiency trends
 */
const analyzeCostEfficiencyTrends = (currentData, previousData) => {
  const currentTotalCost = _.sumBy(currentData, row => parseFloat(row['Media Cost']) || 0);
  const currentTotalNVWR = _.sumBy(currentData, row => parseFloat(row.NVWR) || 0);
  const previousTotalCost = _.sumBy(previousData, row => parseFloat(row['Media Cost']) || 0);
  const previousTotalNVWR = _.sumBy(previousData, row => parseFloat(row.NVWR) || 0);
  
  const currentEfficiency = currentTotalNVWR > 0 ? currentTotalCost / currentTotalNVWR : Infinity;
  const previousEfficiency = previousTotalNVWR > 0 ? previousTotalCost / previousTotalNVWR : Infinity;
  
  const efficiencyChange = calculateMoMChange(currentEfficiency, previousEfficiency);
  
  return {
    currentEfficiency,
    previousEfficiency,
    efficiencyChange,
    trend: efficiencyChange.direction === 'down' ? '↗️' : efficiencyChange.direction === 'up' ? '↘️' : '➡️'
  };
};

/**
 * Analyzes Onebuilder compliance trends
 */
const analyzeComplianceTrends = (currentData, previousData) => {
  const currentMapped = currentData.filter(row => {
    const model = row.Model || '';
    return model && model.trim() !== '' && !model.toLowerCase().includes('not mapped');
  }).length;
  const currentTotal = currentData.length;
  const previousMapped = previousData.filter(row => {
    const model = row.Model || '';
    return model && model.trim() !== '' && !model.toLowerCase().includes('not mapped');
  }).length;
  const previousTotal = previousData.length;
  
  const currentCompliance = currentTotal > 0 ? (currentMapped / currentTotal) * 100 : 0;
  const previousCompliance = previousTotal > 0 ? (previousMapped / previousTotal) * 100 : 0;
  
  const complianceChange = calculateMoMChange(currentCompliance, previousCompliance);
  
  return {
    current: currentCompliance,
    previous: previousCompliance,
    change: complianceChange,
    trend: complianceChange.direction === 'up' ? '↗️' : complianceChange.direction === 'down' ? '↘️' : '➡️'
  };
};

/**
 * Generates performance alerts
 */
const generateAlerts = (trends, alerts) => {
  // NVWR decline alerts
  Object.keys(trends.markets).forEach(country => {
    const market = trends.markets[country];
    if (market.change.direction === 'down' && market.change.percentage > 20) {
      alerts.push({
        type: 'nvwr_decline',
        severity: 'high',
        message: `${country} NVWR declined ${market.change.percentage.toFixed(1)}% vs last month`,
        country,
        change: market.change.percentage
      });
    }
  });

  // Cost efficiency alerts
  if (trends.costEfficiency.efficiencyChange.direction === 'up' && 
      trends.costEfficiency.efficiencyChange.percentage > 30) {
    alerts.push({
      type: 'cost_efficiency',
      severity: 'high',
      message: `Cost-per-NVWR increased ${trends.costEfficiency.efficiencyChange.percentage.toFixed(1)}% vs last month`,
      change: trends.costEfficiency.efficiencyChange.percentage
    });
  }

  // Compliance alerts
  if (trends.compliance.change.direction === 'down' && 
      trends.compliance.change.percentage > 5) {
    alerts.push({
      type: 'compliance_decline',
      severity: 'medium',
      message: `Onebuilder compliance dropped ${trends.compliance.change.percentage.toFixed(1)}% vs last month`,
      change: trends.compliance.change.percentage
    });
  }
};

/**
 * Generates success stories
 */
const generateSuccessStories = (trends, successStories) => {
  // Markets with consistent improvement
  Object.keys(trends.markets).forEach(country => {
    const market = trends.markets[country];
    if (market.change.direction === 'up' && market.change.percentage > 10) {
      successStories.push({
        type: 'market_improvement',
        message: `${country} NVWR increased ${market.change.percentage.toFixed(1)}% vs last month`,
        country,
        improvement: market.change.percentage
      });
    }
  });

  // Channels with efficiency gains
  Object.keys(trends.channels).forEach(channelType => {
    const channel = trends.channels[channelType];
    if (channel.efficiencyChange.direction === 'down' && channel.efficiencyChange.percentage > 10) {
      successStories.push({
        type: 'channel_efficiency',
        message: `${channelType} cost efficiency improved ${channel.efficiencyChange.percentage.toFixed(1)}% vs last month`,
        channel: channelType,
        improvement: channel.efficiencyChange.percentage
      });
    }
  });

  // Overall NVWR improvement
  if (trends.nvwr.change.direction === 'up' && trends.nvwr.change.percentage > 5) {
    successStories.push({
      type: 'overall_improvement',
      message: `Overall NVWR increased ${trends.nvwr.change.percentage.toFixed(1)}% vs last month`,
      improvement: trends.nvwr.change.percentage
    });
  }
};

/**
 * Formats trend change for display
 */
export const formatTrendChange = (change) => {
  if (!change) return '';
  
  const sign = change.direction === 'up' ? '+' : change.direction === 'down' ? '-' : '';
  return `${sign}${change.percentage.toFixed(1)}% vs last month`;
};

/**
 * Gets trend color based on direction and context
 */
export const getTrendColor = (change, context = 'positive') => {
  if (!change) return 'text-gray-600';
  
  if (context === 'positive') {
    // For positive metrics (NVWR, compliance), up is good
    return change.direction === 'up' ? 'text-green-600' : 
           change.direction === 'down' ? 'text-red-600' : 'text-gray-600';
  } else {
    // For negative metrics (cost), down is good
    return change.direction === 'down' ? 'text-green-600' : 
           change.direction === 'up' ? 'text-red-600' : 'text-gray-600';
  }
}; 