import { supabase } from './supabase.js';
import _ from 'lodash';

/**
 * Calculate KPI metrics for a dataset
 * @param {Array} data - Array of records to analyze
 * @returns {Object} KPI metrics
 */
export const calculateKPIMetrics = (data) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Core metrics
  const totalSpend = _.sumBy(data, row => parseFloat(row['Media Cost']) || 0);
  const totalImpressions = _.sumBy(data, row => parseFloat(row['Impressions']) || 0);
  const totalClicks = _.sumBy(data, row => parseFloat(row['Clicks']) || 0);
  const totalNVWR = _.sumBy(data, row => parseFloat(row['NVWR']) || 0);
  const totalLeads = _.sumBy(data, row => parseFloat(row['Meta_Leads']) || 0);

  // Calculated metrics
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cvr = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
  const costPerNVWR = totalNVWR > 0 ? totalSpend / totalNVWR : 0;
  const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

  // Channel performance breakdown
  const channelPerformance = _.chain(data)
    .groupBy('Channel Type')
    .map((group, channelType) => ({
      channel_type: channelType,
      spend: _.sumBy(group, row => parseFloat(row['Media Cost']) || 0),
      impressions: _.sumBy(group, row => parseFloat(row['Impressions']) || 0),
      clicks: _.sumBy(group, row => parseFloat(row['Clicks']) || 0),
      nvwr: _.sumBy(group, row => parseFloat(row['NVWR']) || 0),
      leads: _.sumBy(group, row => parseFloat(row['Meta_Leads']) || 0),
      cpm: _.sumBy(group, row => parseFloat(row['Impressions']) || 0) > 0 ? 
        (_.sumBy(group, row => parseFloat(row['Media Cost']) || 0) / _.sumBy(group, row => parseFloat(row['Impressions']) || 0)) * 1000 : 0,
      cpc: _.sumBy(group, row => parseFloat(row['Clicks']) || 0) > 0 ? 
        _.sumBy(group, row => parseFloat(row['Media Cost']) || 0) / _.sumBy(group, row => parseFloat(row['Clicks']) || 0) : 0,
      ctr: _.sumBy(group, row => parseFloat(row['Impressions']) || 0) > 0 ? 
        (_.sumBy(group, row => parseFloat(row['Clicks']) || 0) / _.sumBy(group, row => parseFloat(row['Impressions']) || 0)) * 100 : 0,
      cvr: _.sumBy(group, row => parseFloat(row['Clicks']) || 0) > 0 ? 
        (_.sumBy(group, row => parseFloat(row['Meta_Leads']) || 0) / _.sumBy(group, row => parseFloat(row['Clicks']) || 0)) * 100 : 0
    }))
    .value();

  // Campaign type performance breakdown
  const campaignTypePerformance = _.chain(data)
    .groupBy('Campaign Type')
    .map((group, campaignType) => ({
      campaign_type: campaignType,
      spend: _.sumBy(group, row => parseFloat(row['Media Cost']) || 0),
      impressions: _.sumBy(group, row => parseFloat(row['Impressions']) || 0),
      clicks: _.sumBy(group, row => parseFloat(row['Clicks']) || 0),
      nvwr: _.sumBy(group, row => parseFloat(row['NVWR']) || 0),
      leads: _.sumBy(group, row => parseFloat(row['Meta_Leads']) || 0),
      cpm: _.sumBy(group, row => parseFloat(row['Impressions']) || 0) > 0 ? 
        (_.sumBy(group, row => parseFloat(row['Media Cost']) || 0) / _.sumBy(group, row => parseFloat(row['Impressions']) || 0)) * 1000 : 0,
      cpc: _.sumBy(group, row => parseFloat(row['Clicks']) || 0) > 0 ? 
        _.sumBy(group, row => parseFloat(row['Media Cost']) || 0) / _.sumBy(group, row => parseFloat(row['Clicks']) || 0) : 0,
      ctr: _.sumBy(group, row => parseFloat(row['Impressions']) || 0) > 0 ? 
        (_.sumBy(group, row => parseFloat(row['Clicks']) || 0) / _.sumBy(group, row => parseFloat(row['Impressions']) || 0)) * 100 : 0,
      cvr: _.sumBy(group, row => parseFloat(row['Clicks']) || 0) > 0 ? 
        (_.sumBy(group, row => parseFloat(row['Meta_Leads']) || 0) / _.sumBy(group, row => parseFloat(row['Clicks']) || 0)) * 100 : 0
    }))
    .value();

  // Model performance breakdown
  const modelPerformance = _.chain(data)
    .groupBy('Model')
    .map((group, model) => ({
      model: model,
      spend: _.sumBy(group, row => parseFloat(row['Media Cost']) || 0),
      impressions: _.sumBy(group, row => parseFloat(row['Impressions']) || 0),
      clicks: _.sumBy(group, row => parseFloat(row['Clicks']) || 0),
      nvwr: _.sumBy(group, row => parseFloat(row['NVWR']) || 0),
      leads: _.sumBy(group, row => parseFloat(row['Meta_Leads']) || 0),
      cpm: _.sumBy(group, row => parseFloat(row['Impressions']) || 0) > 0 ? 
        (_.sumBy(group, row => parseFloat(row['Media Cost']) || 0) / _.sumBy(group, row => parseFloat(row['Impressions']) || 0)) * 1000 : 0,
      cpc: _.sumBy(group, row => parseFloat(row['Clicks']) || 0) > 0 ? 
        _.sumBy(group, row => parseFloat(row['Media Cost']) || 0) / _.sumBy(group, row => parseFloat(row['Clicks']) || 0) : 0,
      ctr: _.sumBy(group, row => parseFloat(row['Impressions']) || 0) > 0 ? 
        (_.sumBy(group, row => parseFloat(row['Clicks']) || 0) / _.sumBy(group, row => parseFloat(row['Impressions']) || 0)) * 100 : 0,
      cvr: _.sumBy(group, row => parseFloat(row['Clicks']) || 0) > 0 ? 
        (_.sumBy(group, row => parseFloat(row['Meta_Leads']) || 0) / _.sumBy(group, row => parseFloat(row['Clicks']) || 0)) * 100 : 0
    }))
    .value();

  return {
    total_spend: totalSpend,
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    total_nvwr: totalNVWR,
    total_leads: totalLeads,
    cpm: cpm,
    cpc: cpc,
    ctr: ctr,
    cvr: cvr,
    cost_per_nvwr: costPerNVWR,
    cost_per_lead: costPerLead,
    channel_performance: channelPerformance,
    campaign_type_performance: campaignTypePerformance,
    model_performance: modelPerformance,
    total_records: data.length
  };
};

