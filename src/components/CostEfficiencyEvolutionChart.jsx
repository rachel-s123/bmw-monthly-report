import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, Calendar, DollarSign } from 'lucide-react';

const CostEfficiencyEvolutionChart = ({ data, availableMarkets, availableMonths }) => {
  const [selectedMetrics, setSelectedMetrics] = useState(['cpm', 'cpc', 'cp_iv', 'cp_nvwr']);
  const [showIndexed, setShowIndexed] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState(['all']);
  const [dateRange, setDateRange] = useState('12');

  const metrics = {
    cpm: { label: 'CPM', format: 'currency', color: '#3B82F6' },
    cpc: { label: 'CPC', format: 'currency', color: '#10B981' },
    cp_iv: { label: 'Cost per IV', format: 'currency', color: '#F59E0B' },
    cp_nvwr: { label: 'Cost per NVWR', format: 'currency', color: '#EF4444' }
  };

  const processData = useMemo(() => {
    if (!data || data.length === 0) return [];

    try {
      // Group data by month and market
      const monthlyData = {};
      
      data.forEach(row => {
        const monthKey = `${row.year}-${row.month.toString().padStart(2, '0')}`;
        const market = row.file_source ? row.file_source.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/)?.[1] : 'Unknown';
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            monthName: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            monthKey,
            year: row.year,
            month: row.month,
            markets: {}
          };
        }
        
        if (!monthlyData[monthKey].markets[market]) {
          monthlyData[monthKey].markets[market] = {
            total_spend: 0,
            total_impressions: 0,
            total_clicks: 0,
            total_iv: 0,
            total_nvwr: 0
          };
        }
        
        const marketData = monthlyData[monthKey].markets[market];
        marketData.total_spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        marketData.total_impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
        marketData.total_clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
        marketData.total_iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;
        marketData.total_nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
      });

      // Calculate metrics for each month
      const processedData = Object.values(monthlyData)
        .sort((a, b) => new Date(a.monthKey) - new Date(b.monthKey))
        .map(month => {
          const allMarkets = Object.values(month.markets);
          const totals = allMarkets.reduce((acc, market) => ({
            total_spend: acc.total_spend + market.total_spend,
            total_impressions: acc.total_impressions + market.total_impressions,
            total_clicks: acc.total_clicks + market.total_clicks,
            total_iv: acc.total_iv + market.total_iv,
            total_nvwr: acc.total_nvwr + market.total_nvwr
          }), { total_spend: 0, total_impressions: 0, total_clicks: 0, total_iv: 0, total_nvwr: 0 });

          return {
            ...month,
            cpm: totals.total_impressions > 0 ? (totals.total_spend / totals.total_impressions) * 1000 : 0,
            cpc: totals.total_clicks > 0 ? totals.total_spend / totals.total_clicks : 0,
            cp_iv: totals.total_iv > 0 ? totals.total_spend / totals.total_iv : 0,
            cp_nvwr: totals.total_nvwr > 0 ? totals.total_spend / totals.total_nvwr : 0
          };
        });

      // Calculate benchmarks
      const allValues = {
        cpm: processedData.map(d => d.cpm).filter(v => v > 0),
        cpc: processedData.map(d => d.cpc).filter(v => v > 0),
        cp_iv: processedData.map(d => d.cp_iv).filter(v => v > 0),
        cp_nvwr: processedData.map(d => d.cp_nvwr).filter(v => v > 0)
      };

      const benchmarks = {};
      Object.keys(allValues).forEach(metric => {
        const values = allValues[metric];
        if (values.length > 0) {
          benchmarks[metric] = {
            average: values.reduce((a, b) => a + b, 0) / values.length,
            best: Math.min(...values),
            target: values.reduce((a, b) => a + b, 0) / values.length * 0.9 // 10% improvement target
          };
        }
      });

      // Add indexed values and efficiency scores
      return processedData.map((month, index) => {
        const indexed = {};
        const efficiencyScores = {};
        
        Object.keys(metrics).forEach(metric => {
          if (benchmarks[metric] && month[metric] > 0) {
            // Indexed values (baseline = 100)
            indexed[`${metric}_indexed`] = (month[metric] / benchmarks[metric].average) * 100;
            
            // Efficiency score
            const ratio = month[metric] / benchmarks[metric].average;
            if (ratio < 0.8) efficiencyScores[metric] = 'Excellent';
            else if (ratio <= 1.0) efficiencyScores[metric] = 'Good';
            else efficiencyScores[metric] = 'Poor';
          }
        });

        return {
          ...month,
          ...indexed,
          efficiencyScores
        };
      });
    } catch (error) {
      console.error('Error processing cost efficiency data:', error);
      return [];
    }
  }, [data]);

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const getEfficiencyColor = (score) => {
    switch (score) {
      case 'Excellent': return '#10B981';
      case 'Good': return '#F59E0B';
      case 'Poor': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const monthData = processData.find(d => d.monthName === label);
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => {
            const metric = entry.dataKey.replace('_indexed', '');
            const efficiencyScore = monthData?.efficiencyScores?.[metric];
            
            return (
              <div key={`${metric}-${index}`} className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {metrics[metric]?.label}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {showIndexed ? `${entry.value.toFixed(1)}` : `€${entry.value.toFixed(2)}`}
                  </div>
                  {efficiencyScore && (
                    <div 
                      className="text-xs px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: getEfficiencyColor(efficiencyScore) }}
                    >
                      {efficiencyScore}
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

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <DollarSign className="h-8 w-8 mr-3" />
          <span>No data available for cost efficiency analysis</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Cost Efficiency Evolution</h3>
          <p className="text-gray-600 mt-1">Track cost metrics over time with benchmarks and efficiency scoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowIndexed(!showIndexed)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              showIndexed 
                ? 'bg-bmw-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showIndexed ? 'Indexed' : 'Absolute'}
          </button>
        </div>
      </div>

      {/* Metric Toggles */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          {Object.entries(metrics).map(([key, config]) => (
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

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="monthName" 
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={value => showIndexed ? `${value.toFixed(0)}` : `€${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Benchmark Lines */}
            {selectedMetrics.map(metric => {
              const benchmark = processData.length > 0 ? 
                processData.reduce((sum, d) => sum + d[metric], 0) / processData.length : 0;
              
              return (
                <ReferenceLine
                  key={`benchmark-${metric}`}
                  y={showIndexed ? 100 : benchmark}
                  stroke="#9CA3AF"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                />
              );
            })}
            
            {/* Data Lines */}
            {selectedMetrics.map(metric => (
              <Line
                key={metric}
                type="monotone"
                dataKey={showIndexed ? `${metric}_indexed` : metric}
                stroke={metrics[metric].color}
                strokeWidth={2}
                dot={{ fill: metrics[metric].color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: metrics[metric].color, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span className="text-gray-600">Benchmark Average</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">Excellent Efficiency</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">Poor Efficiency</span>
        </div>
      </div>
    </div>
  );
};

export default CostEfficiencyEvolutionChart; 