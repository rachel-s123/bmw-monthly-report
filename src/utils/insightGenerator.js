import _ from 'lodash';
import { analyzeTrends, formatTrendChange, getTrendColor } from './trendAnalysis.js';
import { generateQualityAwareInsight } from './dataQualityScorer.js';

/**
 * Generates Datorama-focused insights from BMW monthly report data
 * @param {Array} data - Parsed CSV data
 * @param {Object} qualityData - Optional data quality information
 * @returns {Array} Array of 8 insight objects
 */
export const generateInsights = (data, qualityData = null) => {
  console.log('🧠 generateInsights called with data:', {
    dataLength: data?.length || 0,
    sampleRow: data?.[0] || null,
    sampleKeys: data?.[0] ? Object.keys(data[0]) : []
  });
  
  if (!data || data.length === 0) {
    console.log('❌ No data provided to generateInsights');
    return [];
  }

  // Analyze trends for MoM comparisons
  const trendAnalysis = analyzeTrends(data);

  const insights = [];

  // 1. Performance Leader: Market with highest NVWR per spend efficiency
  const performanceLeader = generatePerformanceLeaderInsight(data, trendAnalysis);
  insights.push(qualityData ? generateQualityAwareInsight(performanceLeader, qualityData, 'Channel Name') : performanceLeader);

  // 2. Channel Champion: Best performing channel type by cost-per-NVWR
  const channelChampion = generateChannelChampionInsight(data, trendAnalysis);
  insights.push(qualityData ? generateQualityAwareInsight(channelChampion, qualityData, 'Channel Type') : channelChampion);

  // 3. Model Spotlight: Top model by NVWR generation
  const modelSpotlight = generateModelSpotlightInsight(data, trendAnalysis);
  insights.push(qualityData ? generateQualityAwareInsight(modelSpotlight, qualityData, 'Model') : modelSpotlight);

  // 4. Efficiency Alert: Market with highest cost-per-NVWR (needs attention)
  const efficiencyAlert = generateEfficiencyAlertInsight(data, trendAnalysis);
  insights.push(qualityData ? generateQualityAwareInsight(efficiencyAlert, qualityData, 'Channel Name') : efficiencyAlert);

  // 5. Volume Driver: Channel generating most impressions for the spend
  const volumeDriver = generateVolumeDriverInsight(data, trendAnalysis);
  insights.push(qualityData ? generateQualityAwareInsight(volumeDriver, qualityData, 'Channel Type') : volumeDriver);

  // 6. Conversion King: Highest IV-to-NVWR conversion rate
  const conversionKing = generateConversionKingInsight(data, trendAnalysis);
  insights.push(qualityData ? generateQualityAwareInsight(conversionKing, qualityData, 'Channel Name') : conversionKing);

  // 7. Budget Distribution: How spend is allocated across markets/channels
  const budgetDistribution = generateBudgetDistributionInsight(data, trendAnalysis);
  insights.push(qualityData ? generateQualityAwareInsight(budgetDistribution, qualityData, 'Channel Type') : budgetDistribution);

  // 8. Campaign Type Winner: Always On vs Tactical vs Launch performance comparison
  const campaignTypeWinner = generateCampaignTypeWinnerInsight(data, trendAnalysis);
  insights.push(qualityData ? generateQualityAwareInsight(campaignTypeWinner, qualityData, 'Campaign Type') : campaignTypeWinner);

  return insights;
};

/**
 * 1. Performance Leader: Market with highest NVWR per spend efficiency
 */
