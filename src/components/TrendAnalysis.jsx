import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Award } from 'lucide-react';
import { analyzeTrends, formatTrendChange, getTrendColor } from '../utils/trendAnalysis';

const TrendAnalysis = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const trendAnalysis = analyzeTrends(data);

  if (!trendAnalysis.hasMultipleMonths) {
    return null;
  }

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trend Analysis</h2>
          <p className="text-gray-600 mt-1">Month-over-month performance trends and insights</p>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">↗️ Improving</span>
          <span className="mr-2">↘️ Declining</span>
          <span>➡️ Stable</span>
        </div>
      </div>

      {/* Overall NVWR Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-900">
                {trendAnalysis.trends.nvwr.trend}
              </div>
              <div className="text-sm text-blue-700">NVWR Trend</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-blue-900">
                {formatTrendChange(trendAnalysis.trends.nvwr.change)}
              </div>
              <div className="text-xs text-blue-600">
                {trendAnalysis.trends.nvwr.current.toLocaleString()} vs {trendAnalysis.trends.nvwr.previous.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-900">
                {trendAnalysis.trends.costEfficiency.trend}
              </div>
              <div className="text-sm text-green-700">Cost Efficiency</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-green-900">
                {formatTrendChange(trendAnalysis.trends.costEfficiency.efficiencyChange)}
              </div>
              <div className="text-xs text-green-600">
                Cost-per-NVWR
              </div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-900">
                {trendAnalysis.trends.compliance.trend}
              </div>
              <div className="text-sm text-purple-700">Compliance</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-purple-900">
                {formatTrendChange(trendAnalysis.trends.compliance.change)}
              </div>
              <div className="text-xs text-purple-600">
                Onebuilder Mapping
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-900">
                {trendAnalysis.alerts.length}
              </div>
              <div className="text-sm text-orange-700">Active Alerts</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-orange-900">
                {trendAnalysis.successStories.length}
              </div>
              <div className="text-xs text-orange-600">
                Success Stories
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Alerts */}
      {trendAnalysis.alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Performance Alerts
          </h3>
          <div className="space-y-3">
            {trendAnalysis.alerts.map((alert, index) => (
              <div key={index} className={`flex items-start p-3 rounded-lg border ${getAlertColor(alert.severity)}`}>
                {getAlertIcon(alert.severity)}
                <div className="ml-3">
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm opacity-80">
                    {alert.severity === 'high' ? 'Immediate attention required' : 'Monitor closely'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Stories */}
      {trendAnalysis.successStories.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 text-green-600 mr-2" />
            Success Stories
          </h3>
          <div className="space-y-3">
            {trendAnalysis.successStories.map((story, index) => (
              <div key={index} className="flex items-start p-3 rounded-lg border bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">{story.message}</p>
                  <p className="text-sm text-green-700">
                    {story.type === 'market_improvement' ? 'Market performance improving' :
                     story.type === 'channel_efficiency' ? 'Channel efficiency gains' :
                     'Overall performance improvement'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Trends */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(trendAnalysis.trends.markets).map((country) => {
            const market = trendAnalysis.trends.markets[country];
            const trendColor = getTrendColor(market.change, 'positive');
            
            return (
              <div key={country} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{country}</h4>
                  <span className={`text-lg ${trendColor}`}>{market.trend}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {market.current.toLocaleString()} vs {market.previous.toLocaleString()} NVWR
                  </span>
                  <span className={`font-medium ${trendColor}`}>
                    {formatTrendChange(market.change)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel Trends */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance Evolution</h3>
        <div className="space-y-3">
          {Object.keys(trendAnalysis.trends.channels).map((channelType) => {
            const channel = trendAnalysis.trends.channels[channelType];
            const efficiencyColor = getTrendColor(channel.efficiencyChange, 'negative');
            const nvwrColor = getTrendColor(channel.nvwrChange, 'positive');
            
            return (
              <div key={channelType} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{channelType}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${efficiencyColor}`}>
                      Efficiency: {channel.trend}
                    </span>
                    <span className={`text-sm ${nvwrColor}`}>
                      NVWR: {channel.nvwrChange.direction === 'up' ? '↗️' : '↘️'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cost Efficiency:</span>
                    <span className={`ml-1 font-medium ${efficiencyColor}`}>
                      {formatTrendChange(channel.efficiencyChange)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">NVWR:</span>
                    <span className={`ml-1 font-medium ${nvwrColor}`}>
                      {formatTrendChange(channel.nvwrChange)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis; 