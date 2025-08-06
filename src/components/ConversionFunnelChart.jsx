import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { 
  processFunnelData, 
  formatValue, 
  getPerformanceColor, 
  BMW_COLORS 
} from '../utils/trendAnalysisDataProcessor';

const ConversionFunnelChart = ({ data, availableMarkets, availableMonths }) => {
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('latest');

  // Process funnel data
  const funnelData = useMemo(() => {
    try {
      return processFunnelData(data, selectedMarket, selectedMonth);
    } catch (error) {
      console.error('Error processing funnel data:', error);
      return null;
    }
  }, [data, selectedMarket, selectedMonth]);

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

  // Export chart
  const exportChart = () => {
    console.log('Exporting funnel chart...');
  };

  if (!funnelData) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for the selected filters
        </div>
      </div>
    );
  }

  const { stages, totalSpend, selectedMarket: currentMarket, selectedMonth: currentMonth } = funnelData;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Conversion Funnel</h3>
          <p className="text-gray-600 mt-1">
            {currentMarket === 'all' ? 'All Markets' : getMarketDisplayName(currentMarket)} • 
            {currentMonth === 'latest' ? ' Latest Month' : ` ${new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
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
        {/* Market Selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Market:</label>
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
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
      </div>

      {/* Funnel Visualization and Commentary Side by Side */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Funnel Visualization - Left Column */}
        <div className="lg:w-2/3">
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const isFirst = index === 0;
              const isLast = index === stages.length - 1;
              const conversionColor = stage.conversionRate !== null 
                ? getPerformanceColor(stage.conversionRate, { good: 2, warning: 1 })
                : BMW_COLORS.neutral;

              return (
                <div key={stage.name} className="relative">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h4 className="font-semibold text-gray-900 text-sm">{stage.name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-gray-900">
                        {formatValue(stage.value, 'number')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {index === 0 ? 'Starting point' : 
                         `From ${stages[index - 1]?.name || 'previous stage'}: ${stage.conversionRate !== null ? stage.conversionRate.toFixed(1) : '0.0'}%`}
                      </div>
                    </div>
                  </div>

                  {/* Funnel Bar */}
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-lg h-8 overflow-hidden">
                      <div
                        className="h-full transition-all duration-1000 ease-out"
                        style={{
                          width: index === 0 ? '100%' : `${stage.conversionRate !== null ? stage.conversionRate : 0}%`,
                          backgroundColor: stage.color,
                          backgroundImage: `linear-gradient(90deg, ${stage.color} 0%, ${stage.color}DD 100%)`
                        }}
                      />
                    </div>
                    
                    {/* Conversion Rate Badge */}
                    {stage.conversionRate !== null && index > 0 && (
                      <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
                        <div 
                          className="px-1.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                          style={{ backgroundColor: conversionColor }}
                        >
                          {typeof stage.conversionRate === 'number' ? stage.conversionRate.toFixed(1) : '0.0'}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversion Details */}
                  {stage.conversionRate !== null && index > 0 && (
                    <div className="mt-1.5 grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">From {stages[index - 1]?.name || 'previous'}:</span>
                        <span 
                          className="font-medium"
                          style={{ color: conversionColor }}
                        >
                          {typeof stage.conversionRate === 'number' ? stage.conversionRate.toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      {stage.costPerConversion !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Cost per {stage.name}:</span>
                          <span className="font-medium text-gray-900">
                            {formatValue(stage.costPerConversion, 'currency')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Performance Indicator */}
                  {stage.conversionRate !== null && (
                    <div className="mt-1.5 flex items-center space-x-2">
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: conversionColor }}
                      />
                      <span className="text-xs text-gray-500">
                        {stage.conversionRate >= 2 ? 'Excellent' : 
                         stage.conversionRate >= 1 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-base font-bold text-gray-900">
                  {formatValue(totalSpend, 'currency')}
                </div>
                <div className="text-xs text-gray-500">Total Spend</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-gray-900">
                  {stages[0]?.value ? formatValue(stages[0].value, 'number') : '0'}
                </div>
                <div className="text-xs text-gray-500">Total Impressions</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-gray-900">
                  {stages[stages.length - 1]?.value ? formatValue(stages[stages.length - 1].value, 'number') : '0'}
                </div>
                <div className="text-xs text-gray-500">Final Conversions</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-gray-900">
                  {stages[0]?.value && stages[stages.length - 1]?.value 
                    ? ((stages[stages.length - 1].value / stages[0].value) * 100).toFixed(4)
                    : '0'}%
                </div>
                <div className="text-xs text-gray-500">Overall Conversion</div>
              </div>
            </div>
          </div>

          {/* Chart Info */}
          <div className="mt-3 text-xs text-gray-500">
            <p>• <strong>Step-to-step conversion rates:</strong> Each bar shows conversion from the previous stage</p>
            <p>• Conversion rates: Green (&gt;2%), Yellow (1-2%), Red (&lt;1%)</p>
            <p>• Cost per conversion shown for each stage</p>
            <p>• Animated funnel updates on filter changes</p>
          </div>
        </div>

        {/* Commentary Block - Right Column */}
        <div className="lg:w-1/3">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center mb-3">
              <BarChart3 className="h-4 w-4 text-green-600 mr-2" />
              <h4 className="text-base font-semibold text-gray-900">Conversion Journey Insights</h4>
            </div>
            
            <div className="space-y-3">
              {/* What the visualization shows */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">📊 What This Shows</h5>
                <p className="text-xs text-gray-700 leading-relaxed">
                  This funnel visualization shows step-to-step conversion rates, making it easier to identify where customers drop off between stages. Each bar represents the conversion rate from the previous stage, giving you a clearer picture of performance at each step of the customer journey.
                </p>
              </div>

              {/* Key insights */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">🔍 Key Insights</h5>
                <div className="space-y-1">
                  {funnelData && (
                    <>
                      {(() => {
                        const insights = [];
                        const stages = funnelData.stages || [];
                        
                        if (stages.length > 0) {
                          // Find the biggest drop-off point
                          let biggestDropoff = { stage: '', rate: 100 };
                          for (let i = 0; i < stages.length - 1; i++) {
                            const currentStage = stages[i];
                            const nextStage = stages[i + 1];
                            if (currentStage.conversionRate !== null && currentStage.conversionRate < biggestDropoff.rate) {
                              biggestDropoff = { stage: currentStage.name, rate: currentStage.conversionRate };
                            }
                          }
                          
                          if (biggestDropoff.rate < 100) {
                            insights.push(
                              <div key="dropoff" className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <p className="text-xs text-gray-700">
                                  <span className="font-medium">Conversion Bottleneck:</span> The {biggestDropoff.stage} stage shows the lowest conversion rate at {biggestDropoff.rate.toFixed(1)}%, indicating this is where most potential customers are being lost.
                                </p>
                              </div>
                            );
                          }
                          
                          // Find the strongest performing stage
                          const bestStage = stages.reduce((best, current) => 
                            current.conversionRate !== null && current.conversionRate > best.conversionRate ? current : best
                          , { conversionRate: 0 });
                          
                          if (bestStage.conversionRate > 5) {
                            insights.push(
                              <div key="best" className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <p className="text-xs text-gray-700">
                                  <span className="font-medium">Strong Performance:</span> The {bestStage.name} stage is performing exceptionally well with a {bestStage.conversionRate.toFixed(1)}% conversion rate, suggesting effective targeting or compelling offers.
                                </p>
                              </div>
                            );
                          }
                          
                          // Overall funnel health
                          const totalConversion = stages[stages.length - 1]?.percentage || 0;
                          if (totalConversion < 1) {
                            insights.push(
                              <div key="overall" className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <p className="text-xs text-gray-700">
                                  <span className="font-medium">Funnel Efficiency:</span> Only {totalConversion.toFixed(2)}% of impressions are converting to final sales, indicating significant room for optimization across the entire funnel.
                                </p>
                              </div>
                            );
                          }
                        }
                        
                        return insights.length > 0 ? insights : (
                          <p className="text-xs text-gray-700">
                            The conversion funnel shows a balanced performance across all stages. Continue monitoring for any changes in conversion patterns.
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
                    <p className="font-medium mb-0.5">🟢 Green Conversion Rates</p>
                    <p>Above 2% indicates strong performance. These stages are working well and could be scaled.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">🟡 Yellow Conversion Rates</p>
                    <p>Between 1-2% shows moderate performance. Room for improvement through optimization.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">🔴 Red Conversion Rates</p>
                    <p>Below 1% signals issues requiring immediate attention and optimization efforts.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">📊 Funnel Shape</p>
                    <p>A healthy funnel should show gradual narrowing, not sudden drops between stages.</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="font-medium text-gray-900 mb-1 text-sm">🎯 Recommendations</h5>
                <div className="space-y-1">
                  {funnelData && (() => {
                    const recommendations = [];
                    const stages = funnelData.stages || [];
                    
                    if (stages.length > 0) {
                      // Find stages with poor conversion rates
                      const poorStages = stages.filter(stage => 
                        stage.conversionRate !== null && stage.conversionRate < 1
                      );
                      
                      poorStages.forEach(stage => {
                        let recommendation = '';
                        if (stage.name === 'Impressions to Clicks') {
                          recommendation = 'Improve ad creatives, targeting, and landing page relevance to increase click-through rates.';
                        } else if (stage.name === 'Clicks to IV') {
                          recommendation = 'Optimize landing pages, improve user experience, and ensure clear call-to-actions to boost interest volume.';
                        } else if (stage.name === 'IV to NVWR') {
                          recommendation = 'Enhance lead nurturing, improve qualification processes, and provide better value propositions.';
                        } else if (stage.name === 'NVWR to DCS Orders') {
                          recommendation = 'Strengthen sales processes, improve follow-up procedures, and enhance customer relationship management.';
                        }
                        
                        if (recommendation) {
                          recommendations.push(
                            <div key={stage.name} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <p className="text-xs text-gray-700">
                                <span className="font-medium">{stage.name} Optimization:</span> {recommendation}
                              </p>
                            </div>
                          );
                        }
                      });
                      
                      // Overall funnel recommendation
                      if (recommendations.length === 0) {
                        recommendations.push(
                          <div key="general" className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <p className="text-xs text-gray-700">
                              <span className="font-medium">Maintain Performance:</span> Your conversion funnel is performing well. Continue monitoring and consider A/B testing to further optimize each stage.
                            </p>
                          </div>
                        );
                      }
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

export default ConversionFunnelChart; 