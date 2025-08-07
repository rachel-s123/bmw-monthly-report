import _ from 'lodash';
import { supabase } from './supabase.js';
import { getMonthName } from './complianceHistory.js';

// Map dimension keys to their column names in the dataset
const dimensionFieldMap = {
  CampaignType: 'Campaign Type',
  ChannelType: 'Channel Type',
  ChannelName: 'Channel Name',
  Phase: 'Phase',
  Model: 'Model'
};

/**
 * Save market-level monthly totals based on 'All' dimension rows
 */
export const saveMarketMonthTotals = async (data) => {
  const allRows = data.filter(r => r.dimension === 'All');
  const grouped = _.groupBy(allRows, r => `${r.country}_${r.year}_${r.month}`);

  const records = Object.entries(grouped).map(([key, rows]) => {
    const [market_code, year, month] = key.split('_');
    return {
      market_code,
      year: parseInt(year),
      month: parseInt(month),
      month_name: getMonthName(parseInt(month)),
      media_cost: _.sumBy(rows, r => parseFloat(r['Media Cost']) || 0),
      impressions: _.sumBy(rows, r => parseFloat(r['Impressions']) || 0),
      clicks: _.sumBy(rows, r => parseFloat(r['Clicks']) || 0),
      iv: _.sumBy(rows, r => parseFloat(r['IV']) || 0),
      nvwr: _.sumBy(rows, r => parseFloat(r['NVWR']) || 0)
    };
  });

  if (records.length === 0) return;

  const { error } = await supabase
    .from('bmw_market_month_totals')
    .upsert(records, { onConflict: 'market_code,year,month' });

  if (error) {
    console.error('Error saving market month totals:', error);
    throw error;
  }
};

/**
 * Save detailed metrics breakdown by dimension and value
 */
export const saveMetricsBreakdown = async (data) => {
  const detailRows = data.filter(r => r.dimension !== 'All');
  const grouped = _.groupBy(detailRows, r => {
    const field = dimensionFieldMap[r.dimension] || r.dimension;
    const value = r[field] || 'Not Mapped';
    return `${r.country}_${r.year}_${r.month}_${r.dimension}_${value}`;
  });

  const records = Object.entries(grouped).map(([key, rows]) => {
    const [market_code, year, month, dimension, ...valueParts] = key.split('_');
    const dimension_value = valueParts.join('_');
    return {
      market_code,
      year: parseInt(year),
      month: parseInt(month),
      month_name: getMonthName(parseInt(month)),
      dimension,
      dimension_value,
      media_cost: _.sumBy(rows, r => parseFloat(r['Media Cost']) || 0),
      impressions: _.sumBy(rows, r => parseFloat(r['Impressions']) || 0),
      clicks: _.sumBy(rows, r => parseFloat(r['Clicks']) || 0),
      iv: _.sumBy(rows, r => parseFloat(r['IV']) || 0),
      nvwr: _.sumBy(rows, r => parseFloat(r['NVWR']) || 0)
    };
  });

  if (records.length === 0) return;

  const { error } = await supabase
    .from('bmw_metrics_breakdown')
    .upsert(records, { onConflict: 'market_code,year,month,dimension,dimension_value' });

  if (error) {
    console.error('Error saving metrics breakdown:', error);
    throw error;
  }
};

/**
 * Save compliance breakdown history for NOT MAPPED analysis
 */
export const saveComplianceBreakdownHistory = async (data) => {
  const detailRows = data.filter(r => r.dimension !== 'All');
  const grouped = _.groupBy(detailRows, r => `${r.country}_${r.year}_${r.month}_${r.dimension}`);

  const records = Object.entries(grouped).map(([key, rows]) => {
    const [market_code, year, month, dimension] = key.split('_');
    const field = dimensionFieldMap[dimension] || dimension;
    const unmappedRows = rows.filter(row => {
      const val = row[field];
      return !val || val.toString().trim() === '' || val.toString().toLowerCase().includes('not mapped');
    });
    const totalRecords = rows.length;
    const unmappedRecords = unmappedRows.length;
    const compliancePercentage = totalRecords > 0 ? ((totalRecords - unmappedRecords) / totalRecords) * 100 : 0;
    const totalNVWR = _.sumBy(rows, r => parseFloat(r['NVWR']) || 0);
    const unmappedNVWR = _.sumBy(unmappedRows, r => parseFloat(r['NVWR']) || 0);
    const unmappedNVWRPercentage = totalNVWR > 0 ? (unmappedNVWR / totalNVWR) * 100 : 0;

    return {
      market_code,
      year: parseInt(year),
      month: parseInt(month),
      month_name: getMonthName(parseInt(month)),
      dimension,
      total_records: totalRecords,
      unmapped_records: unmappedRecords,
      compliance_percentage: compliancePercentage,
      total_nvwr: totalNVWR,
      unmapped_nvwr: unmappedNVWR,
      unmapped_nvwr_percentage: unmappedNVWRPercentage
    };
  });

  if (records.length === 0) return;

  const { error } = await supabase
    .from('bmw_compliance_breakdown_history')
    .upsert(records, { onConflict: 'market_code,year,month,dimension' });

  if (error) {
    console.error('Error saving compliance breakdown history:', error);
    throw error;
  }
};
