import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Target, DollarSign, AlertTriangle, CheckCircle, Award } from 'lucide-react';

const IntelligenceLayer = ({ data }) => {
  const insights = useMemo(() => {
    if (!data || data.length === 0) return [];

    try {
      const insights = [];

      // Group data by channel
      const channelData = {};
      const modelData = {};
      const monthlyData = {};

      data.forEach(row => {
        const channelName = row['Channel_Name'] || row['channel_name'] || 'Unknown';
        const channelType = row['Channel_Type'] || row['channel_type'] || 'Other';
        const model = row['Model'] || row['model'] || 'Unknown';
        const monthKey = `${row.year}-${row.month.toString().padStart(2, '0')}`;

        // Channel data
        if (!channelData[channelName]) {
          channelData[channelName] = {
            channelName,
            channelType,
            spend: 0,
            nvwr: 0,
            impressions: 0,
            clicks: 0,
            iv: 0
          };
        }
        channelData[channelName].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        channelData[channelName].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        channelData[channelName].impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
        channelData[channelName].clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
        channelData[channelName].iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;

        // Model data
        if (!modelData[model]) {
          modelData[model] = {
            model,
            spend: 0,
            nvwr: 0,
            impressions: 0,
            clicks: 0,
            iv: 0
          };
        }
        modelData[model].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        modelData[model].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        modelData[model].impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
        modelData[model].clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
        modelData[model].iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;

        // Monthly data
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            spend: 0,
            nvwr: 0,
            impressions: 0,
            clicks: 0,
            iv: 0
          };
        }
        monthlyData[monthKey].spend += parseFloat(row['Media Cost'] || row['media_cost'] || row['spend'] || 0) || 0;
        monthlyData[monthKey].nvwr += parseFloat(row['NVWR'] || row['nvwr'] || 0) || 0;
        monthlyData[monthKey].impressions += parseFloat(row['Impressions'] || row['impressions'] || 0) || 0;
        monthlyData[monthKey].clicks += parseFloat(row['Clicks'] || row['clicks'] || 0) || 0;
        monthlyData[monthKey].iv += parseFloat(row['IV'] || row['iv'] || 0) || 0;
      });

      // Calculate metrics
      const channels = Object.values(channelData);
      const models = Object.values(modelData);
      const months = Object.values(monthlyData).sort((a, b) => new Date(a.month) - new Date(b.month));

      // Channel efficiency insights
      channels.forEach(channel => {
        channel.roi = channel.spend > 0 ? (channel.nvwr / channel.spend) * 100 : 0;
        channel.cp_nvwr = channel.nvwr > 0 ? channel.spend / channel.nvwr : 0;
        channel.ctr = channel.impressions > 0 ? (channel.clicks / channel.impressions) * 100 : 0;
        channel.cvr = channel.clicks > 0 ? (channel.nvwr / channel.clicks) * 100 : 0;
      });

      // Model performance insights
      models.forEach(model => {
        model.roi = model.spend > 0 ? (model.nvwr / model.spend) * 100 : 0;
        model.cp_nvwr = model.nvwr > 0 ? model.spend / model.nvwr : 0;
        model.ctr = model.impressions > 0 ? (model.clicks / model.impressions) * 100 : 0;
        model.cvr = model.clicks > 0 ? (model.nvwr / model.clicks) * 100 : 0;
      });

      // Generate insights

      // 1. Channel efficiency insights
      const avgROI = channels.reduce((sum, c) => sum + c.roi, 0) / channels.length;
      const highROIChannels = channels.filter(c => c.roi > avgROI * 1.5);
      const lowROIChannels = channels.filter(c => c.roi < avgROI * 0.5);

      if (highROIChannels.length > 0) {
        const bestChannel = highROIChannels.reduce((best, current) => current.roi > best.roi ? current : best);
        insights.push({
          type: 'opportunity',
          title: `${bestChannel.channelName} is ${((bestChannel.roi / avgROI - 1) * 100).toFixed(0)}% more efficient than average`,
          description: `This channel has an ROI of ${bestChannel.roi.toFixed(1)}% compared to the average of ${avgROI.toFixed(1)}%`,
          recommendation: 'Consider increasing budget allocation to this high-performing channel',
          confidence: 85,
          icon: TrendingUp,
          color: 'green'
        });
      }

      if (lowROIChannels.length > 0) {
        const worstChannel = lowROIChannels.reduce((worst, current) => current.roi < worst.roi ? current : worst);
        insights.push({
          type: 'warning',
          title: `${worstChannel.channelName} is underperforming by ${((1 - worstChannel.roi / avgROI) * 100).toFixed(0)}%`,
          description: `This channel has an ROI of ${worstChannel.roi.toFixed(1)}% compared to the average of ${avgROI.toFixed(1)}%`,
          recommendation: 'Review and optimize this channel or consider reducing budget allocation',
          confidence: 80,
          icon: AlertTriangle,
          color: 'red'
        });
      }

      // 2. Model performance insights
      const avgModelROI = models.reduce((sum, m) => sum + m.roi, 0) / models.length;
      const bestModel = models.reduce((best, current) => current.roi > best.roi ? current : best);
      const worstModel = models.reduce((worst, current) => current.roi < worst.roi ? current : worst);

      if (bestModel.roi > avgModelROI * 1.3) {
        insights.push({
          type: 'success',
          title: `${bestModel.model} is the top performer with ${bestModel.roi.toFixed(1)}% ROI`,
          description: `This model generates ${bestModel.nvwr.toLocaleString()} NVWR with €${bestModel.spend.toLocaleString()} spend`,
          recommendation: 'Consider increasing marketing focus on this high-performing model',
          confidence: 90,
          icon: Award,
          color: 'blue'
        });
      }

      if (worstModel.roi < avgModelROI * 0.7) {
        insights.push({
          type: 'warning',
          title: `${worstModel.model} performance needs attention`,
          description: `This model has an ROI of ${worstModel.roi.toFixed(1)}% compared to the average of ${avgModelROI.toFixed(1)}%`,
          recommendation: 'Investigate performance issues and consider optimization strategies',
          confidence: 75,
          icon: Target,
          color: 'orange'
        });
      }

      // 3. Cost optimization insights
      const totalSpend = channels.reduce((sum, c) => sum + c.spend, 0);
      const totalNVWR = channels.reduce((sum, c) => sum + c.nvwr, 0);
      const avgCPNvwr = totalNVWR > 0 ? totalSpend / totalNVWR : 0;

      const expensiveChannels = channels.filter(c => c.cp_nvwr > avgCPNvwr * 1.5);
      if (expensiveChannels.length > 0) {
        const mostExpensive = expensiveChannels.reduce((most, current) => current.cp_nvwr > most.cp_nvwr ? current : most);
        const potentialSavings = (mostExpensive.cp_nvwr - avgCPNvwr) * mostExpensive.nvwr;
        
        insights.push({
          type: 'opportunity',
          title: `Potential savings of €${potentialSavings.toLocaleString()} from ${mostExpensive.channelName} optimization`,
          description: `This channel costs €${mostExpensive.cp_nvwr.toFixed(2)} per NVWR vs average of €${avgCPNvwr.toFixed(2)}`,
          recommendation: 'Optimize this channel to reduce cost per conversion',
          confidence: 85,
          icon: DollarSign,
          color: 'green'
        });
      }

      // 4. Trend insights (if we have multiple months)
      if (months.length >= 2) {
        const recentMonths = months.slice(-3);
        const olderMonths = months.slice(-6, -3);
        
        if (recentMonths.length >= 2 && olderMonths.length >= 2) {
          const recentAvgROI = recentMonths.reduce((sum, m) => sum + (m.nvwr / m.spend * 100), 0) / recentMonths.length;
          const olderAvgROI = olderMonths.reduce((sum, m) => sum + (m.nvwr / m.spend * 100), 0) / olderMonths.length;
          
          if (recentAvgROI > olderAvgROI * 1.1) {
            insights.push({
              type: 'success',
              title: 'ROI has improved by ' + ((recentAvgROI / olderAvgROI - 1) * 100).toFixed(0) + '% in recent months',
              description: `Recent average ROI: ${recentAvgROI.toFixed(1)}% vs previous: ${olderAvgROI.toFixed(1)}%`,
              recommendation: 'Continue current optimization strategies',
              confidence: 80,
              icon: TrendingUp,
              color: 'green'
            });
          } else if (recentAvgROI < olderAvgROI * 0.9) {
            insights.push({
              type: 'warning',
              title: 'ROI has declined by ' + ((1 - recentAvgROI / olderAvgROI) * 100).toFixed(0) + '% in recent months',
              description: `Recent average ROI: ${recentAvgROI.toFixed(1)}% vs previous: ${olderAvgROI.toFixed(1)}%`,
              recommendation: 'Investigate recent changes and implement corrective measures',
              confidence: 75,
              icon: TrendingDown,
              color: 'red'
            });
          }
        }
      }

      // 5. Budget allocation insights
      const totalChannelSpend = channels.reduce((sum, c) => sum + c.spend, 0);
      const highROIChannelsSpend = highROIChannels.reduce((sum, c) => sum + c.spend, 0);
      const highROISpendPercentage = (highROIChannelsSpend / totalChannelSpend) * 100;

      if (highROISpendPercentage < 30) {
        insights.push({
          type: 'opportunity',
          title: 'Only ' + highROISpendPercentage.toFixed(0) + '% of budget allocated to high-ROI channels',
          description: `${highROIChannels.length} channels are performing above average but receive limited budget`,
          recommendation: 'Consider reallocating budget from low-performing to high-performing channels',
          confidence: 85,
          icon: Lightbulb,
          color: 'blue'
        });
      }

      return insights.slice(0, 6); // Limit to top 6 insights
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }, [data]);

  const getInsightIcon = (insight) => {
    const Icon = insight.icon;
    return <Icon className={`h-5 w-5 text-${insight.color}-600`} />;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI-Powered Insights</h3>
          <p className="text-gray-600 mt-1">Automatically generated recommendations based on your data</p>
        </div>
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-bmw-600" />
          <span className="text-sm font-medium text-bmw-600">{insights.length} insights</span>
        </div>
      </div>

      {insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
                    <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                      {insight.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Recommendation:</p>
                    <p className="text-sm text-gray-900">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No insights available with current data</p>
        </div>
      )}
    </div>
  );
};

export default IntelligenceLayer; 