/**
 * Save KPI metrics to history table
 * @param {Object} kpiMetrics - KPI metrics object
 * @param {string} marketCode - Market code (e.g., 'BE', 'FR')
 * @param {number} year - Year
 * @param {number} month - Month
 * @param {string} monthName - Month name (e.g., 'July')
 */
export const saveKPIHistory = async (kpiMetrics, marketCode, year, month, monthName) => {
  try {
    const { error } = await supabase
      .from('bmw_kpi_history')
      .upsert({
        market_code: marketCode,
        year: year,
        month: month,
        month_name: monthName,
        total_spend: kpiMetrics.total_spend,
        total_impressions: kpiMetrics.total_impressions,
        total_clicks: kpiMetrics.total_clicks,
        total_nvwr: kpiMetrics.total_nvwr,
        total_leads: kpiMetrics.total_leads,
        cpm: kpiMetrics.cpm,
        cpc: kpiMetrics.cpc,
        ctr: kpiMetrics.ctr,
        cvr: kpiMetrics.cvr,
        cost_per_nvwr: kpiMetrics.cost_per_nvwr,
        cost_per_lead: kpiMetrics.cost_per_lead,
        channel_performance: kpiMetrics.channel_performance,
        campaign_type_performance: kpiMetrics.campaign_type_performance,
        model_performance: kpiMetrics.model_performance,
        total_records: kpiMetrics.total_records
      }, {
        onConflict: 'market_code,year,month'
      });

    if (error) {
      console.error('Error saving KPI history:', error);
      throw error;
    }

    console.log(`✅ KPI history saved for ${marketCode} ${monthName} ${year}`);
  } catch (error) {
    console.error('Error saving KPI history:', error);
    throw error;
  }
};