const generatePerformanceLeaderInsight = (data, trendAnalysis) => {
  const marketEfficiency = _.chain(data)
    .groupBy('Country')
    .map((group, country) => {
      const totalCost = _.sumBy(group, row => parseFloat(row['Media Cost']) || 0);
      const totalNVWR = _.sumBy(group, row => parseFloat(row.NVWR) || 0);
      const costPerNVWR = totalNVWR > 0 ? totalCost / totalNVWR : Infinity;
      return { country, costPerNVWR, totalNVWR, totalCost };
    })
    .filter(item => item.costPerNVWR !== Infinity)
    .orderBy('costPerNVWR', 'asc')
    .value();

  const leader = marketEfficiency[0];
  const second = marketEfficiency[1];

  // Get MoM trend for the leader market
  let momTrend = '';
  let trendColor = 'text-gray-600';
  if (trendAnalysis.hasMultipleMonths && trendAnalysis.trends.markets[leader.country]) {
    const marketTrend = trendAnalysis.trends.markets[leader.country];
    momTrend = ` ${marketTrend.trend} ${formatTrendChange(marketTrend.change)}`;
    trendColor = getTrendColor(marketTrend.change, 'positive');
  }

  return {
    title: "Performance Leader",
    description: `${leader.country} leads efficiency with ${formatCurrency(leader.costPerNVWR)} cost-per-NVWR, generating ${formatNumber(leader.totalNVWR)} NVWR from ${formatCurrency(leader.totalCost)} spend. ${second ? `${second.country} follows with ${formatCurrency(second.costPerNVWR)}.` : ''}`,
    value: formatCurrency(leader.costPerNVWR),
    recommendation: `Replicate ${leader.country}'s successful strategies across other markets. Focus on channel mix optimization and creative performance.`,
    momTrend,
    trendColor
  };
};

/**
 * 2. Channel Champion: Best performing channel type by cost-per-NVWR
 */
const generateChannelChampionInsight = (data, trendAnalysis) => {
  const channelPerformance = _.chain(data)
    .groupBy('Channel Type')
    .map((group, channelType) => {
      const totalCost = _.sumBy(group, row => parseFloat(row['Media Cost']) || 0);
      const totalNVWR = _.sumBy(group, row => parseFloat(row.NVWR) || 0);
      const totalImpressions = _.sumBy(group, row => parseFloat(row.Impressions) || 0);
      const totalClicks = _.sumBy(group, row => parseFloat(row.Clicks) || 0);
      
      const costPerNVWR = totalNVWR > 0 ? totalCost / totalNVWR : Infinity;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      
      return { channelType, costPerNVWR, ctr, totalNVWR, totalCost };
    })
    .filter(item => item.costPerNVWR !== Infinity)
    .orderBy('costPerNVWR', 'asc')
    .value();

  const champion = channelPerformance[0];
  const second = channelPerformance[1];

  // Get MoM trend for the champion channel
  let momTrend = '';
  let trendColor = 'text-gray-600';
  if (trendAnalysis.hasMultipleMonths && trendAnalysis.trends.channels[champion.channelType]) {
    const channelTrend = trendAnalysis.trends.channels[champion.channelType];
    momTrend = ` ${channelTrend.trend} ${formatTrendChange(channelTrend.efficiencyChange)}`;
    trendColor = getTrendColor(channelTrend.efficiencyChange, 'negative'); // Cost efficiency - lower is better
  }

  return {
    title: "Channel Champion",
    description: `${champion.channelType} delivers best ROI with ${formatCurrency(champion.costPerNVWR)} cost-per-NVWR and ${champion.ctr.toFixed(2)}% CTR. Generated ${formatNumber(champion.totalNVWR)} NVWR from ${formatCurrency(champion.totalCost)}. ${second ? `${second.channelType} follows with ${formatCurrency(second.costPerNVWR)}.` : ''}`,
    value: formatCurrency(champion.costPerNVWR),
    recommendation: `Increase budget allocation to ${champion.channelType} by 20-30%. Optimize bidding strategies and creative assets for maximum performance.`,
    momTrend,
    trendColor
  };
};

/**
 * 3. Model Spotlight: Top model by NVWR generation
 */
