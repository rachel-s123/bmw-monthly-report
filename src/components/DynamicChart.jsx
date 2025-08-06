import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DynamicChart = ({ chartType, data, config, context }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{config.title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for this chart
        </div>
      </div>
    );
  }

  switch (chartType) {
    case 'bar':
      return <BarChartComponent data={data} config={config} context={context} />;
    case 'line':
      return <LineChartComponent data={data} config={config} context={context} />;
    case 'funnel':
      return <FunnelChartComponent data={data} config={config} context={context} />;
    case 'comparison':
      return <ComparisonChartComponent data={data} config={config} context={context} />;
    case 'summary_cards':
      return <SummaryCardsComponent data={data} config={config} context={context} />;
    default:
      return <div>Unsupported chart type: {chartType}</div>;
  }
};

// Bar Chart Component
const BarChartComponent = ({ data, config, context }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{config.title}</h3>
      <ResponsiveContainer width="100%" height={config.height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={config.dataKey} />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              typeof value === 'number' ? value.toLocaleString() : value,
              name === 'spend' ? 'Spend' : name === 'nvwr' ? 'NVWR' : name
            ]}
          />
          <Legend />
          <Bar dataKey={config.valueKey} fill={colors[0]} name="Spend" />
          {config.secondaryValueKey && (
            <Bar dataKey={config.secondaryValueKey} fill={colors[1]} name="NVWR" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Line Chart Component
const LineChartComponent = ({ data, config, context }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{config.title}</h3>
      <ResponsiveContainer width="100%" height={config.height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              typeof value === 'number' ? value.toLocaleString() : value,
              name
            ]}
          />
          <Legend />
          {config.series.map((series, index) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              stroke={series.color || colors[index % colors.length]}
              name={series.label}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Funnel Chart Component
const FunnelChartComponent = ({ data, config, context }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{config.title}</h3>
      <div className="space-y-4">
        {data.map((stage, index) => (
          <div key={stage.stage} className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">{stage.stage}</span>
              <span className="text-sm text-gray-500">
                {stage.value.toLocaleString()} 
                {config.showPercentages && ` (${stage.percentage.toFixed(1)}%)`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8">
              <div
                className="h-8 rounded-full transition-all duration-500"
                style={{
                  width: `${stage.percentage}%`,
                  backgroundColor: colors[index % colors.length]
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Comparison Chart Component
const ComparisonChartComponent = ({ data, config, context }) => {
  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{config.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.metrics.map((metric, index) => {
          const currentValue = data.current?.[metric] || 0;
          const previousValue = data.previous?.[metric] || 0;
          const change = currentValue - previousValue;
          const percentageChange = previousValue > 0 ? (change / previousValue) * 100 : 0;
          
          const getChangeIcon = () => {
            if (percentageChange > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
            if (percentageChange < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
            return <Minus className="h-4 w-4 text-gray-500" />;
          };

          const getChangeColor = () => {
            if (percentageChange > 0) return 'text-green-600';
            if (percentageChange < 0) return 'text-red-600';
            return 'text-gray-600';
          };

          return (
            <div key={metric} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {metric.replace('_', ' ')}
                </span>
                {getChangeIcon()}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {typeof currentValue === 'number' ? currentValue.toLocaleString() : currentValue}
              </div>
              <div className={`text-sm font-medium ${getChangeColor()}`}>
                {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}% vs previous
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Summary Cards Component
const SummaryCardsComponent = ({ data, config, context }) => {
  const formatValue = (value, metric) => {
    if (metric.includes('spend')) return `$${value.toLocaleString()}`;
    if (metric.includes('nvwr')) return value.toLocaleString();
    return value.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{config.title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {config.metrics.map((metric) => (
          <div key={metric} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-blue-700 capitalize mb-1">
              {metric.replace('_', ' ')}
            </div>
            <div className="text-xl font-bold text-blue-900">
              {formatValue(data[metric], metric)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicChart; 