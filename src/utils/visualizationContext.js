/**
 * Determine visualization context based on selected filters
 * This helps decide which charts to show and how to configure them
 */
export const getVisualizationContext = (selectedMarket, selectedMonth, availableMarkets, availableMonths) => {
  const isSingleMarket = selectedMarket !== 'all';
  const isSingleMonth = selectedMonth !== 'all';
  const hasMultipleMarkets = availableMarkets.length > 1;
  const hasMultipleMonths = availableMonths.length > 1;

  // Context 1: Single Market, Single Month
  if (isSingleMarket && isSingleMonth) {
    return {
      type: 'single_market_single_month',
      title: 'Market & Month Focus',
      description: 'Detailed analysis for specific market and month',
      charts: [
        'channel_distribution',
        'funnel_chart',
        'mom_comparison',
        'kpi_summary'
      ],
      allowMarketFilter: false,
      allowMonthFilter: false,
      showTrends: false
    };
  }

  // Context 2: All Markets, Single Month
  if (!isSingleMarket && isSingleMonth) {
    return {
      type: 'all_markets_single_month',
      title: 'Market Comparison',
      description: 'Compare all markets for the selected month',
      charts: [
        'market_comparison',
        'channel_distribution',
        'funnel_chart',
        'market_performance_table'
      ],
      allowMarketFilter: true,
      allowMonthFilter: false,
      showTrends: false
    };
  }

  // Context 3: Single Market, All Months
  if (isSingleMarket && !isSingleMonth) {
    return {
      type: 'single_market_all_months',
      title: 'Market Trends',
      description: 'Performance trends over time for the selected market',
      charts: [
        'kpi_trends',
        'monthly_comparison',
        'channel_trends',
        'performance_summary'
      ],
      allowMarketFilter: false,
      allowMonthFilter: true,
      showTrends: true
    };
  }

  // Context 4: All Markets, All Months
  if (!isSingleMarket && !isSingleMonth) {
    return {
      type: 'all_markets_all_months',
      title: 'Overall Performance',
      description: 'Complete overview across all markets and time periods',
      charts: [
        'overall_summary',
        'market_overview',
        'monthly_overview',
        'performance_heatmap'
      ],
      allowMarketFilter: true,
      allowMonthFilter: true,
      showTrends: true
    };
  }

  // Default fallback
  return {
    type: 'default',
    title: 'Dashboard',
    description: 'Performance overview',
    charts: ['summary_cards'],
    allowMarketFilter: true,
    allowMonthFilter: true,
    showTrends: false
  };
};

/**
 * Get chart configuration based on context
 */
export const getChartConfig = (context, data, selectedMarket, selectedMonth) => {
  const configs = {
    // Channel Distribution Chart
    channel_distribution: {
      title: 'Channel Performance Distribution',
      type: 'bar',
      dataKey: 'channel_type',
      valueKey: 'spend',
      secondaryValueKey: 'nvwr',
      colorScheme: 'category',
      height: 400,
      showLegend: true,
      allowFilter: context.allowMarketFilter
    },

    // Funnel Chart
    funnel_chart: {
      title: 'Conversion Funnel',
      type: 'funnel',
      stages: [
        { key: 'impressions', label: 'Impressions', color: '#3B82F6' },
        { key: 'clicks', label: 'Clicks', color: '#10B981' },
        { key: 'leads', label: 'Leads', color: '#F59E0B' },
        { key: 'nvwr', label: 'NVWR', color: '#EF4444' }
      ],
      height: 400,
      showPercentages: true
    },

    // MoM Comparison Chart
    mom_comparison: {
      title: 'Month-over-Month Comparison',
      type: 'comparison',
      currentPeriod: selectedMonth,
      previousPeriod: getPreviousMonth(selectedMonth),
      metrics: ['spend', 'impressions', 'clicks', 'nvwr', 'leads'],
      height: 300,
      showPercentageChange: true
    },

    // KPI Trends Chart
    kpi_trends: {
      title: 'KPI Trends Over Time',
      type: 'line',
      xAxis: 'month',
      yAxis: 'value',
      series: [
        { key: 'spend', label: 'Spend', color: '#3B82F6' },
        { key: 'impressions', label: 'Impressions', color: '#10B981' },
        { key: 'clicks', label: 'Clicks', color: '#F59E0B' },
        { key: 'nvwr', label: 'NVWR', color: '#EF4444' }
      ],
      height: 400,
      showLegend: true
    },

    // Market Comparison Chart
    market_comparison: {
      title: 'Market Performance Comparison',
      type: 'bar',
      dataKey: 'market',
      valueKey: 'spend',
      secondaryValueKey: 'nvwr',
      colorScheme: 'category',
      height: 400,
      showLegend: true,
      allowFilter: true
    },

    // Performance Summary
    performance_summary: {
      title: 'Performance Summary',
      type: 'summary_cards',
      metrics: ['total_spend', 'total_impressions', 'total_clicks', 'total_nvwr'],
      layout: 'grid',
      showMoM: true
    }
  };

  return configs;
};

/**
 * Get previous month for MoM comparisons
 */
