import React, { useMemo } from 'react';
import { calculateComprehensiveDataQuality } from '../utils/dataQualityScorer.js';

const DimensionCoverageAnalysis = ({ data, getMarketDisplayName }) => {
  // Calculate dimension coverage for latest month and all markets
  const coverageData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    try {
      // Always use the latest month
      const availableMonths = [...new Set(data.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))].sort();
      if (availableMonths.length === 0) {
        console.warn('No available months found in data');
        return null;
      }
      const latestPeriod = availableMonths[availableMonths.length - 1];
      
      // Filter data to latest month only
      const [latestYear, latestMonth] = latestPeriod.split('-');
      const latestMonthData = data.filter(row => 
        row.year === parseInt(latestYear) && 
        row.month === parseInt(latestMonth)
      );
      
      // Calculate comprehensive quality data for all markets
      const qualityData = calculateComprehensiveDataQuality(latestMonthData, 'all', latestPeriod);
      
      return qualityData;
    } catch (error) {
      console.error('Error calculating dimension coverage:', error);
      return null;
    }
  }, [data]);

  if (!coverageData || !coverageData.marketAnalysis) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Dimension Coverage Analysis</h3>
        </div>
        <div className="text-center text-gray-500 py-8">
          No dimension coverage data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Dimension Coverage Analysis</h3>
      </div>

      {/* Individual Market Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(coverageData.marketAnalysis).map(([marketCode, marketData]) => (
          <MarketAnalysisCard
            key={marketCode}
            marketCode={marketCode}
            marketData={marketData}
            getMarketDisplayName={getMarketDisplayName}
          />
        ))}
      </div>
    </div>
  );
};

const MarketAnalysisCard = ({ marketCode, marketData, getMarketDisplayName }) => {
  const getCoverageColor = (coverage) => {
    if (coverage >= 95) return 'text-green-600';
    if (coverage >= 85) return 'text-yellow-600';
    if (coverage >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (coverage) => {
    if (coverage >= 95) return 'bg-green-100 text-green-800';
    if (coverage >= 85) return 'bg-yellow-100 text-yellow-800';
    if (coverage >= 70) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = (coverage) => {
    if (coverage >= 95) return 'Excellent';
    if (coverage >= 85) return 'Good';
    if (coverage >= 70) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-medium text-gray-900">{getMarketDisplayName(marketCode)}</h5>
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(marketData.overallCoverage)}`}>
          {getStatusText(marketData.overallCoverage)}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Overall Coverage</span>
          <span className={`font-bold ${getCoverageColor(marketData.overallCoverage)}`}>
            {marketData.overallCoverage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              marketData.overallCoverage >= 95 ? 'bg-green-500' : 
              marketData.overallCoverage >= 85 ? 'bg-yellow-500' : 
              marketData.overallCoverage >= 70 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(marketData.overallCoverage, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Dimension Coverage</h6>
        {Object.entries(marketData.dimensionScores).map(([dimension, score]) => (
          <div key={dimension} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 truncate">{dimension}</span>
            <span className={`font-medium ${getCoverageColor(score.coverage)}`}>
              {score.coverage}%
            </span>
          </div>
        ))}
      </div>

      {/* Critical Issues */}
      {marketData.criticalIssues && marketData.criticalIssues.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Critical Issues</h6>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              Data missing from dimension-filtered files compared to "All" data
            </p>
            {marketData.criticalIssues.slice(0, 3).map((issue, index) => (
              <div key={index} className="text-xs text-red-600">
                • {issue.dimension}: Only {issue.coverage}% of data is properly categorized
              </div>
            ))}
            {marketData.criticalIssues.length > 3 && (
              <div className="text-xs text-gray-500">
                +{marketData.criticalIssues.length - 3} more issues
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DimensionCoverageAnalysis; 