/**
 * Get KPI history for a specific market and time period
 * @param {string} marketCode - Market code (optional, if not provided returns all)
 * @param {number} year - Year (optional)
 * @param {number} month - Month (optional)
 * @returns {Array} KPI history data
 */
export const getKPIHistory = async (marketCode = null, year = null, month = null) => {
  try {
    let query = supabase
      .from('bmw_kpi_history')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (marketCode) {
      query = query.eq('market_code', marketCode);
    }
    if (year) {
      query = query.eq('year', year);
    }
    if (month) {
      query = query.eq('month', month);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching KPI history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching KPI history:', error);
    return [];
  }
};

/**
 * Calculate Month-over-Month (MoM) change for KPI metrics
 * @param {Object} currentMetrics - Current month KPI metrics
 * @param {Object} previousMetrics - Previous month KPI metrics
 * @returns {Object} MoM change data
 */
export const calculateKPIMoMChange = (currentMetrics, previousMetrics) => {
  if (!currentMetrics || !previousMetrics) {
    return {
      spend: { change: null, percentage: null, direction: null },
      impressions: { change: null, percentage: null, direction: null },
      clicks: { change: null, percentage: null, direction: null },
      nvwr: { change: null, percentage: null, direction: null },
      leads: { change: null, percentage: null, direction: null },
      cpm: { change: null, percentage: null, direction: null },
      cpc: { change: null, percentage: null, direction: null },
      ctr: { change: null, percentage: null, direction: null },
      cvr: { change: null, percentage: null, direction: null },
      cost_per_nvwr: { change: null, percentage: null, direction: null },
      cost_per_lead: { change: null, percentage: null, direction: null }
    };
  }

  const calculateChange = (current, previous, metricName) => {
    if (previous === 0) return { change: current, percentage: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'stable' };
    
    const change = current - previous;
    const percentage = (change / previous) * 100;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    
    return { change, percentage, direction };
  };

  return {
    spend: calculateChange(currentMetrics.total_spend, previousMetrics.total_spend, 'spend'),
    impressions: calculateChange(currentMetrics.total_impressions, previousMetrics.total_impressions, 'impressions'),
    clicks: calculateChange(currentMetrics.total_clicks, previousMetrics.total_clicks, 'clicks'),
    nvwr: calculateChange(currentMetrics.total_nvwr, previousMetrics.total_nvwr, 'nvwr'),
    leads: calculateChange(currentMetrics.total_leads, previousMetrics.total_leads, 'leads'),
    cpm: calculateChange(currentMetrics.cpm, previousMetrics.cpm, 'cpm'),
    cpc: calculateChange(currentMetrics.cpc, previousMetrics.cpc, 'cpc'),
    ctr: calculateChange(currentMetrics.ctr, previousMetrics.ctr, 'ctr'),
    cvr: calculateChange(currentMetrics.cvr, previousMetrics.cvr, 'cvr'),
    cost_per_nvwr: calculateChange(currentMetrics.cost_per_nvwr, previousMetrics.cost_per_nvwr, 'cost_per_nvwr'),
    cost_per_lead: calculateChange(currentMetrics.cost_per_lead, previousMetrics.cost_per_lead, 'cost_per_lead')
  };
};

/**
 * Format KPI MoM change for display
 * @param {Object} momChange - MoM change object
 * @param {string} metric - Metric name
 * @returns {Object} Formatted display data
 */
export const formatKPIMoMChange = (momChange, metric) => {
  const change = momChange[metric];
  if (!change || change.percentage === null) {
    return { text: 'N/A', color: 'text-gray-600', direction: 'stable' };
  }

  const sign = change.direction === 'up' ? '+' : '';
  const color = change.direction === 'up' ? 'text-green-600' : 
                change.direction === 'down' ? 'text-red-600' : 'text-gray-600';
  
  return {
    text: `${sign}${change.percentage.toFixed(1)}%`,
    color: color,
    direction: change.direction,
    value: change.change
  };
}; 