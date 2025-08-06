import React, { useState, useEffect, Component } from 'react';
import UploadPage from './components/UploadPage';
import Dashboard from './components/Dashboard';
import DataInventory from './components/DataInventory';
import { generateInsights } from './utils/insightGenerator';
import { initializeSupabase } from './utils/supabase';
import { 
  processAllCSVsFromSupabase, 
  getProcessedData, 
  getMetadata 
} from './utils/supabaseCsvProcessor';
import { processAllMonthsCompliance } from './utils/autoComplianceProcessor';
import { processAllMonthsKPI } from './utils/autoKPIProcessor';

import { AlertTriangle, Loader2, BarChart3, Database, TrendingUp, RefreshCw, Upload } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center animate-fade-in">
            <div className="bg-white rounded-2xl shadow-large p-8 border border-gray-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                An error occurred while rendering this component. Please try refreshing the page or contact support if the issue persists.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary w-full"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [parsedData, setParsedData] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState([]);
  const [isSupabaseInitialized, setIsSupabaseInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' or 'upload'
  const [selectedMonth, setSelectedMonth] = useState('all'); // Default to all months for trend analysis
  const [selectedMarket, setSelectedMarket] = useState('all'); // Default to all markets

  // Initialize Supabase on app startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing BMW Dashboard...');
        
        // Initialize Supabase
        const supabaseInitialized = await initializeSupabase();
        setIsSupabaseInitialized(supabaseInitialized);
        
        if (supabaseInitialized) {
          // Load data from Supabase
          await loadDataFromSupabase();
          
          // Check if compliance processing is needed and run it automatically
          try {
            const { checkComplianceCoverage } = await import('./utils/autoComplianceProcessor');
            const coverage = await checkComplianceCoverage();
            if (coverage.needsProcessing) {
              console.log('🔄 Auto-processing compliance for missing periods...');
              await processAllMonthsCompliance();
            }
          } catch (error) {
            console.warn('⚠️ Auto-compliance check failed:', error);
          }

          // Check if KPI processing is needed and run it automatically
          try {
            const { checkKPICoverage } = await import('./utils/autoKPIProcessor');
            const kpiCoverage = await checkKPICoverage();
            if (kpiCoverage.needsProcessing) {
              console.log('🔄 Auto-processing KPI metrics for missing periods...');
              await processAllMonthsKPI();
            }
          } catch (error) {
            console.warn('⚠️ Auto-KPI check failed:', error);
          }
        }
        
        // Always set initialization to complete
        setIsInitializing(false);
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []); // Empty dependency array to run only once

  // Load data from Supabase
  const loadDataFromSupabase = async () => {
    try {
      console.log('📊 Loading data from Supabase...');
      
      const [processedData, metadata] = await Promise.all([
        getProcessedData(),
        getMetadata()
      ]);

      if (processedData) {
        const data = processedData.data || [];
        setParsedData(data);
        console.log('✅ Processed data loaded:', processedData.total_records, 'records');
        
        // Generate insights from the loaded data
        if (data.length > 0) {
          console.log('🧠 Generating insights from data...');
          console.log('📊 Sample data row:', data[0]);
          console.log('📊 Data keys:', Object.keys(data[0]));
          

          
          const generatedInsights = generateInsights(data);
          setInsights(generatedInsights);
          console.log('✅ Generated', generatedInsights.length, 'insights');
        } else {
          setInsights([]);
        }
      } else {
        setParsedData([]);
        setInsights([]);
        console.log('ℹ️ No processed data found - this is normal for a new setup');
      }

      if (metadata) {
        setMetadata(metadata.metadata || {});
        console.log('✅ Metadata loaded');
      } else {
        setMetadata({});
        console.log('ℹ️ No metadata found - this is normal for a new setup');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading data from Supabase:', error);
      setIsLoading(false);
    }
  };

  // Handle data updates from FileUpload component
  const handleDataUpdate = async (newData) => {
    console.log('🔄 handleDataUpdate called, refreshing data from Supabase...');
    // This will be called when files are uploaded
    // We'll refresh data from Supabase
    await loadDataFromSupabase();
    setError(null);
  };

  // Handle metadata updates from FileUpload component
  const handleMetadataUpdate = async (newMetadata) => {
    // This will be called when files are uploaded
    // We'll refresh metadata from Supabase
    const metadata = await getMetadata();
    if (metadata) {
      setMetadata(metadata);
    }
  };

  // Handle refresh data request
  const handleRefreshData = async () => {
    try {
      console.log('🔄 Refreshing data from Supabase...');
      setIsLoading(true);
      
      // Process all uploaded files
      const result = await processAllCSVsFromSupabase();
      
      if (result.success) {
        console.log('✅ Data refreshed successfully');
        // Reload data from Supabase
        await loadDataFromSupabase();
      } else {
        console.error('❌ Error refreshing data:', result.error);
      }
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle load server files request (now loads from Supabase)
  const handleLoadServerFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await loadDataFromSupabase();
      
    } catch (err) {
      setError('Failed to load data from Supabase. Please check if files are available.');
      console.error('Supabase loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle errors from FileUpload component
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  // Clear all data and reset state
  const handleClearAll = () => {
    setParsedData([]);
    setMetadata(null);
    setInsights([]);
    setError(null);
    setIsLoading(false);
  };

  // Process June 2025 data for MoM calculations


  // Get available months from the data
  const getAvailableMonths = () => {
    if (!parsedData || parsedData.length === 0) return [];
    
    const months = [...new Set(parsedData.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))];
    return months.sort().reverse(); // Most recent first
  };

  // Market name mapping for display
  const getMarketDisplayName = (marketCode) => {
    const marketNames = {
      'BE': 'Belgium',
      'CH': 'Switzerland',
      'CS': 'Central Southern Europe',
      'ES': 'Spain',
      'FR': 'France',
      'IT': 'Italy',
      'NE': 'Nordics',
      'NL': 'Netherlands',
      'PT': 'Portugal',
      'UK': 'United Kingdom'
    };
    return marketNames[marketCode] || marketCode;
  };

  // Get available markets from the data
  const getAvailableMarkets = () => {
    if (!parsedData || parsedData.length === 0) return [];
    
    const markets = [...new Set(parsedData.map(row => {
      // Extract market code from file source
      if (row.file_source) {
        const match = row.file_source.match(/BMW_([A-Z]{2})_\d{4}_\d{2}\.csv/);
        return match ? match[1] : null;
      }
      return null;
    }).filter(Boolean))];
    
    return markets.sort(); // Alphabetical order
  };

  // Filter data by selected month and market
  const getFilteredData = () => {
    if (!parsedData) return [];
    
    let filteredData = parsedData;
    
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
  };

  // Get filtered insights
  const getFilteredInsights = () => {
    const filteredData = getFilteredData();
    if (!filteredData || filteredData.length === 0) return [];
    return generateInsights(filteredData);
  };

  // Show Supabase configuration error if not initialized
  if (!isSupabaseInitialized && !isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center animate-fade-in">
          <div className="bg-white rounded-2xl shadow-large p-8 border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Database className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Supabase Configuration Required</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Please configure your Supabase credentials in the environment variables to use this application.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
              <p className="font-semibold mb-2">Required environment variables:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• VITE_SUPABASE_URL</li>
                <li>• VITE_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentPage === 'upload' ? 'Data Management' : 'BMW Monthly Report Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentPage === 'upload' ? 'Upload and manage BMW CSV files' : 
                  'Upload and analyze BMW sales data across all markets and time periods'}
              </p>
            </div>
                        <div className="flex items-center gap-3">
              {currentPage === 'dashboard' && (
                <>
                  <button
                    onClick={handleRefreshData}
                    disabled={isLoading}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing...' : 'Refresh Data'}
                  </button>

                  <button
                    onClick={() => setCurrentPage('upload')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Data Management
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-8 animate-slide-up">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-soft">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                  <p className="text-red-700 leading-relaxed">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conditional Page Rendering */}
        {currentPage === 'upload' ? (
          <ErrorBoundary>
            <UploadPage 
              onDataUpdate={handleDataUpdate}
              onError={handleError}
              onClearAll={handleClearAll}
              onMetadataUpdate={handleMetadataUpdate}
              onBack={() => setCurrentPage('dashboard')}
              metadata={metadata}
              onRefresh={handleRefreshData}
              isRefreshing={isLoading}
              onLoadServerFiles={handleLoadServerFiles}
              isInitializing={isInitializing}
            />
          </ErrorBoundary>
        ) : (
                      <>

            {/* Enhanced Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-16">
                <div className="text-center animate-fade-in">
                  <div className="w-16 h-16 bg-gradient-to-br from-bmw-500 to-bmw-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-large">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Processing Data
                  </h3>
                  <p className="text-gray-600">
                    Analyzing your data to generate actionable insights...
                  </p>
                </div>
              </div>
            )}

            {/* Dashboard Section */}
            {!isLoading && getFilteredInsights().length > 0 && (
              <div className="mt-12 animate-fade-in">
                <ErrorBoundary>
                  <Dashboard 
                  data={parsedData} 
                  insights={insights} 
                  selectedMarket={selectedMarket}
                  selectedMonth={selectedMonth}
                  availableMarkets={getAvailableMarkets()}
                  availableMonths={getAvailableMonths()}
                  onMarketChange={setSelectedMarket}
                  onMonthChange={setSelectedMonth}
                  getMarketDisplayName={getMarketDisplayName}
                />
                </ErrorBoundary>
              </div>
            )}

            {/* Enhanced No Data State */}
            {!isLoading && !isInitializing && getFilteredData().length === 0 && !error && (
              <div className="text-center py-20 animate-fade-in">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Get Started</h3>
                  <p className="text-gray-600 leading-relaxed mb-8">
                    Upload your BMW CSV files to Supabase cloud storage to generate comprehensive insights and analytics for your marketing campaigns.
                  </p>
                  <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">What you'll get:</h4>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-bmw-500 rounded-full mr-3"></div>
                        Secure cloud storage for your CSV files
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-bmw-500 rounded-full mr-3"></div>
                        Performance insights and trends
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-bmw-500 rounded-full mr-3"></div>
                        Actionable recommendations
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
