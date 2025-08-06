import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Award, BarChart3, PieChart, Activity, Clock, Layers, Target } from 'lucide-react';
import PerformanceTrendChart from './PerformanceTrendChart';
import ConversionFunnelChart from './ConversionFunnelChart';
import MarketPerformanceHeatmap from './MarketPerformanceHeatmap';
import CostEfficiencyEvolutionChart from './CostEfficiencyEvolutionChart';
import ChannelEfficiencyScatterPlot from './ChannelEfficiencyScatterPlot';
import PerformanceDistributionComponents from './PerformanceDistributionComponents';
import ChartCommentary from './ChartCommentary';

const EnhancedTrendAnalysis = ({ data, selectedMarket, selectedMonth, availableMarkets, availableMonths }) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activePhase, setActivePhase] = useState('phase1'); // 'phase1' or 'phase2'

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Activity className="h-8 w-8 mr-3" />
          <span>No data available for trend analysis</span>
        </div>
      </div>
    );
  }

  // Check if data has required structure
  const hasRequiredFields = data.some(row => 
    row && typeof row === 'object' && 
    (row.file_source || row.year || row.month)
  );

  if (!hasRequiredFields) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Activity className="h-8 w-8 mr-3" />
          <span>Data format not compatible with trend analysis</span>
        </div>
      </div>
    );
  }

  const phases = [
    {
      id: 'phase1',
      name: 'Phase 1: Core Analytics',
      icon: BarChart3,
      description: 'Essential performance metrics and trend analysis'
    },
    {
      id: 'phase2',
      name: 'Phase 2: Advanced Intelligence',
      icon: Target,
      description: 'Deep marketing intelligence and optimization insights'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">BMW Marketing Intelligence Dashboard</h2>
            <p className="text-gray-600 mt-1">Advanced analytics and performance insights across multiple dimensions</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Phase Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {phases.map((phase) => {
              const Icon = phase.icon;
              const isActive = activePhase === phase.id;
              
              return (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(phase.id)}
                  className={`
                    group relative py-2 px-1 border-b-2 font-medium text-sm
                    ${isActive 
                      ? 'border-bmw-600 text-bmw-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-bmw-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    <span>{phase.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center space-x-4 text-sm mt-4">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Market:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
              {selectedMarket === 'all' ? 'All Markets' : selectedMarket}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Period:</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">
              {selectedMonth === 'all' ? 'All Months' : new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Records:</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
              {data.length.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Phase 1: Core Analytics */}
      {activePhase === 'phase1' && (
        <div className="space-y-8">
          {/* Performance Trend Chart - Full Width */}
          <PerformanceTrendChart 
            data={data} 
            availableMarkets={availableMarkets}
            availableMonths={availableMonths}
          />

          {/* Funnel and Heatmap - Stacked Vertically */}
          <div className="space-y-6">
            <ConversionFunnelChart 
              data={data} 
              availableMarkets={availableMarkets}
              availableMonths={availableMonths}
            />
            <MarketPerformanceHeatmap 
              data={data} 
              availableMonths={availableMonths}
            />
          </div>
        </div>
      )}

      {/* Phase 2: Advanced Intelligence */}
      {activePhase === 'phase2' && (
        <div className="space-y-8">
          {/* Cost Efficiency Evolution - Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <CostEfficiencyEvolutionChart 
                data={data} 
                availableMarkets={availableMarkets}
                availableMonths={availableMonths}
              />
            </div>
            <div className="xl:col-span-1">
              <ChartCommentary 
                chartType="costEfficiency"
                data={data}
              />
            </div>
          </div>

          {/* Channel Efficiency Scatter Plot - Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ChannelEfficiencyScatterPlot 
                data={data} 
                availableMarkets={availableMarkets}
                availableMonths={availableMonths}
              />
            </div>
            <div className="xl:col-span-1">
              <ChartCommentary 
                chartType="channelEfficiency"
                data={data}
              />
            </div>
          </div>

          {/* Performance Distribution Components - Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PerformanceDistributionComponents 
                data={data} 
                availableMarkets={availableMarkets}
                availableMonths={availableMonths}
              />
            </div>
            <div className="xl:col-span-1">
              <ChartCommentary 
                chartType="performanceDistribution"
                data={data}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTrendAnalysis; 