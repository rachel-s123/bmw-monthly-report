import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp, TrendingDown, DollarSign, BarChart3, Filter, Maximize2, Award, AlertTriangle, CheckCircle } from 'lucide-react';

const ChannelEfficiencyScatterPlot = ({ data, availableMarkets, availableMonths }) => {
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('latest');
  const [selectedChannelType, setSelectedChannelType] = useState('all');
  const [selectedCampaignType, setSelectedCampaignType] = useState('all'); // New filter
  const [highlightedChannel, setHighlightedChannel] = useState(null);

  const channelColors = {
    'Social': '#3B82F6',
    'Display': '#10B981',
    'Search': '#F59E0B',
    'Video': '#EF4444',
    'Audio': '#8B5CF6',
    'Other': '#6B7280'
  };

  const campaignTypeColors = {
    'Launch': '#3B82F6',
    'Always On': '#10B981',
    'Tactical': '#F59E0B',
    'Unknown': '#6B7280'
  };

  const processData = useMemo(() => {
    if (!data || data.length === 0) return { scatterData: [], quadrants: {}, benchmarks: {} };

    try {
      // Group data by channel and campaign type
      const channelData = {};
      
      data.forEach(row => {
        const channelName = row['Channel_Name'] || row['channel_name'] || 'Unknown';
        const channelType = row['Channel_Type'] || row['channel_type'] || 'Other';
        const campaignType = row['Campaign_Type'] || row['campaign_type'] || 'Unknown';
        const market = row.file_source ? row.file_source.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/)?.[1] : 'Unknown';
        
        if (!channelData[channelName]) {
          channelData[channelName] = {
            channelName,
            channelType,
            market,
            total_spend: 0,
            total_nvwr: 0,
            total_impressions: 0,
            total_clicks: 0,
            total_iv: 0,
            campaign_breakdown: {},
            records: 0
          };
        }
        
        const channel = channelData[channelName];
        channel.total_spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        channel.total_nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        channel.total_impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
        channel.total_clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
        channel.total_iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;
        channel.records += 1;

        // Track campaign type breakdown
        if (!channel.campaign_breakdown[campaignType]) {
          channel.campaign_breakdown[campaignType] = {
            spend: 0,
            nvwr: 0,
            impressions: 0,
            clicks: 0,
            iv: 0
          };
        }
        channel.campaign_breakdown[campaignType].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        channel.campaign_breakdown[campaignType].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        channel.campaign_breakdown[campaignType].impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
        channel.campaign_breakdown[campaignType].clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
        channel.campaign_breakdown[campaignType].iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;
      });

      // Calculate metrics for each channel
      const channels = Object.values(channelData)
        .filter(channel => channel.total_nvwr > 0 && channel.total_spend > 0)
        .map(channel => {
          // Calculate basic metrics
          const cp_nvwr = channel.total_spend / channel.total_nvwr;
          const cpm = channel.total_impressions > 0 ? (channel.total_spend / channel.total_impressions) * 1000 : 0;
          const cp_iv = channel.total_iv > 0 ? channel.total_spend / channel.total_iv : 0;
          const ctr = channel.total_impressions > 0 ? (channel.total_clicks / channel.total_impressions) * 100 : 0;
          const cvr = channel.total_clicks > 0 ? (channel.total_nvwr / channel.total_clicks) * 100 : 0;
          const roi = channel.total_spend > 0 ? (channel.total_nvwr / channel.total_spend) * 100 : 0;

          // Calculate campaign type percentages
          const totalChannelSpend = channel.total_spend;
          const campaignMix = {};
          Object.entries(channel.campaign_breakdown).forEach(([type, data]) => {
            campaignMix[type] = data.spend / totalChannelSpend;
          });

          // Determine dominant campaign type
          const dominantCampaignType = Object.entries(campaignMix)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

          return {
            ...channel,
            cp_nvwr,
            cpm,
            cp_iv,
            ctr,
            cvr,
            roi,
            campaignMix,
            dominantCampaignType
          };
        });

      // Calculate benchmarks across all channels
      const validChannels = channels.filter(ch => ch.cpm > 0 && ch.cp_iv > 0 && ch.cp_nvwr > 0);
      if (validChannels.length === 0) {
        return { scatterData: [], quadrants: {}, benchmarks: {} };
      }

      const benchmarks = {
        cpm: validChannels.reduce((sum, ch) => sum + ch.cpm, 0) / validChannels.length,
        cp_iv: validChannels.reduce((sum, ch) => sum + ch.cp_iv, 0) / validChannels.length,
        cp_nvwr: validChannels.reduce((sum, ch) => sum + ch.cp_nvwr, 0) / validChannels.length
      };

      // Calculate efficiency scores for each channel
      const scatterData = channels.map(channel => {
        // Calculate individual efficiency scores
        const awareness_score = Math.max(0, 100 - (channel.cpm / benchmarks.cpm * 100));
        const engagement_score = Math.max(0, 100 - (channel.cp_iv / benchmarks.cp_iv * 100));
        const conversion_score = Math.max(0, 100 - (channel.cp_nvwr / benchmarks.cp_nvwr * 100));

        // Calculate weighted efficiency based on campaign mix
        const weighted_efficiency = 
          (awareness_score * (channel.campaignMix['Launch'] || 0)) +
          (engagement_score * (channel.campaignMix['Always On'] || 0)) +
          (conversion_score * (channel.campaignMix['Tactical'] || 0));

        // Calculate total value score
        const total_value = 
          (channel.total_impressions * 0.001) +  // Weight impressions lightly
          (channel.total_iv * 1) +               // Weight IVs moderately
          (channel.total_nvwr * 10);             // Weight NVWRs heavily

        // Determine primary KPI based on dominant campaign type
        let primaryKPI;
        let primaryKPIValue;
        if (channel.dominantCampaignType === 'Launch') {
          primaryKPI = 'Impressions';
          primaryKPIValue = channel.total_impressions;
        } else if (channel.dominantCampaignType === 'Always On') {
          primaryKPI = 'IVs';
          primaryKPIValue = channel.total_iv;
        } else {
          primaryKPI = 'NVWRs';
          primaryKPIValue = channel.total_nvwr;
        }

        return {
          ...channel,
          awareness_score,
          engagement_score,
          conversion_score,
          weighted_efficiency,
          total_value,
          primaryKPI,
          primaryKPIValue
        };
      });

      // Calculate quadrant boundaries
      const efficiencyValues = scatterData.map(d => d.weighted_efficiency).filter(v => v > 0);
      const valueValues = scatterData.map(d => d.total_value).filter(v => v > 0);
      
      const medianEfficiency = efficiencyValues.sort((a, b) => a - b)[Math.floor(efficiencyValues.length / 2)] || 50;
      const medianValue = valueValues.sort((a, b) => a - b)[Math.floor(valueValues.length / 2)] || 100;

      const quadrants = {
        multiCampaignChampions: { x: medianEfficiency, y: medianValue, label: 'Multi-Campaign Champions', color: '#10B981' },
        volumeLeaders: { x: medianEfficiency, y: medianValue, label: 'Volume Leaders', color: '#3B82F6' },
        efficiencyExperts: { x: medianEfficiency, y: medianValue, label: 'Efficiency Experts', color: '#F59E0B' },
        optimizationRequired: { x: medianEfficiency, y: medianValue, label: 'Optimization Required', color: '#EF4444' }
      };

      // Calculate opportunity value
      const opportunityValue = scatterData
        .filter(channel => channel.weighted_efficiency < medianEfficiency)
        .reduce((total, channel) => {
          const efficiencyGap = medianEfficiency - channel.weighted_efficiency;
          const potentialSavings = (efficiencyGap / 100) * channel.total_spend;
          return total + potentialSavings;
        }, 0);

      return { scatterData, quadrants, opportunityValue, benchmarks };
    } catch (error) {
      console.error('Error processing channel efficiency data:', error);
      return { scatterData: [], quadrants: {}, benchmarks: {} };
    }
  }, [data]);

  const getQuadrant = (efficiency, value) => {
    const { quadrants } = processData;
    const medianEfficiency = quadrants.multiCampaignChampions.x;
    const medianValue = quadrants.multiCampaignChampions.y;
    
    if (efficiency >= medianEfficiency && value >= medianValue) return 'multiCampaignChampions';
    if (efficiency < medianEfficiency && value >= medianValue) return 'volumeLeaders';
    if (efficiency >= medianEfficiency && value < medianValue) return 'efficiencyExperts';
    return 'optimizationRequired';
  };

  const getQuadrantColor = (quadrant) => {
    const colors = {
      multiCampaignChampions: '#10B981',
      volumeLeaders: '#3B82F6',
      efficiencyExperts: '#F59E0B',
      optimizationRequired: '#EF4444'
    };
    return colors[quadrant] || '#6B7280';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const quadrant = getQuadrant(data.weighted_efficiency, data.total_value);
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <div className="mb-3">
            <h4 className="font-bold text-gray-900">{data.channelName}</h4>
            <p className="text-sm text-gray-600">{data.channelType} • {data.market}</p>
            <p className="text-sm text-gray-600">Dominant: {data.dominantCampaignType}</p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Weighted Efficiency:</span>
              <span className="font-medium">{data.weighted_efficiency.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Value Score:</span>
              <span className="font-medium">{data.total_value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Spend:</span>
              <span className="font-medium">€{data.total_spend.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ROI:</span>
              <span className="font-medium">{data.roi.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Quadrant:</span>
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: getQuadrantColor(quadrant) }}
              >
                {quadrant.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
            
            <div className="mt-2 text-xs text-gray-600">
              {quadrant === 'multiCampaignChampions' && 'Excel across all campaign types'}
              {quadrant === 'volumeLeaders' && 'High reach but need efficiency work'}
              {quadrant === 'efficiencyExperts' && 'Great rates but need scale'}
              {quadrant === 'optimizationRequired' && 'Both efficiency and scale issues'}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-1">Efficiency Scores:</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>Awareness: {data.awareness_score.toFixed(0)}%</div>
                <div>Engagement: {data.engagement_score.toFixed(0)}%</div>
                <div>Conversion: {data.conversion_score.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <BarChart3 className="h-8 w-8 mr-3" />
          <span>No data available for channel efficiency analysis</span>
        </div>
      </div>
    );
  }

  const { scatterData, quadrants, opportunityValue, benchmarks } = processData;

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Enhanced Channel Efficiency Matrix</h3>
          <p className="text-gray-600 mt-1">Campaign-type weighted efficiency analysis with multi-dimensional scoring</p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">
            €{opportunityValue.toLocaleString()} potential savings
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Market:</label>
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500"
          >
            <option value="all">All Markets</option>
            {availableMarkets?.map(market => (
              <option key={market} value={market}>{market}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500"
          >
            <option value="latest">Latest Month</option>
            {availableMonths?.map(month => (
              <option key={month} value={month}>
                {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Channel Type:</label>
          <select
            value={selectedChannelType}
            onChange={(e) => setSelectedChannelType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500"
          >
            <option value="all">All Types</option>
            {Object.keys(channelColors).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Campaign Type:</label>
          <select
            value={selectedCampaignType}
            onChange={(e) => setSelectedCampaignType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bmw-500"
          >
            <option value="all">All Campaign Types (Weighted)</option>
            <option value="launch">Launch/Awareness Only</option>
            <option value="always_on">Always On/Engagement Only</option>
            <option value="tactical">Tactical/Conversion Only</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              type="number" 
              dataKey="weighted_efficiency" 
              name="Weighted Efficiency Score"
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={value => `${value.toFixed(0)}%`}
            />
            <YAxis 
              type="number" 
              dataKey="total_value" 
              name="Total Value Score"
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={value => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Quadrant Lines */}
            <line
              x1={quadrants.multiCampaignChampions.x}
              y1={0}
              x2={quadrants.multiCampaignChampions.x}
              y2={Math.max(...scatterData.map(d => d.total_value))}
              stroke="#9CA3AF"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <line
              x1={0}
              y1={quadrants.multiCampaignChampions.y}
              x2={Math.max(...scatterData.map(d => d.weighted_efficiency))}
              y2={quadrants.multiCampaignChampions.y}
              stroke="#9CA3AF"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            
            {/* Scatter Points */}
            <Scatter data={scatterData} fill="#8884d8">
              {scatterData.map((entry, index) => {
                const quadrant = getQuadrant(entry.weighted_efficiency, entry.total_value);
                const isHighlighted = highlightedChannel === entry.channelName;
                
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isHighlighted ? '#000' : campaignTypeColors[entry.dominantCampaignType] || '#6B7280'}
                    stroke={getQuadrantColor(quadrant)}
                    strokeWidth={isHighlighted ? 3 : 1}
                    r={isHighlighted ? 8 : 6}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Quadrant Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries({
          multiCampaignChampions: 'Multi-Campaign Champions (High Efficiency + High Value)',
          volumeLeaders: 'Volume Leaders (Low Efficiency + High Value)',
          efficiencyExperts: 'Efficiency Experts (High Efficiency + Low Value)',
          optimizationRequired: 'Optimization Required (Low Efficiency + Low Value)'
        }).map(([key, label]) => (
          <div key={key} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getQuadrantColor(key) }}
            />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Campaign Type Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(campaignTypeColors).map(([type, color]) => (
          <div key={type} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-600">{type}</span>
          </div>
        ))}
      </div>

      {/* Benchmarks Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Benchmarks:</h4>
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
          <div>CPM: €{benchmarks.cpm?.toFixed(2) || 'N/A'}</div>
          <div>CP-IV: €{benchmarks.cp_iv?.toFixed(2) || 'N/A'}</div>
          <div>CP-NVWR: €{benchmarks.cp_nvwr?.toFixed(2) || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
};

export default ChannelEfficiencyScatterPlot; 