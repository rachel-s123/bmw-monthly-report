import React from 'react';
import { RefreshCw, FileText, MapPin, Calendar, Database, AlertCircle, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';

const DataInventory = ({ metadata, onRefresh, isRefreshing, onLoadServerFiles }) => {
  if (!metadata) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-bmw-500 to-bmw-600 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Data Inventory</h3>
                <p className="text-sm text-gray-600">Manage and monitor your data sources</p>
              </div>
            </div>
            <div className="flex space-x-3">
              {onLoadServerFiles && (
                <button
                  onClick={onLoadServerFiles}
                  disabled={isRefreshing}
                  className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Load Server Files
                </button>
              )}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No Data Available</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Upload CSV files to get started with data analysis and insights generation.
            </p>
            <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
              <h4 className="font-semibold text-gray-900 mb-3">What you can do:</h4>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-bmw-500 rounded-full mr-3"></div>
                  Upload BMW CSV files
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-bmw-500 rounded-full mr-3"></div>
                  Load data from server
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-bmw-500 rounded-full mr-3"></div>
                  Generate insights and analytics
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ensure metadata has all required properties with defaults
  const safeMetadata = {
    lastProcessed: metadata.lastProcessed || new Date().toISOString(),
    totalRecords: metadata.totalRecords || 0,
    successfulFiles: metadata.successfulFiles || 0,
    totalFiles: metadata.totalFiles || 0,
    markets: metadata.markets || [],
    months: metadata.months || [],
    fileResults: metadata.fileResults || [],
    source: metadata.source || 'unknown'
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-bmw-500 to-bmw-600 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Data Inventory</h3>
              <p className="text-sm text-gray-600 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Last updated: {formatDate(safeMetadata.lastProcessed)}
                {safeMetadata.source && (
                  <span className="ml-2 badge badge-info">
                    {safeMetadata.source}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            {onLoadServerFiles && (
              <button
                onClick={onLoadServerFiles}
                disabled={isRefreshing}
                className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Database className="h-4 w-4 mr-2" />
                Load Server Files
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-bmw-50 to-blue-50 p-6 rounded-xl border border-bmw-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-bmw-100 rounded-lg flex items-center justify-center mr-4">
                <Database className="h-6 w-6 text-bmw-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{safeMetadata.totalRecords.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Successful Files</p>
                <p className="text-2xl font-bold text-gray-900">{safeMetadata.successfulFiles}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Markets</p>
                <p className="text-2xl font-bold text-gray-900">{safeMetadata.markets.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Time Periods</p>
                <p className="text-2xl font-bold text-gray-900">{safeMetadata.months.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Markets and Months */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Markets */}
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-bmw-600" />
              Markets ({safeMetadata.markets.length})
            </h4>
            {safeMetadata.markets.length > 0 ? (
              <div className="space-y-2">
                {safeMetadata.markets.map((market, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{market}</span>
                    <span className="badge badge-info">Active</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No markets data available</p>
            )}
          </div>

          {/* Months */}
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-bmw-600" />
              Time Periods ({safeMetadata.months.length})
            </h4>
            {safeMetadata.months.length > 0 ? (
              <div className="space-y-2">
                {safeMetadata.months.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{month}</span>
                    <span className="badge badge-success">Processed</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No time period data available</p>
            )}
          </div>
        </div>

        {/* File Results */}
        {safeMetadata.fileResults && safeMetadata.fileResults.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-bmw-600" />
              File Processing Results
            </h4>
            <div className="space-y-3">
              {safeMetadata.fileResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      result.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{result.filename}</p>
                      <p className="text-sm text-gray-600">
                        {result.success ? `${result.records} records processed` : result.error}
                      </p>
                    </div>
                  </div>
                  {result.fileSize && (
                    <span className="text-sm text-gray-500">{formatFileSize(result.fileSize)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataInventory; 