import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  HelpCircle
} from 'lucide-react';
import { calculateComprehensiveDataQuality } from '../utils/dataQualityScorer.js';
import { analyzeOnebuilderCompliance } from '../utils/onebuilderCompliance.js';
import { getComplianceHistory } from '../utils/complianceHistory.js';

const DataQualityDashboard = ({ data, selectedMarket, selectedMonth, getMarketDisplayName }) => {
  const [showCalculationHelp, setShowCalculationHelp] = useState(false);

  // Calculate data quality for latest month and all markets
  const qualityData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    try {
      // Debug: Log all available data
      console.log('🔍 Data Quality Debug - All data:', {
        totalRecords: data.length,
        markets: [...new Set(data.map(row => row.country))],
        months: [...new Set(data.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))].sort(),
        sampleRecords: data.slice(0, 3).map(row => ({
          country: row.country,
          year: row.year,
          month: row.month,
          dimension: row.dimension,
          file_source: row.file_source
        }))
      });
      
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
      
      // Debug: Log filtered data
      console.log('🔍 Data Quality Debug - Latest month data:', {
        latestPeriod,
        filteredRecords: latestMonthData.length,
        markets: [...new Set(latestMonthData.map(row => row.country))],
        dimensions: [...new Set(latestMonthData.map(row => row.dimension))]
      });
      
      // Calculate comprehensive quality data for all markets
      const qualityData = calculateComprehensiveDataQuality(latestMonthData, 'all', latestPeriod);
      
      // Debug: Log quality data structure
      console.log('🔍 Data Quality Debug - Quality data structure:', {
        hasQualityData: !!qualityData,
        overallScore: qualityData?.overallScore,
        hasMarketAnalysis: !!qualityData?.marketAnalysis,
        marketCount: qualityData?.marketAnalysis ? Object.keys(qualityData.marketAnalysis).length : 0,
        dimensionBreakdown: qualityData?.dimensionBreakdown ? Object.keys(qualityData.dimensionBreakdown) : null
      });
      
      return qualityData;
    } catch (error) {
      console.error('Error calculating data quality:', error);
      return null;
    }
  }, [data]);

  // Calculate Onebuilder compliance
  const complianceData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    try {
      return analyzeOnebuilderCompliance(data);
    } catch (error) {
      console.error('Error calculating Onebuilder compliance:', error);
      return null;
    }
  }, [data]);

  // Get latest month display
  const latestMonthDisplay = useMemo(() => {
    if (!data || data.length === 0) return '';
    
    const availableMonths = [...new Set(data.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))].sort();
    if (availableMonths.length === 0) return '';
    
    const latestPeriod = availableMonths[availableMonths.length - 1];
    const [year, month] = latestPeriod.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long' });
    
    return `${monthName} ${year}`;
  }, [data]);

  if (!qualityData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500 py-8">
          No data quality information available
        </div>
      </div>
    );
  }

  const { overallScore, dataCompleteness } = qualityData;

  return (
      <div className="space-y-6">
      {/* Data Quality Score Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Data Quality Score</h3>
                <button
                  onClick={() => setShowCalculationHelp(!showCalculationHelp)}
              className="p-1 hover:bg-gray-100 rounded"
                >
              <HelpCircle className="h-4 w-4 text-gray-400" />
                </button>
          </div>
          <div className="text-sm text-gray-500">
            All Markets - {latestMonthDisplay} (Latest Month)
          </div>
        </div>

        {showCalculationHelp && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How Data Quality is Calculated</h4>
            <p className="text-sm text-blue-800 mb-2">
              The data quality score measures how well the sum of dimension data matches the total "All" data.
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Coverage Gap:</strong> Records missing from dimension files compared to "All" data</li>
              <li>• <strong>Weighted Average:</strong> Media Cost (25%), Impressions (20%), Clicks (15%), IV (20%), NVWR (20%)</li>
              <li>• <strong>Grade System:</strong> A+ (95-100%), A (90-94%), B (80-89%), C (70-79%), D (60-69%), F (0-59%)</li>
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Data Quality</span>
              <span className={`font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
                className={`h-3 rounded-full transition-all duration-300 ${getScoreBarColor(overallScore)}`}
              style={{ width: `${Math.min(overallScore, 100)}%` }}
            />
            </div>
          </div>
          <div className="ml-6 text-right">
            <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <div className={`text-sm font-medium ${getScoreColor(overallScore)}`}>
              Grade {getGrade(overallScore).grade} - {getGrade(overallScore).status}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{dataCompleteness}%</div>
            <div className="text-xs text-gray-500">Data Completeness</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">5</div>
            <div className="text-xs text-gray-500">Dimensions</div>
          </div>
        </div>
      </div>

      {/* Onebuilder Compliance Section */}
      {complianceData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Onebuilder Compliance Status</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getComplianceStatusColor(complianceData.overallCompliance)}`}>
              {formatCompliancePercentage(complianceData.overallCompliance)} Overall
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{formatNumber(complianceData.summary.totalRecords)}</div>
              <div className="text-sm text-gray-600">Total Records</div>
                      </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{formatNumber(complianceData.summary.mappedRecords)}</div>
              <div className="text-sm text-green-600">Mapped Records</div>
                    </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{formatNumber(complianceData.summary.totalUnmapped)}</div>
              <div className="text-sm text-red-600">Unmapped Records</div>
                      </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{complianceData.marketCompliance.length}</div>
              <div className="text-sm text-blue-600">Markets</div>
                  </div>
                </div>

          {/* Market Compliance Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unmapped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MoM Change
                  </th>
                    </tr>
                  </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complianceData.marketCompliance.map((market) => (
                  <tr key={market.marketCode}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getMarketDisplayName(market.marketCode)}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-16 h-2 bg-gray-200 rounded-full mr-2`}>
                          <div 
                            className={`h-2 rounded-full ${getComplianceBarColor(market.compliance)}`}
                            style={{ width: `${Math.min(market.compliance, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getComplianceTextColor(market.compliance)}`}>
                          {formatCompliancePercentage(market.compliance)}
                              </span>
                            </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(market.totalRecords)}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatNumber(market.totalUnmapped)}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {market.momChange && market.momChange.percentage !== null ? (
                        <div className={`flex items-center ${market.momChange.direction === 'up' ? 'text-green-600' : market.momChange.direction === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                          {market.momChange.direction === 'up' ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : market.momChange.direction === 'down' ? (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          ) : (
                            <div className="h-4 w-4 mr-1" />
                          )}
                          {formatMoMChange(market.momChange)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getScoreColor = (score) => {
  if (score >= 95) return 'text-green-600';
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-yellow-600';
  if (score >= 70) return 'text-orange-600';
  if (score >= 60) return 'text-red-600';
    return 'text-red-600';
  };

const getScoreBarColor = (score) => {
  if (score >= 95) return 'bg-green-500';
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-yellow-500';
  if (score >= 70) return 'bg-orange-500';
  if (score >= 60) return 'bg-red-500';
  return 'bg-red-500';
};

const getGrade = (score) => {
  if (score >= 95) return { grade: 'A+', status: 'Excellent' };
  if (score >= 90) return { grade: 'A', status: 'Good' };
  if (score >= 80) return { grade: 'B', status: 'Acceptable' };
  if (score >= 70) return { grade: 'C', status: 'Needs Attention' };
  if (score >= 60) return { grade: 'D', status: 'Poor' };
  return { grade: 'F', status: 'Critical' };
};

const getComplianceStatusColor = (compliance) => {
  if (compliance >= 95) return 'bg-green-100 text-green-800';
  if (compliance >= 90) return 'bg-yellow-100 text-yellow-800';
  if (compliance >= 80) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

const getComplianceBarColor = (compliance) => {
  if (compliance >= 95) return 'bg-green-500';
  if (compliance >= 90) return 'bg-yellow-500';
  if (compliance >= 80) return 'bg-orange-500';
  return 'bg-red-500';
};

const getComplianceTextColor = (compliance) => {
  if (compliance >= 95) return 'text-green-600';
  if (compliance >= 90) return 'text-yellow-600';
  if (compliance >= 80) return 'text-orange-600';
  return 'text-red-600';
};

const formatCompliancePercentage = (percentage) => {
  return `${Math.round(percentage)}%`;
};

const formatNumber = (num) => {
  return num.toLocaleString();
};

const formatMoMChange = (momChange) => {
  if (!momChange || momChange.percentage === null) return '-';
  const sign = momChange.direction === 'up' ? '+' : '';
  return `${sign}${Math.round(momChange.percentage)}%`;
};

export default DataQualityDashboard; 