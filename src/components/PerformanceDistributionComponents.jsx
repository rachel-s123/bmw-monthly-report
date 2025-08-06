import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Treemap } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Network, Grid3X3, Filter, TrendingUp, DollarSign, Target } from 'lucide-react';

const PerformanceDistributionComponents = ({ data, availableMarkets, availableMonths }) => {
  const [activeTab, setActiveTab] = useState('models');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('latest');
  const [showPercentages, setShowPercentages] = useState(false);
  const [sortBy, setSortBy] = useState('total_volume');

  const tabs = [
    { id: 'models', name: 'Model Performance', icon: BarChart3 },
    { id: 'budget', name: 'Budget Allocation', icon: PieChartIcon },
    { id: 'campaigns', name: 'Campaign Analysis', icon: Network },
    { id: 'matrix', name: 'Performance Matrix', icon: Grid3X3 }
  ];

  const processData = useMemo(() => {
    if (!data || data.length === 0) return {};

    try {
      // Model Performance Data
      const modelData = {};
      const channelData = {};
      const campaignData = {};
      const monthlyData = {};

      data.forEach(row => {
        const model = row['Model'] || row['model'] || 'Unknown';
        const channelName = row['Channel_Name'] || row['channel_name'] || 'Unknown';
        const channelType = row['Channel_Type'] || row['channel_type'] || 'Other';
        const campaignType = row['Campaign_Type'] || row['campaign_type'] || 'Unknown';
        const monthKey = `${row.year}-${row.month.toString().padStart(2, '0')}`;
        
        // Model data
        if (!modelData[model]) {
          modelData[model] = {
            model,
            impressions: 0,
            clicks: 0,
            iv: 0,
            nvwr: 0,
            spend: 0
          };
        }
        modelData[model].impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
        modelData[model].clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
        modelData[model].iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;
        modelData[model].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        modelData[model].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;

        // Channel data
        if (!channelData[channelName]) {
          channelData[channelName] = {
            channelName,
            channelType,
            spend: 0,
            nvwr: 0,
            roi: 0
          };
        }
        channelData[channelName].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        channelData[channelName].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;

        // Campaign data
        if (!campaignData[campaignType]) {
          campaignData[campaignType] = {
            campaignType,
            spend: 0,
            nvwr: 0,
            channels: {}
          };
        }
        if (!campaignData[campaignType].channels[channelName]) {
          campaignData[campaignType].channels[channelName] = {
            channelName,
            spend: 0,
            nvwr: 0,
            models: {}
          };
        }
        if (!campaignData[campaignType].channels[channelName].models[model]) {
          campaignData[campaignType].channels[channelName].models[model] = {
            model,
            spend: 0,
            nvwr: 0
          };
        }
        campaignData[campaignType].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        campaignData[campaignType].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        campaignData[campaignType].channels[channelName].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        campaignData[campaignType].channels[channelName].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        campaignData[campaignType].channels[channelName].models[model].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        campaignData[campaignType].channels[channelName].models[model].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;

        // Monthly data
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            monthName: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            nvwr: 0,
            spend: 0,
            cpm: 0,
            cp_nvwr: 0,
            ctr: 0,
            cvr: 0,
            efficiency_score: 0
          };
        }
        monthlyData[monthKey].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        monthlyData[monthKey].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
      });

      // Calculate ROI for channels
      Object.values(channelData).forEach(channel => {
        channel.roi = channel.spend > 0 ? (channel.nvwr / channel.spend) * 100 : 0;
      });

      // Calculate metrics for monthly data
      Object.values(monthlyData).forEach(month => {
        const totalImpressions = data
          .filter(row => `${row.year}-${row.month.toString().padStart(2, '0')}` === month.month)
          .reduce((sum, row) => sum + (parseFloat(row['Impressions'] || row['impressions'] || 0) || 0), 0);
        
        const totalClicks = data
          .filter(row => `${row.year}-${row.month.toString().padStart(2, '0')}` === month.month)
          .reduce((sum, row) => sum + (parseFloat(row['Clicks'] || row['clicks'] || 0) || 0), 0);

        month.cpm = totalImpressions > 0 ? (month.spend / totalImpressions) * 1000 : 0;
        month.cp_nvwr = month.nvwr > 0 ? month.spend / month.nvwr : 0;
        month.ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        month.cvr = totalClicks > 0 ? (month.nvwr / totalClicks) * 100 : 0;
        
        // Efficiency score (weighted average of normalized metrics)
        const avgCPM = Object.values(monthlyData).reduce((sum, m) => sum + m.cpm, 0) / Object.values(monthlyData).length;
        const avgCPNvwr = Object.values(monthlyData).reduce((sum, m) => sum + m.cp_nvwr, 0) / Object.values(monthlyData).length;
        const avgCTR = Object.values(monthlyData).reduce((sum, m) => sum + m.ctr, 0) / Object.values(monthlyData).length;
        const avgCVR = Object.values(monthlyData).reduce((sum, m) => sum + m.cvr, 0) / Object.values(monthlyData).length;
        
        month.efficiency_score = (
          (avgCPM / month.cpm) * 0.3 +
          (avgCPNvwr / month.cp_nvwr) * 0.4 +
          (month.ctr / avgCTR) * 0.15 +
          (month.cvr / avgCVR) * 0.15
        ) * 100;
      });

      return {
        modelData: Object.values(modelData),
        channelData: Object.values(channelData),
        campaignData: Object.values(campaignData),
        monthlyData: Object.values(monthlyData).sort((a, b) => new Date(a.month) - new Date(b.month))
      };
    } catch (error) {
      console.error('Error processing distribution data:', error);
      return {};
    }
  }, [data]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-700">{entry.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {showPercentages ? `${entry.value.toFixed(1)}%` : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderModelPerformance = () => {
    const { modelData } = processData;
    if (!modelData || modelData.length === 0) return null;

    const sortedData = [...modelData].sort((a, b) => {
      switch (sortBy) {
        case 'total_volume': return (b.impressions + b.clicks + b.iv + b.nvwr) - (a.impressions + a.clicks + a.iv + a.nvwr);
        case 'nvwr': return b.nvwr - a.nvwr;
        case 'efficiency': return (b.nvwr / b.spend) - (a.nvwr / a.spend);
        default: return a.model.localeCompare(b.model);
      }
    });

    const chartData = sortedData.map(model => ({
      model: model.model,
      Impressions: showPercentages ? (model.impressions / sortedData.reduce((sum, m) => sum + m.impressions, 0)) * 100 : model.impressions,
      Clicks: showPercentages ? (model.clicks / sortedData.reduce((sum, m) => sum + m.clicks, 0)) * 100 : model.clicks,
      IV: showPercentages ? (model.iv / sortedData.reduce((sum, m) => sum + m.iv, 0)) * 100 : model.iv,
      NVWR: showPercentages ? (model.nvwr / sortedData.reduce((sum, m) => sum + m.nvwr, 0)) * 100 : model.nvwr
    }));

    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showPercentages}
                onChange={(e) => setShowPercentages(e.target.checked)}
                className="rounded border-gray-300 text-bmw-600 focus:ring-bmw-500"
              />
              <span className="text-sm text-gray-700">Show as percentages</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500"
            >
              <option value="total_volume">Sort by Total Volume</option>
              <option value="nvwr">Sort by NVWR</option>
              <option value="efficiency">Sort by Efficiency</option>
              <option value="alphabetical">Sort Alphabetically</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Models', value: modelData.length, icon: Target },
            { label: 'Total NVWR', value: modelData.reduce((sum, m) => sum + m.nvwr, 0).toLocaleString(), icon: TrendingUp },
            { label: 'Total Spend', value: `€${modelData.reduce((sum, m) => sum + m.spend, 0).toLocaleString()}`, icon: DollarSign },
            { label: 'Avg ROI', value: `${(modelData.reduce((sum, m) => sum + (m.nvwr / m.spend), 0) / modelData.length * 100).toFixed(1)}%`, icon: BarChart3 }
          ].map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Icon className="h-5 w-5 text-bmw-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                    <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="model" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Impressions" stackId="a" fill="#3B82F6" />
              <Bar dataKey="Clicks" stackId="a" fill="#10B981" />
              <Bar dataKey="IV" stackId="a" fill="#F59E0B" />
              <Bar dataKey="NVWR" stackId="a" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderBudgetAllocation = () => {
    const { channelData } = processData;
    if (!channelData || channelData.length === 0) return null;

    const pieData = channelData.map((channel, index) => ({
      name: channel.channelName,
      value: channel.spend,
      roi: channel.roi,
      color: colors[index % colors.length]
    }));

    const topPerformers = [...channelData]
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);
    
    const bottomPerformers = [...channelData]
      .sort((a, b) => a.roi - b.roi)
      .slice(0, 5);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`€${value.toLocaleString()}`, name]}
                labelFormatter={(label) => `${label} (${((pieData.find(d => d.name === label)?.value / pieData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Table */}
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Top 5 ROI Performers</h4>
            <div className="space-y-2">
              {topPerformers.map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{channel.channelName}</p>
                    <p className="text-sm text-gray-600">{channel.channelType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{channel.roi.toFixed(1)}% ROI</p>
                    <p className="text-sm text-gray-600">€{channel.spend.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Bottom 5 ROI Performers</h4>
            <div className="space-y-2">
              {bottomPerformers.map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{channel.channelName}</p>
                    <p className="text-sm text-gray-600">{channel.channelType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{channel.roi.toFixed(1)}% ROI</p>
                    <p className="text-sm text-gray-600">€{channel.spend.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCampaignAnalysis = () => {
    const { campaignData } = processData;
    if (!campaignData || campaignData.length === 0) return null;

    const treemapData = campaignData.map(campaign => ({
      name: campaign.campaignType,
      size: campaign.spend,
      fill: colors[Math.floor(Math.random() * colors.length)],
      children: Object.values(campaign.channels).map(channel => ({
        name: channel.channelName,
        size: channel.spend,
        fill: colors[Math.floor(Math.random() * colors.length)],
        children: Object.values(channel.models).map(model => ({
          name: model.model,
          size: model.spend,
          fill: colors[Math.floor(Math.random() * colors.length)]
        }))
      }))
    }));

    return (
      <div className="space-y-6">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
            />
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderPerformanceMatrix = () => {
    const { monthlyData } = processData;
    if (!monthlyData || monthlyData.length === 0) return null;

    const metrics = [
      { key: 'nvwr', label: 'NVWR', format: 'number' },
      { key: 'spend', label: 'Media Spend', format: 'currency' },
      { key: 'cpm', label: 'CPM', format: 'currency' },
      { key: 'cp_nvwr', label: 'Cost per NVWR', format: 'currency' },
      { key: 'ctr', label: 'CTR', format: 'percentage' },
      { key: 'cvr', label: 'Conversion Rate', format: 'percentage' },
      { key: 'efficiency_score', label: 'Efficiency Score', format: 'number' }
    ];

    const getPerformanceColor = (value, metric) => {
      const values = monthlyData.map(d => d[metric.key]).filter(v => v > 0);
      if (values.length === 0) return '#E5E7EB';
      
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const ratio = value / avg;
      
      if (metric.key === 'cp_nvwr' || metric.key === 'cpm' || metric.key === 'spend') {
        // Lower is better for cost metrics
        return ratio < 0.8 ? '#10B981' : ratio > 1.2 ? '#EF4444' : '#F59E0B';
      } else {
        // Higher is better for performance metrics
        return ratio > 1.2 ? '#10B981' : ratio < 0.8 ? '#EF4444' : '#F59E0B';
      }
    };

    const formatValue = (value, format) => {
      switch (format) {
        case 'currency': return `€${value.toLocaleString()}`;
        case 'percentage': return `${value.toFixed(2)}%`;
        case 'number': return value.toLocaleString();
        default: return value.toFixed(2);
      }
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Month</th>
              {metrics.map(metric => (
                <th key={metric.key} className="text-center py-3 px-4 font-semibold text-gray-900">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((month, index) => (
              <tr key={month.month} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">
                  {month.monthName}
                </td>
                {metrics.map(metric => (
                  <td key={metric.key} className="py-3 px-4 text-center">
                    <div 
                      className="inline-block px-3 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: getPerformanceColor(month[metric.key], metric) }}
                    >
                      {formatValue(month[metric.key], metric.format)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <BarChart3 className="h-8 w-8 mr-3" />
          <span>No data available for performance distribution analysis</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Performance Distribution Analysis</h3>
          <p className="text-gray-600 mt-1">Multi-dimensional analysis of performance across models, channels, and campaigns</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group relative py-2 px-1 border-b-2 font-medium text-sm
                  ${isActive 
                    ? 'border-bmw-600 text-bmw-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-bmw-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <span>{tab.name}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'models' && renderModelPerformance()}
        {activeTab === 'budget' && renderBudgetAllocation()}
        {activeTab === 'campaigns' && renderCampaignAnalysis()}
        {activeTab === 'matrix' && renderPerformanceMatrix()}
      </div>
    </div>
  );
};

export default PerformanceDistributionComponents; 