const getPreviousMonth = (currentMonth) => {
  if (currentMonth === 'all') return 'all';
  
  const [year, month] = currentMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 2, 1); // -2 because month is 0-indexed
  
  const prevYear = date.getFullYear();
  const prevMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  
  return `${prevYear}-${prevMonth}`;
};

/**
 * Prepare data for specific chart types
 */
export const prepareChartData = (data, chartType, context) => {
  switch (chartType) {
    case 'channel_distribution':
      return prepareChannelDistributionData(data);
    
    case 'funnel_chart':
      return prepareFunnelData(data);
    
    case 'kpi_trends':
      return prepareKPITrendsData(data);
    
    case 'market_comparison':
      return prepareMarketComparisonData(data);
    
    case 'performance_summary':
      return preparePerformanceSummaryData(data);
    
    default:
      return data;
  }
};

/**
 * Prepare channel distribution data
 */
const prepareChannelDistributionData = (data) => {
  const channelData = {};
  
  data.forEach(row => {
    const channel = row['Channel Type'] || 'Unknown';
    if (!channelData[channel]) {
      channelData[channel] = {
        channel_type: channel,
        spend: 0,
        impressions: 0,
        clicks: 0,
        nvwr: 0,
        leads: 0
      };
    }
    
    channelData[channel].spend += parseFloat(row['Media Cost']) || 0;
    channelData[channel].impressions += parseFloat(row['Impressions']) || 0;
    channelData[channel].clicks += parseFloat(row['Clicks']) || 0;
    channelData[channel].nvwr += parseFloat(row['NVWR']) || 0;
    channelData[channel].leads += parseFloat(row['Meta_Leads']) || 0;
  });
  
  return Object.values(channelData).sort((a, b) => b.spend - a.spend);
};

/**
 * Prepare funnel data
 */
const prepareFunnelData = (data) => {
  const totals = {
    impressions: 0,
    clicks: 0,
    leads: 0,
    nvwr: 0
  };
  
  data.forEach(row => {
    totals.impressions += parseFloat(row['Impressions']) || 0;
    totals.clicks += parseFloat(row['Clicks']) || 0;
    totals.leads += parseFloat(row['Meta_Leads']) || 0;
    totals.nvwr += parseFloat(row['NVWR']) || 0;
  });
  
  return [
    { stage: 'Impressions', value: totals.impressions, percentage: 100 },
    { stage: 'Clicks', value: totals.clicks, percentage: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0 },
    { stage: 'Leads', value: totals.leads, percentage: totals.clicks > 0 ? (totals.leads / totals.clicks) * 100 : 0 },
    { stage: 'NVWR', value: totals.nvwr, percentage: totals.leads > 0 ? (totals.nvwr / totals.leads) * 100 : 0 }
  ];
};

/**
 * Prepare KPI trends data
 */
const prepareKPITrendsData = (data) => {
  const monthlyData = {};
  
  data.forEach(row => {
    const monthKey = `${row.year}-${row.month.toString().padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        spend: 0,
        impressions: 0,
        clicks: 0,
        nvwr: 0,
        leads: 0
      };
    }
    
    monthlyData[monthKey].spend += parseFloat(row['Media Cost']) || 0;
    monthlyData[monthKey].impressions += parseFloat(row['Impressions']) || 0;
    monthlyData[monthKey].clicks += parseFloat(row['Clicks']) || 0;
    monthlyData[monthKey].nvwr += parseFloat(row['NVWR']) || 0;
    monthlyData[monthKey].leads += parseFloat(row['Meta_Leads']) || 0;
  });
  
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Prepare market comparison data
 */
const prepareMarketComparisonData = (data) => {
  const marketData = {};
  
  data.forEach(row => {
    if (row.file_source) {
      const match = row.file_source.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/);
      if (match) {
        const market = match[1];
        if (!marketData[market]) {
          marketData[market] = {
            market: market,
            spend: 0,
            impressions: 0,
            clicks: 0,
            nvwr: 0,
            leads: 0
          };
        }
        
        marketData[market].spend += parseFloat(row['Media Cost']) || 0;
        marketData[market].impressions += parseFloat(row['Impressions']) || 0;
        marketData[market].clicks += parseFloat(row['Clicks']) || 0;
        marketData[market].nvwr += parseFloat(row['NVWR']) || 0;
        marketData[market].leads += parseFloat(row['Meta_Leads']) || 0;
      }
    }
  });
  
  return Object.values(marketData).sort((a, b) => b.spend - a.spend);
};

/**
 * Prepare performance summary data
 */
const preparePerformanceSummaryData = (data) => {
  const totals = {
    total_spend: 0,
    total_impressions: 0,
    total_clicks: 0,
    total_nvwr: 0,
    total_leads: 0
  };
  
  data.forEach(row => {
    totals.total_spend += parseFloat(row['Media Cost']) || 0;
    totals.total_impressions += parseFloat(row['Impressions']) || 0;
    totals.total_clicks += parseFloat(row['Clicks']) || 0;
    totals.total_nvwr += parseFloat(row['NVWR']) || 0;
    totals.total_leads += parseFloat(row['Meta_Leads']) || 0;
  });
  
  return totals;
}; 