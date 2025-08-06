import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Award,
  Target
} from 'lucide-react';
import { 
  processHeatmapData, 
  getSparklineData,
  formatValue, 
  getPerformanceColor, 
  BMW_COLORS 
} from '../utils/trendAnalysisDataProcessor';

const MarketPerformanceHeatmap = ({ data, availableMonths }) => {
  const [selectedMonth, setSelectedMonth] = useState('latest');
  const [sortBy, setSortBy] = useState('performance_score');
  const [sortDirection, setSortDirection] = useState('desc');

  // Sort data function
  const sortData = (data, sortBy, direction) => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'cost_per_nvwr') {
        comparison = a[sortBy] - b[sortBy]; // Lower is better
      } else {
        comparison = b[sortBy] - a[sortBy]; // Higher is better
      }
      return direction === 'desc' ? comparison : -comparison;
    });
  };

  // Process heatmap data
  const heatmapData = useMemo(() => {
    try {
      const processed = processHeatmapData(data, selectedMonth);
      return sortData(processed, sortBy, sortDirection);
    } catch (error) {
      console.error('Error processing heatmap data:', error);
      return [];
    }
  }, [data, selectedMonth, sortBy, sortDirection]);

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

  // Get cell color based on percentile
  const getCellColor = (percentile, metric) => {
    if (metric === 'cost_per_nvwr') {
      // For cost, lower is better (invert the logic)
      if (percentile >= 75) return BMW_COLORS.success; // Top 25% (lowest cost)
      if (percentile >= 25) return BMW_COLORS.warning; // Middle 50%
      return BMW_COLORS.danger; // Bottom 25% (highest cost)
    } else {
      // For other metrics, higher is better
      if (percentile >= 75) return BMW_COLORS.success; // Top 25%
      if (percentile >= 25) return BMW_COLORS.warning; // Middle 50%
      return BMW_COLORS.danger; // Bottom 25%
    }
  };

  // Get rank text
  const getRankText = (rank, total) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  // Export chart
  const exportChart = () => {
    console.log('Exporting heatmap...');
  };

  // Handle sort change
  const handleSortChange = (metric) => {
    if (sortBy === metric) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(metric);
      setSortDirection('desc');
    }
  };

  // Metrics configuration
  const metrics = [
    { key: 'nvwr', label: 'NVWR', format: 'number' },
    { key: 'cost_per_nvwr', label: 'Cost per NVWR', format: 'currency' },
    { key: 'ctr', label: 'CTR', format: 'percentage' },
    { key: 'spend', label: 'Total Spend', format: 'currency' },
    { key: 'conversion_rate', label: 'Conversion Rate', format: 'percentage' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Market Performance Heatmap</h3>
          <p className="text-gray-600 mt-1">
            {selectedMonth === 'latest' ? 'Latest Month' : new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} • 
            Performance rankings across markets
          </p>
        </div>
        <button
          onClick={exportChart}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bmw-500 transition-colors duration-200"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Month Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500 focus:border-bmw-500"
          >
            <option value="latest">Latest Month</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500 focus:border-bmw-500"
          >
            <option value="performance_score">Performance Score</option>
            <option value="nvwr">NVWR</option>
            <option value="cost_per_nvwr">Cost per NVWR</option>
            <option value="ctr">CTR</option>
            <option value="spend">Total Spend</option>
            <option value="conversion_rate">Conversion Rate</option>
          </select>
        </div>
      </div>

      {/* Heatmap Table and Commentary Side by Side */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Heatmap Table - Left Column */}
        <div className="lg:w-2/3">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 text-sm">Market</th>
                  {metrics.map(metric => (
                    <th 
                      key={metric.key}
                      className="text-center py-2 px-3 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors duration-200 text-sm"
                      onClick={() => handleSortChange(metric.key)}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>{metric.label}</span>
                        {sortBy === metric.key && (
                          <span className="text-bmw-600">
                            {sortDirection === 'desc' ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-2 px-3 font-semibold text-gray-900 text-sm">Performance Score</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-900 text-sm">Trend</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((market, index) => (
                  <tr key={market.market} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                    {/* Market Name */}
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-bmw-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-bmw-600">{market.market}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {getMarketDisplayName(market.market)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getRankText(index + 1, heatmapData.length)} overall
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Metric Cells */}
                    {metrics.map(metric => {
                      const value = market[metric.key];
                      const percentile = market[`${metric.key}_percentile`];
                      const rank = market[`${metric.key}_rank`];
                      const cellColor = getCellColor(percentile, metric.key);

                      return (
                        <td key={metric.key} className="py-2 px-3 text-center">
                          <div 
                            className="inline-block px-2 py-1 rounded text-xs font-medium text-white transition-all duration-200 hover:scale-105 cursor-pointer"
                            style={{ backgroundColor: cellColor }}
                            title={`${getRankText(rank, heatmapData.length)} best ${metric.label}`}
                          >
                            {formatValue(value, metric.format)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {getRankText(rank, heatmapData.length)}
                          </div>
                        </td>
                      );
                    })}

                    {/* Performance Score */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-bmw-500 to-bmw-600 rounded-full flex items-center justify-center">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">
                            {market.performance_score.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      </div>
                    </td>

                    {/* Trend Sparkline */}
                    <td className="py-2 px-3 text-center">
                      <div className="w-12 h-6 bg-gray-100 rounded flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Top 25%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Middle 50%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Bottom 25%</span>
                </div>
              </div>
              <div className="text-gray-500 text-xs">
                Performance Score: NVWR (40%) + Cost Efficiency (30%) + CTR (20%) + CVR (10%)
              </div>
            </div>
          </div>

          {/* Chart Info */}
          <div className="mt-3 text-xs text-gray-500">
            <p>• Click column headers to sort by metric</p>
            <p>• Hover cells for detailed rankings</p>
            <p>• Performance score weights all metrics for overall ranking</p>
          </div>
        </div>

        {/* Commentary Block - Right Column */}
        <div className="lg:w-1/3">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center mb-3">
              <Award className="h-4 w-4 text-purple-600 mr-2" />
              <h4 className="text-base font-semibold text-gray-900">Market Performance Insights</h4>
            </div>
            
            <div className="space-y-3">
              {/* What the visualization shows */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">📊 What This Shows</h5>
                <p className="text-xs text-gray-700 leading-relaxed">
                  This market performance heatmap reveals how different markets are performing across key metrics, creating a competitive landscape view. It helps identify which markets are excelling, which need attention, and where opportunities exist for cross-market learning and optimization.
                </p>
              </div>

              {/* Key insights */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">🔍 Key Insights</h5>
                <div className="space-y-1">
                  {heatmapData.length > 0 && (
                    <>
                      {(() => {
                        const insights = [];
                        
                        // Find top performer
                        const topPerformer = heatmapData[0];
                        if (topPerformer) {
                          insights.push(
                            <div key="top" className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <p className="text-xs text-gray-700">
                                <span className="font-medium">Market Leader:</span> {getMarketDisplayName(topPerformer.market)} leads with a performance score of {topPerformer.performance_score.toFixed(0)}, setting the benchmark for other markets to follow.
                              </p>
                            </div>
                          );
                        }
                        
                        // Find bottom performer
                        const bottomPerformer = heatmapData[heatmapData.length - 1];
                        if (bottomPerformer && bottomPerformer.performance_score < 50) {
                          insights.push(
                            <div key="bottom" className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <p className="text-xs text-gray-700">
                                <span className="font-medium">Needs Attention:</span> {getMarketDisplayName(bottomPerformer.market)} has the lowest performance score at {bottomPerformer.performance_score.toFixed(0)}, indicating significant optimization opportunities.
                              </p>
                            </div>
                          );
                        }
                        
                        // Find performance gaps
                        const avgScore = heatmapData.reduce((sum, market) => sum + market.performance_score, 0) / heatmapData.length;
                        const highPerformers = heatmapData.filter(market => market.performance_score > avgScore * 1.2);
                        const lowPerformers = heatmapData.filter(market => market.performance_score < avgScore * 0.8);
                        
                        if (highPerformers.length > 0 && lowPerformers.length > 0) {
                          insights.push(
                            <div key="gap" className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <p className="text-xs text-gray-700">
                                <span className="font-medium">Performance Gap:</span> There's a significant gap between high-performing markets ({highPerformers.length} markets above average) and those needing improvement ({lowPerformers.length} markets below average), suggesting opportunities for knowledge transfer.
                              </p>
                            </div>
                          );
                        }
                        
                        return insights.length > 0 ? insights : (
                          <p className="text-xs text-gray-700">
                            Market performance is relatively balanced across all regions. Continue monitoring for emerging trends or market-specific opportunities.
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
                    <p className="font-medium mb-0.5">🟢 Green Cells</p>
                    <p>Top 25% performance indicates excellence. These markets can serve as benchmarks and best practice examples.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">🟡 Yellow Cells</p>
                    <p>Middle 50% shows solid performance with room for improvement through optimization strategies.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">🔴 Red Cells</p>
                    <p>Bottom 25% signals immediate attention needed. These areas require focused optimization efforts.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">🏆 Performance Score</p>
                    <p>Weighted combination of all metrics providing an overall market health indicator.</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">🎯 Recommendations</h5>
                <div className="space-y-1">
                  {heatmapData.length > 0 && (() => {
                    const recommendations = [];
                    
                    // Find markets with specific weaknesses
                    heatmapData.forEach(market => {
                      const weaknesses = [];
                      metrics.forEach(metric => {
                        const percentile = market[`${metric.key}_percentile`];
                        if (percentile < 25) {
                          weaknesses.push(metric.label);
                        }
                      });
                      
                      if (weaknesses.length > 0) {
                        recommendations.push(
                          <div key={market.market} className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <p className="text-xs text-gray-700">
                              <span className="font-medium">{getMarketDisplayName(market.market)} Focus Areas:</span> Prioritize improving {weaknesses.slice(0, 2).join(' and ')} to boost overall market performance.
                            </p>
                          </div>
                        );
                      }
                    });
                    
                    // Cross-market learning recommendation
                    const topPerformer = heatmapData[0];
                    if (topPerformer) {
                      recommendations.push(
                        <div key="learning" className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <p className="text-xs text-gray-700">
                            <span className="font-medium">Best Practice Sharing:</span> Analyze {getMarketDisplayName(topPerformer.market)}'s strategies and consider implementing successful approaches in underperforming markets.
                          </p>
                        </div>
                      );
                    }
                    
                    if (recommendations.length === 0) {
                      recommendations.push(
                        <div key="general" className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <p className="text-xs text-gray-700">
                            <span className="font-medium">Maintain Momentum:</span> All markets are performing well. Continue current strategies while monitoring for any emerging trends or competitive changes.
                          </p>
                        </div>
                      );
                    }
                    
                    return recommendations;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPerformanceHeatmap; 