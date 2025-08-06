import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, DollarSign, BarChart3 } from 'lucide-react';

const ChartCommentary = ({ chartType, data, insights }) => {
  const getCommentaryContent = () => {
    switch (chartType) {
      case 'costEfficiency':
        return getCostEfficiencyCommentary();
      case 'channelEfficiency':
        return getChannelEfficiencyCommentary();
      case 'performanceDistribution':
        return getPerformanceDistributionCommentary();
      default:
        return null;
    }
  };

  const getCostEfficiencyCommentary = () => {
    if (!data || data.length === 0) return null;

    try {
      // Calculate key metrics
      const totalSpend = data.reduce((sum, row) => sum + (parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0), 0);
      const totalNVWR = data.reduce((sum, row) => sum + (parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0), 0);
      const avgCPNvwr = totalNVWR > 0 ? totalSpend / totalNVWR : 0;
      
      // Find trends
      const monthlyData = {};
      data.forEach(row => {
        if (row.year && row.month) {
          const monthKey = `${row.year}-${row.month.toString().padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { spend: 0, nvwr: 0 };
          }
          monthlyData[monthKey].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
          monthlyData[monthKey].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        }
      });

      const sortedMonths = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b));
      const recentMonths = sortedMonths.slice(-3);
      const olderMonths = sortedMonths.slice(-6, -3);
      
      let trendAnalysis = '';
      let trendIcon = TrendingUp;
      let trendColor = 'text-green-600';
      
      if (recentMonths.length >= 2 && olderMonths.length >= 2) {
        const recentAvgCP = recentMonths.reduce((sum, [, data]) => sum + (data.nvwr > 0 ? data.spend / data.nvwr : 0), 0) / recentMonths.length;
        const olderAvgCP = olderMonths.reduce((sum, [, data]) => sum + (data.nvwr > 0 ? data.spend / data.nvwr : 0), 0) / olderMonths.length;
        
        if (recentAvgCP < olderAvgCP * 0.9) {
          trendAnalysis = `Cost efficiency has improved by ${((1 - recentAvgCP / olderAvgCP) * 100).toFixed(0)}% in recent months, indicating successful optimization efforts.`;
          trendIcon = TrendingUp;
          trendColor = 'text-green-600';
        } else if (recentAvgCP > olderAvgCP * 1.1) {
          trendAnalysis = `Cost efficiency has declined by ${((recentAvgCP / olderAvgCP - 1) * 100).toFixed(0)}% in recent months, suggesting the need for optimization.`;
          trendIcon = TrendingDown;
          trendColor = 'text-red-600';
        } else {
          trendAnalysis = 'Cost efficiency has remained relatively stable over the analyzed period.';
          trendIcon = Target;
          trendColor = 'text-blue-600';
        }
      } else {
        trendAnalysis = 'Insufficient historical data to determine trend direction.';
        trendIcon = Target;
        trendColor = 'text-gray-600';
      }

      return {
        title: 'Cost Efficiency Evolution Analysis',
        description: 'This chart tracks the evolution of key cost metrics over time, providing insights into marketing efficiency trends and optimization opportunities.',
        keyInsights: [
          {
            icon: DollarSign,
            title: 'Average Cost per NVWR',
            value: `€${avgCPNvwr.toFixed(2)}`,
            description: 'The current average cost to acquire one NVWR across all channels and markets.'
          },
          {
            icon: BarChart3,
            title: 'Total Investment',
            value: `€${totalSpend.toLocaleString()}`,
            description: 'Total media spend analyzed across all markets and time periods.'
          },
          {
            icon: trendIcon,
            title: 'Efficiency Trend',
            value: trendAnalysis,
            description: 'Recent performance compared to historical benchmarks.',
            color: trendColor
          }
        ],
        recommendations: [
          'Monitor cost trends monthly to identify optimization opportunities early',
          'Focus budget allocation on channels with improving cost efficiency',
          'Set up alerts for when cost metrics exceed acceptable thresholds',
          'Regularly review and adjust bidding strategies based on performance data'
        ]
      };
    } catch (error) {
      console.error('Error generating cost efficiency commentary:', error);
      return {
        title: 'Cost Efficiency Evolution Analysis',
        description: 'This chart tracks the evolution of key cost metrics over time, providing insights into marketing efficiency trends and optimization opportunities.',
        keyInsights: [
          {
            icon: DollarSign,
            title: 'Data Processing',
            value: 'Processing...',
            description: 'Analyzing cost efficiency data from your campaigns.'
          }
        ],
        recommendations: [
          'Ensure data quality and completeness for accurate analysis',
          'Monitor cost trends regularly for optimization opportunities',
          'Review performance metrics across different time periods'
        ]
      };
    }
  };

  const getChannelEfficiencyCommentary = () => {
    if (!data || data.length === 0) return null;

    try {
      // Group data by channel and campaign type
      const channelData = {};
      data.forEach(row => {
        const channelName = row['Channel_Name'] || row['channel_name'] || 'Unknown';
        const campaignType = row['Campaign_Type'] || row['campaign_type'] || 'Unknown';
        
        if (!channelData[channelName]) {
          channelData[channelName] = {
            channelName,
            spend: 0,
            nvwr: 0,
            impressions: 0,
            clicks: 0,
            iv: 0,
            campaign_breakdown: {}
          };
        }
        
        const channel = channelData[channelName];
        channel.spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        channel.nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        channel.impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
        channel.clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
        channel.iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;

        // Track campaign type breakdown
        if (!channel.campaign_breakdown[campaignType]) {
          channel.campaign_breakdown[campaignType] = { spend: 0 };
        }
        channel.campaign_breakdown[campaignType].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
      });

      const channels = Object.values(channelData).filter(ch => ch.nvwr > 0);
      if (channels.length === 0) {
        return {
          title: 'Enhanced Channel Efficiency Matrix Analysis',
          description: 'This advanced scatter plot analyzes channel performance using campaign-type weighted efficiency scoring, providing nuanced insights across awareness, engagement, and conversion objectives.',
          keyInsights: [
            {
              icon: AlertTriangle,
              title: 'No Channel Data',
              value: 'No valid channel data found',
              description: 'Ensure your data contains channel information and performance metrics.'
            }
          ],
          recommendations: [
            'Verify that your data includes channel names and campaign types',
            'Check data quality and completeness for multi-dimensional analysis',
            'Ensure performance metrics are properly recorded across all campaign types'
          ]
        };
      }

      // Calculate efficiency metrics and scores
      const channelsWithScores = channels.map(channel => {
        const cp_nvwr = channel.spend / channel.nvwr;
        const cpm = channel.impressions > 0 ? (channel.spend / channel.impressions) * 1000 : 0;
        const cp_iv = channel.iv > 0 ? channel.spend / channel.iv : 0;
        
        // Calculate campaign mix
        const totalSpend = channel.spend;
        const campaignMix = {};
        Object.entries(channel.campaign_breakdown).forEach(([type, data]) => {
          campaignMix[type] = data.spend / totalSpend;
        });

        // Determine dominant campaign type
        const dominantCampaignType = Object.entries(campaignMix)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

        return {
          ...channel,
          cp_nvwr,
          cpm,
          cp_iv,
          campaignMix,
          dominantCampaignType
        };
      });

      // Calculate benchmarks
      const validChannels = channelsWithScores.filter(ch => ch.cpm > 0 && ch.cp_iv > 0 && ch.cp_nvwr > 0);
      if (validChannels.length === 0) {
        return {
          title: 'Enhanced Channel Efficiency Matrix Analysis',
          description: 'This advanced scatter plot analyzes channel performance using campaign-type weighted efficiency scoring, providing nuanced insights across awareness, engagement, and conversion objectives.',
          keyInsights: [
            {
              icon: AlertTriangle,
              title: 'Insufficient Data',
              value: 'Need more diverse metrics',
              description: 'Require CPM, CP-IV, and CP-NVWR data for comprehensive analysis.'
            }
          ],
          recommendations: [
            'Ensure all performance metrics are available for each channel',
            'Include diverse campaign types for better benchmarking',
            'Verify data completeness across all efficiency dimensions'
          ]
        };
      }

      const benchmarks = {
        cpm: validChannels.reduce((sum, ch) => sum + ch.cpm, 0) / validChannels.length,
        cp_iv: validChannels.reduce((sum, ch) => sum + ch.cp_iv, 0) / validChannels.length,
        cp_nvwr: validChannels.reduce((sum, ch) => sum + ch.cp_nvwr, 0) / validChannels.length
      };

      // Calculate efficiency scores
      const channelsWithEfficiency = channelsWithScores.map(channel => {
        const awareness_score = Math.max(0, 100 - (channel.cpm / benchmarks.cpm * 100));
        const engagement_score = Math.max(0, 100 - (channel.cp_iv / benchmarks.cp_iv * 100));
        const conversion_score = Math.max(0, 100 - (channel.cp_nvwr / benchmarks.cp_nvwr * 100));

        // Calculate weighted efficiency
        const weighted_efficiency = 
          (awareness_score * (channel.campaignMix['Launch'] || 0)) +
          (engagement_score * (channel.campaignMix['Always On'] || 0)) +
          (conversion_score * (channel.campaignMix['Tactical'] || 0));

        // Calculate total value score
        const total_value = 
          (channel.impressions * 0.001) +  // Weight impressions lightly
          (channel.iv * 1) +               // Weight IVs moderately
          (channel.nvwr * 10);             // Weight NVWRs heavily

        return {
          ...channel,
          awareness_score,
          engagement_score,
          conversion_score,
          weighted_efficiency,
          total_value
        };
      });

      // Find best performers
      const bestEfficiency = channelsWithEfficiency.reduce((best, current) => 
        current.weighted_efficiency > best.weighted_efficiency ? current : best
      );
      
      const bestValue = channelsWithEfficiency.reduce((best, current) => 
        current.total_value > best.total_value ? current : best
      );

      // Calculate opportunity value
      const medianEfficiency = channelsWithEfficiency
        .map(ch => ch.weighted_efficiency)
        .sort((a, b) => a - b)[Math.floor(channelsWithEfficiency.length / 2)] || 50;

      const opportunityValue = channelsWithEfficiency
        .filter(channel => channel.weighted_efficiency < medianEfficiency)
        .reduce((total, channel) => {
          const efficiencyGap = medianEfficiency - channel.weighted_efficiency;
          const potentialSavings = (efficiencyGap / 100) * channel.spend;
          return total + potentialSavings;
        }, 0);

      // Analyze campaign type distribution
      const campaignTypeCounts = {};
      channelsWithEfficiency.forEach(ch => {
        const dominant = ch.dominantCampaignType;
        campaignTypeCounts[dominant] = (campaignTypeCounts[dominant] || 0) + 1;
      });

      const mostCommonCampaignType = Object.entries(campaignTypeCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

      return {
        title: 'Enhanced Channel Efficiency Matrix Analysis',
        description: 'This advanced scatter plot analyzes channel performance using campaign-type weighted efficiency scoring, providing nuanced insights across awareness, engagement, and conversion objectives.',
        keyInsights: [
          {
            icon: Target,
            title: 'Best Efficiency Score',
            value: bestEfficiency?.channelName || 'N/A',
            description: `Achieves ${bestEfficiency?.weighted_efficiency.toFixed(1)}% weighted efficiency across all campaign types.`
          },
          {
            icon: TrendingUp,
            title: 'Highest Value Generator',
            value: bestValue?.channelName || 'N/A',
            description: `Generates ${bestValue?.total_value.toLocaleString()} total value score with strong multi-dimensional performance.`
          },
          {
            icon: AlertTriangle,
            title: 'Optimization Opportunity',
            value: `€${opportunityValue.toLocaleString()}`,
            description: 'Potential savings from improving channels below median efficiency.'
          },
          {
            icon: BarChart3,
            title: 'Campaign Diversity',
            value: `${channels.length} channels, ${Object.keys(campaignTypeCounts).length} campaign types`,
            description: `Most common: ${mostCommonCampaignType} campaigns.`
          }
        ],
        recommendations: [
          'Focus budget allocation on channels in the "Multi-Campaign Champions" quadrant',
          'Optimize channels in "Volume Leaders" quadrant to improve efficiency',
          'Scale up channels in "Efficiency Experts" quadrant to increase value',
          'Review and potentially restructure channels in "Optimization Required" quadrant',
          'Consider campaign-type specific strategies based on dominant performance areas'
        ]
      };
    } catch (error) {
      console.error('Error generating enhanced channel efficiency commentary:', error);
      return {
        title: 'Enhanced Channel Efficiency Matrix Analysis',
        description: 'This advanced scatter plot analyzes channel performance using campaign-type weighted efficiency scoring, providing nuanced insights across awareness, engagement, and conversion objectives.',
        keyInsights: [
          {
            icon: AlertTriangle,
            title: 'Data Processing Error',
            value: 'Error occurred',
            description: 'Unable to process enhanced channel efficiency data at this time.'
          }
        ],
        recommendations: [
          'Check data format and completeness for multi-dimensional analysis',
          'Ensure campaign types are properly categorized',
          'Verify performance metrics are available across all dimensions'
        ]
      };
    }
  };

  const getPerformanceDistributionCommentary = () => {
    if (!data || data.length === 0) return null;

    try {
      // Calculate key metrics
      const totalSpend = data.reduce((sum, row) => sum + (parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0), 0);
      const totalNVWR = data.reduce((sum, row) => sum + (parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0), 0);
      const avgROI = totalSpend > 0 ? (totalNVWR / totalSpend) * 100 : 0;
      
      // Count unique models and channels
      const uniqueModels = new Set(data.map(row => row['Model'] || row['model']).filter(Boolean)).size;
      const uniqueChannels = new Set(data.map(row => row['Channel_Name'] || row['channel_name']).filter(Boolean)).size;
      
      // Find top performing model
      const modelData = {};
      data.forEach(row => {
        const model = row['Model'] || row['model'] || 'Unknown';
        if (!modelData[model]) {
          modelData[model] = { spend: 0, nvwr: 0 };
        }
        modelData[model].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        modelData[model].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
      });
      
      const topModel = Object.entries(modelData)
        .map(([model, data]) => ({ model, roi: data.spend > 0 ? (data.nvwr / data.spend) * 100 : 0 }))
        .sort((a, b) => b.roi - a.roi)[0];

      return {
        title: 'Performance Distribution Analysis',
        description: 'This comprehensive analysis examines performance across multiple dimensions including models, channels, campaigns, and time periods to identify patterns and opportunities.',
        keyInsights: [
          {
            icon: TrendingUp,
            title: 'Overall ROI',
            value: `${avgROI.toFixed(1)}%`,
            description: 'Average return on investment across all campaigns and channels.'
          },
          {
            icon: Target,
            title: 'Top Performing Model',
            value: topModel?.model || 'N/A',
            description: `Achieves ${topModel?.roi.toFixed(1)}% ROI, leading the portfolio.`
          },
          {
            icon: BarChart3,
            title: 'Portfolio Diversity',
            value: `${uniqueModels} models, ${uniqueChannels} channels`,
            description: 'Well-diversified marketing portfolio across multiple dimensions.'
          }
        ],
        recommendations: [
          'Focus marketing efforts on high-performing models and channels',
          'Analyze performance patterns across different campaign types',
          'Use the performance matrix to identify optimization opportunities',
          'Consider budget reallocation based on ROI performance'
        ]
      };
    } catch (error) {
      console.error('Error generating performance distribution commentary:', error);
      return {
        title: 'Performance Distribution Analysis',
        description: 'This comprehensive analysis examines performance across multiple dimensions including models, channels, campaigns, and time periods to identify patterns and opportunities.',
        keyInsights: [
          {
            icon: AlertTriangle,
            title: 'Data Processing Error',
            value: 'Error occurred',
            description: 'Unable to process performance distribution data at this time.'
          }
        ],
        recommendations: [
          'Check data format and completeness',
          'Ensure model and channel information is available',
          'Verify performance metrics are properly recorded'
        ]
      };
    }
  };

  const commentary = getCommentaryContent();

  if (!commentary) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Lightbulb className="h-8 w-8 mr-3" />
          <span>No commentary available for this chart</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200 h-full">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-bmw-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
          <Lightbulb className="h-5 w-5 text-bmw-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-gray-900 truncate">{commentary.title}</h3>
          <p className="text-sm text-gray-600">Human insights and recommendations</p>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed text-sm">{commentary.description}</p>
      </div>

      {/* Key Insights */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <Target className="h-4 w-4 mr-2 flex-shrink-0" />
          Key Insights
        </h4>
        <div className="space-y-3">
          {commentary.keyInsights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start">
                  <Icon className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 ${insight.color || 'text-bmw-600'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{insight.title}</span>
                      <span className="text-sm font-bold text-bmw-600 ml-2 flex-shrink-0">{insight.value}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          Recommendations
        </h4>
        <div className="space-y-2">
          {commentary.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start">
              <div className="w-1.5 h-1.5 bg-bmw-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartCommentary; 