const generateModelSpotlightInsight = (data, trendAnalysis) => {
  const modelPerformance = _.chain(data)
    .groupBy('Model')
    .map((group, model) => {
      const totalNVWR = _.sumBy(group, row => parseFloat(row.NVWR) || 0);
      const totalCost = _.sumBy(group, row => parseFloat(row['Media Cost']) || 0);
      const totalImpressions = _.sumBy(group, row => parseFloat(row.Impressions) || 0);
      const totalIV = _.sumBy(group, row => parseFloat(row.IV) || 0);
      
      const costPerNVWR = totalNVWR > 0 ? totalCost / totalNVWR : Infinity;
      const ivToNvwrRate = totalIV > 0 ? (totalNVWR / totalIV) * 100 : 0;
      
      return { model, totalNVWR, costPerNVWR, totalImpressions, ivToNvwrRate };
    })
    .filter(item => item.totalNVWR > 0)
    .orderBy('totalNVWR', 'desc')
    .value();

  const spotlight = modelPerformance[0];
  const second = modelPerformance[1];

  // Get MoM trend for overall NVWR (since we don't have model-specific trends yet)
  let momTrend = '';
  let trendColor = 'text-gray-600';
  if (trendAnalysis.hasMultipleMonths && trendAnalysis.trends.nvwr) {
    const nvwrTrend = trendAnalysis.trends.nvwr;
    momTrend = ` ${nvwrTrend.trend} ${formatTrendChange(nvwrTrend.change)}`;
    trendColor = getTrendColor(nvwrTrend.change, 'positive');
  }

  return {
    title: "Model Spotlight",
    description: `${spotlight.model} generates ${formatNumber(spotlight.totalNVWR)} NVWR with ${formatCurrency(spotlight.costPerNVWR)} cost-per-NVWR and ${spotlight.ivToNvwrRate.toFixed(1)}% IV-to-NVWR conversion. ${second ? `${second.model} follows with ${formatNumber(second.totalNVWR)} NVWR.` : ''}`,
    value: formatNumber(spotlight.totalNVWR),
    recommendation: `Scale ${spotlight.model} campaigns across all markets. Develop case studies and creative assets to boost other models in the portfolio.`,
    momTrend,
    trendColor
  };
};

/**
 * 4. Efficiency Alert: Market with highest cost-per-NVWR (needs attention)
 */
const generateEfficiencyAlertInsight = (data, trendAnalysis) => {
  const marketEfficiency = _.chain(data)
    .groupBy('Country')
    .map((group, country) => {
      const totalCost = _.sumBy(group, row => parseFloat(row['Media Cost']) || 0);
      const totalNVWR = _.sumBy(group, row => parseFloat(row.NVWR) || 0);
      const costPerNVWR = totalNVWR > 0 ? totalCost / totalNVWR : Infinity;
      return { country, costPerNVWR, totalNVWR, totalCost };
    })
    .filter(item => item.costPerNVWR !== Infinity)
    .orderBy('costPerNVWR', 'desc')
    .value();

  const alert = marketEfficiency[0];
  const avgCostPerNVWR = _.meanBy(marketEfficiency, 'costPerNVWR');

  // Get MoM trend for the alert market
  let momTrend = '';
  let trendColor = 'text-gray-600';
  if (trendAnalysis.hasMultipleMonths && trendAnalysis.trends.markets[alert.country]) {
    const marketTrend = trendAnalysis.trends.markets[alert.country];
    momTrend = ` ${marketTrend.trend} ${formatTrendChange(marketTrend.change)}`;
    trendColor = getTrendColor(marketTrend.change, 'positive');
  }

  return {
    title: "Efficiency Alert",
    description: `${alert.country} has highest cost-per-NVWR at ${formatCurrency(alert.costPerNVWR)} vs. average ${formatCurrency(avgCostPerNVWR)}. Generated only ${formatNumber(alert.totalNVWR)} NVWR from ${formatCurrency(alert.totalCost)} spend.`,
    value: formatCurrency(alert.costPerNVWR),
    recommendation: `Immediate optimization needed for ${alert.country}. Review channel mix, bidding strategies, and creative performance. Consider budget reallocation to more efficient markets.`,
    momTrend,
    trendColor
  };
};

/**
 * 5. Volume Driver: Channel generating most impressions for the spend
 */
