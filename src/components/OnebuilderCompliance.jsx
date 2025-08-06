import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Circle, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { analyzeOnebuilderCompliance, formatCompliancePercentage, formatNumber, formatCurrency, formatMoMChange } from '../utils/onebuilderCompliance';
import { getComplianceHistory, saveComplianceHistory, extractDataPeriod, getMonthName } from '../utils/complianceHistory';

const OnebuilderCompliance = ({ data }) => {
  const [expandedMarkets, setExpandedMarkets] = useState(new Set());
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load historical data when component mounts
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        setLoading(true);
        const history = await getComplianceHistory();
        setHistoricalData(history);
      } catch (error) {
        console.error('Error loading historical data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalData();
  }, []);

  // Save current compliance data to history when data changes
  useEffect(() => {
    const saveCurrentData = async () => {
      if (data && data.length > 0 && !loading) {
        try {
          const { year, month } = extractDataPeriod(data);
          const monthName = getMonthName(month);
          const compliance = analyzeOnebuilderCompliance(data, historicalData);
          
          await saveComplianceHistory(compliance.marketCompliance, year, month, monthName);
        } catch (error) {
          console.error('Error saving compliance history:', error);
        }
      }
    };

    saveCurrentData();
  }, [data, historicalData, loading]);

  // Only calculate compliance when we have both data and historical data
  const compliance = useMemo(() => {
    if (!data || data.length === 0 || loading) {
      return null;
    }
    return analyzeOnebuilderCompliance(data, historicalData);
  }, [data, historicalData, loading]);

  // Debug: Log the compliance data to see if momChange is present
  console.log('🔍 OnebuilderCompliance Debug:', {
    hasData: !!data,
    dataLength: data?.length,
    hasHistoricalData: !!historicalData,
    historicalDataLength: historicalData?.length,
    loading,
    complianceMarkets: compliance?.marketCompliance?.map(market => ({
      marketCode: market.marketCode,
      compliance: market.compliance,
      hasMomChange: !!market.momChange,
      momChange: market.momChange
    }))
  });

  if (!data || data.length === 0 || !compliance) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status.status) {
      case 'Green':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Yellow':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Orange':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'Red':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.status) {
      case 'Green':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Yellow':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Orange':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Red':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUnmappedDataTypes = (market) => {
    const types = [];
    if (market.unmappedByField.model > 0) types.push(`Model: ${market.unmappedByField.model}`);
    if (market.unmappedByField.phase > 0) types.push(`Phase: ${market.unmappedByField.phase}`);
    if (market.unmappedByField.channelType > 0) types.push(`Channel Type: ${market.unmappedByField.channelType}`);
    if (market.unmappedByField.channelName > 0) types.push(`Channel Name: ${market.unmappedByField.channelName}`);
    if (market.unmappedByField.campaignType > 0) types.push(`Campaign Type: ${market.unmappedByField.campaignType}`);
    return types;
  };

  const toggleMarketExpansion = (marketCode) => {
    const newExpanded = new Set(expandedMarkets);
    if (newExpanded.has(marketCode)) {
      newExpanded.delete(marketCode);
    } else {
      newExpanded.add(marketCode);
    }
    setExpandedMarkets(newExpanded);
  };

  const getUnmappedRecordsForMarket = (market) => {
    return data.filter(row => 
      (row.country && row.country.length === 2 ? row.country.toUpperCase() : (row.file_source?.match(/BMW_([A-Z]{2})_/)?[1] : row.country)) === market.marketCode && (
        !row.Model || row.Model.trim() === '' || row.Model.toLowerCase().includes('not mapped') ||
        !row.Phase || row.Phase.trim() === '' || row.Phase.toLowerCase().includes('not mapped') ||
        !row['Channel Type'] || row['Channel Type'].trim() === '' || row['Channel Type'].toLowerCase().includes('not mapped') ||
        !row['Channel Name'] || row['Channel Name'].trim() === '' || row['Channel Name'].toLowerCase().includes('not mapped') ||
        !row['Campaign Type'] || row['Campaign Type'].trim() === '' || row['Campaign Type'].toLowerCase().includes('not mapped')
      )
    );
  };

  const Tooltip = ({ children, content }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative inline-block">
        <div
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          className="cursor-help"
        >
          {children}
        </div>
        {isVisible && (
          <div className="absolute z-10 w-80 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg -top-2 left-8 transform -translate-y-full">
            <div className="relative">
              {content}
              <div className="absolute top-0 -left-2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">Onebuilder Completion Status</h3>
            <Tooltip content={
              <div>
                <p className="font-semibold mb-2">What is "Unmapped" Data?</p>
                <p className="mb-2">Unmapped data occurs when a market has added campaigns to Onebuilder but hasn't correctly filled out the required details.</p>
                <p className="mb-2">This causes the data to appear in Datorama as "NOT MAPPED" instead of properly categorized.</p>
                <p className="text-yellow-300">💡 Tip: Markets need to ensure all campaign fields are properly mapped in Onebuilder for accurate reporting.</p>
              </div>
            }>
              <HelpCircle className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            </Tooltip>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Market-by-market breakdown of data mapping completion
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center ${getStatusColor(compliance.summary.complianceStatus)}`}>
          {getStatusIcon(compliance.summary.complianceStatus)}
          <span className="ml-2 font-semibold">
            {formatCompliancePercentage(compliance.overallCompliance)} Overall
          </span>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{formatNumber(compliance.summary.totalRecords)}</div>
          <div className="text-sm text-gray-600">Total Records</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{formatNumber(compliance.summary.mappedRecords)}</div>
          <div className="text-sm text-green-600">Mapped Records</div>
        </div>
        <Tooltip content={
          <div>
            <p className="font-semibold mb-2">Unmapped Records</p>
            <p className="mb-2">These are records where campaigns exist in Onebuilder but key fields like Model, Phase, Channel Type, etc. are missing or set to "NOT MAPPED".</p>
            <p className="text-yellow-300">💡 This affects data quality and reporting accuracy in Datorama.</p>
          </div>
        }>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 cursor-help">
            <div className="text-2xl font-bold text-red-600">{formatNumber(compliance.summary.totalUnmapped)}</div>
            <div className="text-sm text-red-600">Unmapped Records</div>
          </div>
        </Tooltip>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{compliance.marketCompliance.length}</div>
          <div className="text-sm text-blue-600">Markets</div>
        </div>
      </div>

      {/* Market Compliance Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MoM Change</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unmapped Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NVWR Impact</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {compliance.marketCompliance.map((market) => {
              const isExpanded = expandedMarkets.has(market.marketCode);
              const unmappedRecords = getUnmappedRecordsForMarket(market);
              
              return (
                <React.Fragment key={market.marketCode}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleMarketExpansion(market.marketCode)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                        )}
                        <div className="text-sm font-semibold text-gray-900">{market.marketCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(market.status)}
                        <span className={`ml-2 text-sm font-semibold ${getStatusColor(market.status).split(' ')[0]}`}>
                          {formatCompliancePercentage(market.compliance)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Debug: Log MoM data for this market */}
                      {console.log(`🔍 MoM Debug for ${market.marketCode}:`, {
                        hasMomChange: !!market.momChange,
                        momChange: market.momChange,
                        percentage: market.momChange?.percentage,
                        direction: market.momChange?.direction
                      })}
                      {market.momChange && market.momChange.percentage !== null ? (
                        <div className="flex items-center">
                          {market.momChange.direction === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : market.momChange.direction === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400 mr-1" />
                          )}
                          <span className={`text-sm font-medium ${
                            market.momChange.direction === 'up' ? 'text-green-600' : 
                            market.momChange.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {formatMoMChange(market.momChange).text}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{formatNumber(market.mappedRecords)} mapped</div>
                        <div className="text-red-600 font-medium">{formatNumber(market.totalUnmapped)} unmapped</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getUnmappedDataTypes(market).map((type, index) => (
                          <div key={index} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded font-medium">
                            {type}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{formatNumber(market.totalNVWR)} total</div>
                        <div className="text-red-600 font-medium">
                          {formatNumber(market.unmappedNVWR)} ({formatCompliancePercentage(market.unmappedNVWRPercentage)})
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Unmapped Data Table */}
                  {isExpanded && unmappedRecords.length > 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 bg-gray-50">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                            <h4 className="text-sm font-semibold text-red-800">
                              Unmapped Data Details for {market.marketCode} ({unmappedRecords.length} records)
                            </h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Channel Type</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Channel Name</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Campaign Type</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NVWR</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Media Cost</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {unmappedRecords.slice(0, 20).map((record, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        !record.Model || record.Model.trim() === '' || record.Model.toLowerCase().includes('not mapped')
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {record.Model || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        !record.Phase || record.Phase.trim() === '' || record.Phase.toLowerCase().includes('not mapped')
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {record.Phase || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        !record['Channel Type'] || record['Channel Type'].trim() === '' || record['Channel Type'].toLowerCase().includes('not mapped')
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {record['Channel Type'] || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        !record['Channel Name'] || record['Channel Name'].trim() === '' || record['Channel Name'].toLowerCase().includes('not mapped')
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {record['Channel Name'] || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        !record['Campaign Type'] || record['Campaign Type'].trim() === '' || record['Campaign Type'].toLowerCase().includes('not mapped')
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {record['Campaign Type'] || 'N/A'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs font-medium text-gray-900">
                                      {formatNumber(parseFloat(record.NVWR) || 0)}
                                    </td>
                                    <td className="px-4 py-2 text-xs font-medium text-gray-900">
                                      {formatCurrency(parseFloat(record['Media Cost']) || 0)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {unmappedRecords.length > 20 && (
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                              Showing first 20 of {unmappedRecords.length} unmapped records
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Unmapped Data Types Summary */}
      {Object.values(compliance.unmappedDataTypes).some(count => count > 0) && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="text-sm font-semibold text-yellow-800 mb-3">Unmapped Data Types Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(compliance.unmappedDataTypes).map(([type, count]) => (
              count > 0 && (
                <div key={type} className="text-xs bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-center border border-yellow-300">
                  <div className="font-semibold">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                  <div className="text-lg font-bold">{formatNumber(count)}</div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnebuilderCompliance;