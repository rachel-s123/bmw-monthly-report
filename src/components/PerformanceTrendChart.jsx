import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { 
  processTrendData, 
  METRICS_CONFIG, 
  formatValue, 
  BMW_COLORS 
} from '../utils/trendAnalysisDataProcessor';

const PerformanceTrendChart = ({ data, availableMarkets, availableMonths }) => {
  const [selectedMetrics, setSelectedMetrics] = useState(['impressions', 'clicks', 'nvwr']);
  const [selectedMarkets, setSelectedMarkets] = useState(['all']);
  const [dateRange, setDateRange] = useState('6');
  const [sortBy, setSortBy] = useState('performance_score');

  // Process data
  const trendData = useMemo(() => {
    try {
      return processTrendData(data, selectedMetrics, selectedMarkets, dateRange);
    } catch (error) {
      console.error('Error processing trend data:', error);
      return [];
    }
  }, [data, selectedMetrics, selectedMarkets, dateRange]);

  // Get market display names
  const getMarketDisplayName = (marketCode) => {
    const marketNames = {
      'BE': 'Belgium',
      'FR': 'France',
      'DE': 'Germany',
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'UK': 'United Kingdom',
      'CS': 'Central Southern Europe',
      'NE': 'Nordics',
      'PT': 'Portugal'
    };
    return marketNames[marketCode] || marketCode;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => {
            const metric = entry.dataKey;
            const momChange = trendData.find(d => d.monthName === label)?.[`${metric}_mom`];
            const isSignificant = momChange && Math.abs(momChange) > 20;
            
            return (
              <div key={`${metric}-${index}`} className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {METRICS_CONFIG.volume[metric]?.label || metric}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {formatValue(entry.value, METRICS_CONFIG.volume[metric]?.format)}
                  </div>
                  {momChange !== null && momChange !== undefined && (
                    <div className={`text-xs flex items-center ${
                      momChange > 0 ? 'text-green-600' : momChange < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {isSignificant && (
                        momChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {momChange > 0 ? '+' : ''}{typeof momChange === 'number' ? momChange.toFixed(1) : '0.0'}% MoM
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Export chart as PNG
  const exportChart = () => {
    const chartElement = document.querySelector('.performance-trend-chart');
    if (chartElement) {
      console.log('Exporting chart...');
    }
  };

  // Toggle metric selection
  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Toggle market selection
  const toggleMarket = (market) => {
    setSelectedMarkets(prev => {
      if (market === 'all') {
        return ['all'];
      }
      if (prev.includes('all')) {
        return [market];
      }
      return prev.includes(market) 
        ? prev.filter(m => m !== market)
        : [...prev, market];
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Multi-Metric Performance Trends</h3>
          <p className="text-gray-600 mt-1">Track key performance indicators over time</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportChart}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500 focus:border-bmw-500"
          >
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Markets:</label>
          <select
            value={selectedMarkets[0]}
            onChange={(e) => toggleMarket(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500 focus:border-bmw-500"
          >
            <option value="all">All Markets</option>
            {availableMarkets.map(market => (
              <option key={market} value={market}>
                {getMarketDisplayName(market)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500 focus:border-bmw-500"
          >
            <option value="performance_score">Performance Score</option>
            <option value="nvwr">NVWR</option>
            <option value="spend">Total Spend</option>
            <option value="ctr">CTR</option>
          </select>
        </div>
      </div>

      {/* Metric Toggles Only */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Select Metrics:</h4>
        <div className="flex flex-wrap gap-3">
          {Object.entries(METRICS_CONFIG.volume).map(([key, config]) => (
            <label key={`metric-${key}`} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(key)}
                onChange={() => toggleMetric(key)}
                className="rounded border-gray-300 text-bmw-600 focus:ring-bmw-500"
              />
              <span className="text-sm text-gray-700">{config.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Data Availability Warning */}
      {trendData.length <= 1 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Limited Data Available</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Only {trendData.length} month of data is available. For meaningful trend analysis, upload data from multiple months.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart and Commentary Side by Side */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Chart Block - Left Column */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-4">
            <div className="performance-trend-chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 15, right: 25, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthName" 
                    stroke="#6b7280"
                    fontSize={11}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#6b7280"
                    fontSize={11}
                    tickFormatter={(value) => formatValue(value, 'number')}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#6b7280"
                    fontSize={11}
                    tickFormatter={(value) => formatValue(value, 'percentage')}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Volume metrics on left Y-axis */}
                  {selectedMetrics.map((metric, index) => {
                    const config = METRICS_CONFIG.volume[metric];
                    if (!config) return null;
                    
                    return (
                      <Line
                        key={metric}
                        type="monotone"
                        dataKey={metric}
                        stroke={config.color}
                        strokeWidth={2}
                        dot={{ fill: config.color, strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: config.color, strokeWidth: 2 }}
                        yAxisId="left"
                        name={config.label}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Info */}
            <div className="mt-3 text-xs text-gray-500">
              <p>• Dots highlight significant changes (&gt;20% MoM)</p>
              <p>• Hover for detailed values and month-over-month changes</p>
              <p>• Data shows {selectedMarkets.includes('all') ? 'all markets' : selectedMarkets.join(', ')} over the last {dateRange} months</p>
            </div>
          </div>
        </div>

        {/* Commentary Block - Right Column */}
        <div className="lg:w-1/3">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
              <h4 className="text-base font-semibold text-gray-900">Performance Insights</h4>
            </div>
            
            <div className="space-y-3">
              {/* What the visualization shows */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">📊 What This Shows</h5>
                <p className="text-xs text-gray-700 leading-relaxed">
                  This trend analysis reveals how your marketing performance has evolved over time, showing the journey from initial impressions through to final conversions.
                </p>
              </div>

              {/* Key insights */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">🔍 Key Insights</h5>
                <div className="space-y-1">
                  {trendData.length > 0 && (
                    <>
                      {(() => {
                        const latestData = trendData[trendData.length - 1];
                        const previousData = trendData[trendData.length - 2];
                        const insights = [];
                        
                        // Generate insights based on selected metrics
                        selectedMetrics.forEach(metric => {
                          const config = METRICS_CONFIG.volume[metric];
                          if (latestData && previousData && latestData[metric] && previousData[metric]) {
                            const change = ((latestData[metric] - previousData[metric]) / previousData[metric]) * 100;
                            const trend = change > 0 ? 'increased' : 'decreased';
                            const absChange = Math.abs(change);
                            
                            if (absChange > 10) {
                              insights.push(
                                <div key={metric} className="flex items-start space-x-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                  <p className="text-xs text-gray-700">
                                    <span className="font-medium">{config.label}</span> {trend} by <span className="font-semibold">{absChange.toFixed(1)}%</span> vs previous period.
                                  </p>
                                </div>
                              );
                            }
                          }
                        });
                        
                        return insights.length > 0 ? insights : (
                          <p className="text-xs text-gray-700">
                            Performance trends are relatively stable across the selected metrics.
                          </p>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>

              {/* How to interpret */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">💡 How to Interpret</h5>
                <div className="space-y-1 text-xs text-gray-700">
                  <div>
                    <p className="font-medium mb-0.5">📈 Upward Trends</p>
                    <p>Consistent growth indicates effective strategies.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">📉 Declining Trends</p>
                    <p>May signal market saturation or strategy fatigue.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">🔄 Seasonal Patterns</p>
                    <p>Look for recurring patterns for future planning.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">⚡ Significant Changes</p>
                    <p>Large spikes often indicate external factors.</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">🎯 Recommendations</h5>
                <div className="space-y-1">
                  {trendData.length > 0 && (
                    <>
                      {(() => {
                        const recommendations = [];
                        const latestData = trendData[trendData.length - 1];
                        
                        // Generate recommendations based on data
                        if (latestData) {
                          const totalImpressions = latestData.impressions || 0;
                          const totalClicks = latestData.clicks || 0;
                          const totalIV = latestData.iv || 0;
                          const totalNVWR = latestData.nvwr || 0;
                          
                          if (totalImpressions > 0) {
                            const ctr = (totalClicks / totalImpressions) * 100;
                            if (ctr < 1) {
                              recommendations.push(
                                <div key="ctr" className="flex items-start space-x-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                  <p className="text-xs text-gray-700">
                                    <span className="font-medium">Low CTR:</span> {ctr.toFixed(2)}% - consider A/B testing ad creatives.
                                  </p>
                                </div>
                              );
                            }
                          }
                          
                          if (totalClicks > 0) {
                            const cvr = (totalNVWR / totalClicks) * 100;
                            if (cvr < 2) {
                              recommendations.push(
                                <div key="cvr" className="flex items-start space-x-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                  <p className="text-xs text-gray-700">
                                    <span className="font-medium">Low CVR:</span> {cvr.toFixed(1)}% - focus on improving user journey.
                                  </p>
                                </div>
                              );
                            }
                          }
                        }
                        
                        if (recommendations.length === 0) {
                          recommendations.push(
                            <div key="general" className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <p className="text-xs text-gray-700">
                                <span className="font-medium">Continue Monitoring:</span> Current performance appears stable.
                              </p>
                            </div>
                          );
                        }
                        
                        return recommendations;
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrendChart; 