const generateVolumeDriverInsight = (data, trendAnalysis) => {
  const channelVolume = _.chain(data)
    .groupBy('Channel Type')
    .map((group, channelType) => {
      const totalCost = _.sumBy(group, row => parseFloat(row['Media Cost']) || 0);
      const totalImpressions = _.sumBy(group, row => parseFloat(row.Impressions) || 0);
      const totalClicks = _.sumBy(group, row => parseFloat(row.Clicks) || 0);
      
      const cpm = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : Infinity;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      
      return { channelType, cpm, ctr, totalImpressions, totalCost };
    })
    .filter(item => item.cpm !== Infinity)
    .orderBy('totalImpressions', 'desc')
    .value();

  const driver = channelVolume[0];
  const second = channelVolume[1];

  // Get MoM trend for the driver channel
  let momTrend = '';
  let trendColor = 'text-gray-600';
  if (trendAnalysis.hasMultipleMonths && trendAnalysis.trends.channels[driver.channelType]) {
    const channelTrend = trendAnalysis.trends.channels[driver.channelType];
    momTrend = ` ${channelTrend.trend} ${formatTrendChange(channelTrend.nvwrChange)}`;
    trendColor = getTrendColor(channelTrend.nvwrChange, 'positive');
  }

  return {
    title: "Volume Driver",
    description: `${driver.channelType} delivers ${formatNumber(driver.totalImpressions)} impressions with ${formatCurrency(driver.cpm)} CPM and ${driver.ctr.toFixed(2)}% CTR. Cost: ${formatCurrency(driver.totalCost)}. ${second ? `${second.channelType} follows with ${formatNumber(second.totalImpressions)} impressions.` : ''}`,
    value: formatNumber(driver.totalImpressions),
    recommendation: `Leverage ${driver.channelType}'s reach for brand awareness campaigns. Optimize CPM and CTR to improve cost efficiency while maintaining volume.`,
    momTrend,
    trendColor
  };
};

/**
 * 6. Conversion King: Highest IV-to-NVWR conversion rate
 */
const generateConversionKingInsight = (data, trendAnalysis) => {
  const conversionPerformance = _.chain(data)
    .groupBy('Channel Name')
    .map((group, channelName) => {
      const totalIV = _.sumBy(group, row => parseFloat(row.IV) || 0);
      const totalNVWR = _.sumBy(group, row => parseFloat(row.NVWR) || 0);
      const totalCost = _.sumBy(group, row => parseFloat(row['Media Cost']) || 0);
      
      const conversionRate = totalIV > 0 ? (totalNVWR / totalIV) * 100 : 0;
      const costPerNVWR = totalNVWR > 0 ? totalCost / totalNVWR : Infinity;
      
      return { channelName, conversionRate, costPerNVWR, totalIV, totalNVWR };
    })
    .filter(item => item.conversionRate > 0 && item.totalIV > 10) // Minimum threshold
    .orderBy('conversionRate', 'desc')
    .value();

  const king = conversionPerformance[0];
  const second = conversionPerformance[1];

  // Handle case where no conversion data is available
  if (!king) {
    return {
      title: "Conversion King",
      description: "No sufficient IV-to-NVWR conversion data available for analysis.",
      value: "N/A",
      recommendation: "Ensure IV tracking is properly configured to analyze conversion performance.",
      momTrend: '',
      trendColor: 'text-gray-600'
    };
  }

  // Get MoM trend for overall NVWR (since conversion is channel-specific)
  let momTrend = '';
  let trendColor = 'text-gray-600';
  if (trendAnalysis.hasMultipleMonths && trendAnalysis.trends.nvwr) {
    const nvwrTrend = trendAnalysis.trends.nvwr;
    momTrend = ` ${nvwrTrend.trend} ${formatTrendChange(nvwrTrend.change)}`;
    trendColor = getTrendColor(nvwrTrend.change, 'positive');
  }

  return {
    title: "Conversion King",
    description: `${king.channelName} achieves ${king.conversionRate.toFixed(1)}% IV-to-NVWR conversion with ${formatCurrency(king.costPerNVWR)} cost-per-NVWR. Converted ${formatNumber(king.totalNVWR)} from ${formatNumber(king.totalIV)} IV. ${second ? `${second.channelName} follows with ${second.conversionRate.toFixed(1)}%.` : ''}`,
    value: `${king.conversionRate.toFixed(1)}%`,
    recommendation: `Study ${king.channelName}'s conversion funnel and apply learnings to other channels. Focus on post-IV engagement and lead nurturing strategies.`,
    momTrend,
    trendColor
  };
};

/**
 * 7. Budget Distribution: How spend is allocated across markets/channels
 */
