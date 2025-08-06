import React, { useState, useMemo } from 'react';
import { Copy, CheckCircle, AlertTriangle, BarChart3, TrendingUp, Target, FileText, Activity, Lightbulb, Shield } from 'lucide-react';
import OnebuilderCompliance from './OnebuilderCompliance';
import EnhancedTrendAnalysis from './EnhancedTrendAnalysis';
import DataQualityDashboard from './DataQualityDashboard';
import DimensionCoverageAnalysis from './DimensionCoverageAnalysis';
import { generateInsights } from '../utils/insightGenerator';
import { calculateComprehensiveDataQuality, integrateComplianceData } from '../utils/dataQualityScorer';

const Dashboard = ({ 
  data, 
  insights, 
  selectedMarket, 
  selectedMonth, 
  availableMarkets, 
  availableMonths,
  onMarketChange,
  onMonthChange,
  getMarketDisplayName
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights', 'trends', 'compliance', 'quality'

  // Get the latest month from available data
  const getLatestMonth = () => {
    if (!availableMonths || availableMonths.length === 0) return 'No data available';
    const sortedMonths = [...availableMonths].sort();
    const latestMonth = sortedMonths[sortedMonths.length - 1];
    return new Date(latestMonth + '-01').toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Get data for current tab (latest month for insights/compliance, filtered for trends)
  const getTabData = () => {
    if (activeTab === 'trends') {
      // For trends tab, use filtered data based on selectors
      let filteredData = data;
      
      // Filter by month
      if (selectedMonth !== 'all') {
        filteredData = filteredData.filter(row => `${row.year}-${row.month.toString().padStart(2, '0')}` === selectedMonth);
      }
      
      // Filter by market
      if (selectedMarket !== 'all') {
        filteredData = filteredData.filter(row => {
          if (row.file_source) {
            const match = row.file_source.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/);
            return match && match[1] === selectedMarket;
          }
          return false;
        });
      }
      
      return filteredData;
    } else {
      // For insights and compliance tabs, use only the latest month's data for all markets
      if (!availableMonths || availableMonths.length === 0) return [];
      
      const sortedMonths = [...availableMonths].sort();
      const latestMonth = sortedMonths[sortedMonths.length - 1];
      const [latestYear, latestMonthNum] = latestMonth.split('-');
      
      return data.filter(row => 
        row.year === parseInt(latestYear) && 
        row.month === parseInt(latestMonthNum)
      );
    }
  };

  // Calculate data quality for insights
  const qualityData = useMemo(() => {
    if (activeTab !== 'insights') return null;
    
    const tabData = getTabData();
    if (!tabData || tabData.length === 0) return null;
    
    // Get the latest month if no specific month is selected
    let period = selectedMonth;
    if (selectedMonth === 'all') {
      const availableMonths = [...new Set(data.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))].sort();
      period = availableMonths[availableMonths.length - 1];
    }
    
    // Get the market code
    let market = selectedMarket;
    if (selectedMarket === 'all') {
      const availableMarkets = [...new Set(data.map(row => row.country))];
      market = availableMarkets[0]; // Use first available market
    }
    
    const baseQualityData = calculateComprehensiveDataQuality(data, market, period);
    
    // TODO: Integrate compliance data when available
    // For now, we'll need to get compliance data from the OnebuilderCompliance component
    // This could be done by passing compliance data as a prop or by calling the compliance processor
    
    return baseQualityData;
  }, [data, activeTab, selectedMarket, selectedMonth]);

  // Generate insights based on current tab data
  const tabInsights = useMemo(() => {
    const tabData = getTabData();
    if (!tabData || tabData.length === 0) return [];
    return generateInsights(tabData, qualityData);
  }, [data, activeTab, selectedMarket, selectedMonth, qualityData]);

  const copyAllInsights = async () => {
    if (tabInsights.length === 0) return;

    const formattedText = tabInsights.map((insight, index) => {
      return `${index + 1}. ${insight.title}
Value: ${insight.value}
Description: ${insight.description}
Recommendation: ${insight.recommendation}
`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy insights:', err);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Data Available</h3>
          <p className="text-gray-600 leading-relaxed">Upload CSV files to generate insights and analytics</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'insights',
      name: 'Generated Insights',
      icon: Lightbulb,
      description: `Actionable recommendations based on data from all markets for ${getLatestMonth()}. Use the Trend Analysis tab for historical data analysis and market deep dives.`
    },
    {
      id: 'trends',
      name: 'Trend Analysis',
      icon: Activity,
      description: 'Dynamic visualizations and performance trends with market and time period filtering'
    },
    {
      id: 'quality',
      name: 'Data Quality & Compliance',
      icon: Shield,
      description: 'Data quality assessment, gap analysis, and Onebuilder compliance across all dimensions'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-bmw-500 to-bmw-600 rounded-xl flex items-center justify-center shadow-md">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  BMW Monthly Report Dashboard
                </h2>
                <p className="text-gray-600 mt-2 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Key insights from {data.length.toLocaleString()} data records
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-bmw-100 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="h-5 w-5 text-bmw-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-xl font-bold text-gray-900">{data.length.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Insights Generated</p>
                    <p className="text-xl font-bold text-gray-900">{insights.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Quality</p>
                    <p className="text-xl font-bold text-gray-900">
                      {qualityData ? `${qualityData.overallScore}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center text-sm font-medium hover:text-gray-700 focus:z-10 focus:outline-none
                    ${isActive 
                      ? 'text-bmw-600 border-b-2 border-bmw-600' 
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-bmw-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    <span>{tab.name}</span>
                  </div>
                  <span className="absolute inset-x-0 -bottom-px h-px bg-gray-200" aria-hidden="true" />
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Tab Description */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'trends' && (
          <div>
            <EnhancedTrendAnalysis 
              data={getTabData()} 
              selectedMarket={selectedMarket}
              selectedMonth={selectedMonth}
              availableMarkets={availableMarkets}
              availableMonths={availableMonths}
            />
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="space-y-6">
            <OnebuilderCompliance data={getTabData()} />
            <DataQualityDashboard 
              data={data}
              selectedMarket={selectedMarket}
              selectedMonth={selectedMonth}
              getMarketDisplayName={getMarketDisplayName}
            />
            <DimensionCoverageAnalysis 
              data={data}
              getMarketDisplayName={getMarketDisplayName}
            />
          </div>
        )}

        {activeTab === 'insights' && (
          <div>
            {tabInsights.length > 0 ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Generated Insights</h3>
                    <p className="text-gray-600">Actionable recommendations based on your data analysis</p>
                  </div>
                  <button
                    onClick={copyAllInsights}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-bmw-600 hover:bg-bmw-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bmw-500 transition-colors duration-200"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                      </>
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tabInsights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} index={index} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Insights Generated</h3>
                <p className="text-gray-600 leading-relaxed">Unable to generate insights from the provided data</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const InsightCard = ({ insight, index }) => {
  // Determine card color based on insight type
  const isPositive = ['Performance Leader', 'Channel Champion', 'Model Spotlight', 'Volume Driver', 'Conversion King', 'Campaign Type Winner'].includes(insight.title);
  const isAlert = ['Efficiency Alert'].includes(insight.title);
  const isNeutral = ['Budget Distribution'].includes(insight.title);

  // Check if this is a quality-aware insight
  const hasQualityData = insight.confidence !== undefined;

  const cardColors = isPositive
    ? {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        border: 'border-blue-200',
        title: 'text-blue-900',
        value: 'text-blue-700',
        description: 'text-blue-800',
        recommendation: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700',
        icon: 'text-blue-600'
      }
    : isAlert
    ? {
        bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
        border: 'border-orange-200',
        title: 'text-orange-900',
        value: 'text-orange-700',
        description: 'text-orange-800',
        recommendation: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-700',
        icon: 'text-orange-600'
      }
    : isNeutral
    ? {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        border: 'border-green-200',
        title: 'text-green-900',
        value: 'text-green-700',
        description: 'text-green-800',
        recommendation: 'text-green-600',
        badge: 'bg-green-100 text-green-700',
        icon: 'text-green-600'
      }
    : {
        bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        border: 'border-gray-200',
        title: 'text-gray-900',
        value: 'text-gray-700',
        description: 'text-gray-800',
        recommendation: 'text-gray-600',
        badge: 'bg-gray-100 text-gray-700',
        icon: 'text-gray-600'
      };

  return (
    <div className={`${cardColors.bg} ${cardColors.border} border-2 rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1`}>
      {/* Card Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${cardColors.badge}`}>
            {index + 1}
          </div>
          <div className="ml-4">
            <h3 className={`text-lg font-bold ${cardColors.title} leading-tight`}>
              {insight.title}
            </h3>
            {hasQualityData && (
              <div className="flex items-center mt-1">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  insight.confidence >= 95 ? 'bg-green-100 text-green-800' :
                  insight.confidence >= 80 ? 'bg-yellow-100 text-yellow-800' :
                  insight.confidence >= 60 ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {insight.confidence}% confidence
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="space-y-4">
        <div>
          <p className={`text-sm font-medium ${cardColors.value} mb-1`}>Key Value</p>
          <p className={`text-lg font-semibold ${cardColors.description}`}>
            {insight.value}
          </p>
        </div>

        <div>
          <p className={`text-sm font-medium ${cardColors.value} mb-1`}>Description</p>
          <p className={`text-sm ${cardColors.description} leading-relaxed`}>
            {insight.description}
          </p>
        </div>

        <div>
          <p className={`text-sm font-medium ${cardColors.value} mb-1`}>Recommendation</p>
          <p className={`text-sm ${cardColors.recommendation} leading-relaxed`}>
            {insight.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