const generateBudgetDistributionInsight = (data, trendAnalysis) => {
  const totalSpend = _.sumBy(data, row => parseFloat(row['Media Cost']) || 0);
  
  // Market distribution
  const marketDistribution = _.chain(data)
    .groupBy('Country')
    .map((group, country) => {
      const spend = _.sumBy(group, row => parseFloat(row['Media Cost']) || 0);
      return { country, spend, percentage: (spend / totalSpend) * 100 };
    })
    .orderBy('spend', 'desc')
    .value();

  // Channel distribution
  const channelDistribution = _.chain(data)
    .groupBy('Channel Type')
    .map((group, channelType) => {
      const spend = _.sumBy(group, row => parseFloat(row['Media Cost']) || 0);
      return { channelType, spend, percentage: (spend / totalSpend) * 100 };
    })
    .orderBy('spend', 'desc')
    .value();

  const topMarket = marketDistribution[0];
  const topChannel = channelDistribution[0];

  // Get MoM trend for overall cost efficiency
  let momTrend = '';
  let trendColor = 'text-gray-600';
  if (trendAnalysis.hasMultipleMonths && trendAnalysis.trends.costEfficiency) {
    const efficiencyTrend = trendAnalysis.trends.costEfficiency;
    momTrend = ` ${efficiencyTrend.trend} ${formatTrendChange(efficiencyTrend.efficiencyChange)}`;
    trendColor = getTrendColor(efficiencyTrend.efficiencyChange, 'negative'); // Cost efficiency - lower is better
  }

  return {
    title: "Budget Distribution",
    description: `Total spend: ${formatCurrency(totalSpend)}. ${topMarket.country} receives ${topMarket.percentage.toFixed(1)}% (${formatCurrency(topMarket.spend)}), ${topChannel.channelType} gets ${topChannel.percentage.toFixed(1)}% (${formatCurrency(topChannel.spend)}).`,
    value: formatCurrency(totalSpend),
    recommendation: `Review budget allocation based on performance data. Consider rebalancing towards higher-performing markets and channels for better ROI.`,
    momTrend,
    trendColor
  };
};

/**
 * 8. Campaign Type Winner: Always On vs Tactical vs Launch performance comparison
 */
const generateCampaignTypeWinnerInsight = (data, trendAnalysis) => {
  const campaignPerformance = _.chain(data)
    .groupBy('Campaign Type')
    .map((group, campaignType) => {
      const totalCost = _.sumBy(group, row => parseFloat(row['Media Cost']) || 0);
      const totalNVWR = _.sumBy(group, row => parseFloat(row.NVWR) || 0);
      const totalImpressions = _.sumBy(group, row => parseFloat(row.Impressions) || 0);
      const totalClicks = _.sumBy(group, row => parseFloat(row.Clicks) || 0);
      
      const costPerNVWR = totalNVWR > 0 ? totalCost / totalNVWR : Infinity;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      
      return { campaignType, costPerNVWR, ctr, totalNVWR, totalCost };
    })
    .filter(item => item.costPerNVWR !== Infinity)
    .orderBy('costPerNVWR', 'asc')
    .value();

  const winner = campaignPerformance[0];
  const second = campaignPerformance[1];

  // Get MoM trend for overall cost efficiency
  let momTrend = '';
  let trendColor = 'text-gray-600';
  if (trendAnalysis.hasMultipleMonths && trendAnalysis.trends.costEfficiency) {
    const efficiencyTrend = trendAnalysis.trends.costEfficiency;
    momTrend = ` ${efficiencyTrend.trend} ${formatTrendChange(efficiencyTrend.efficiencyChange)}`;
    trendColor = getTrendColor(efficiencyTrend.efficiencyChange, 'negative'); // Cost efficiency - lower is better
  }

  return {
    title: "Campaign Type Winner",
    description: `${winner.campaignType} campaigns deliver best efficiency with ${formatCurrency(winner.costPerNVWR)} cost-per-NVWR and ${winner.ctr.toFixed(2)}% CTR. Generated ${formatNumber(winner.totalNVWR)} NVWR from ${formatCurrency(winner.totalCost)}. ${second ? `${second.campaignType} follows with ${formatCurrency(second.costPerNVWR)}.` : ''}`,
    value: formatCurrency(winner.costPerNVWR),
    recommendation: `Increase ${winner.campaignType} campaign budgets by 25%. Develop best practices playbook and apply successful strategies to other campaign types.`,
    momTrend,
    trendColor
  };
};

/**
 * Utility function to format numbers with commas
 */
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(Math.round(num));
};

/**
 * Utility function to format currency
 */
const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};
