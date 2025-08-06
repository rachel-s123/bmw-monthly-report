import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Trash2, FileText, RefreshCw, Loader2, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { uploadFileToSupabase, getUploadedFiles, processCSVFileFromSupabase, processAllCSVsFromSupabase, deleteFileFromSupabase, clearAllDataFromSupabase } from '../utils/supabaseCsvProcessor.js';
import DataInventory from './DataInventory';

const UploadPage = ({ onDataUpdate, onError, onClearAll, onMetadataUpdate, onBack, metadata, onRefresh, isRefreshing, onLoadServerFiles, isInitializing }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(new Set());

  // Expected columns for BMW data (matching actual CSV structure)
  const expectedColumns = [
    'Country', 'Campaign Type', 'Channel Type', 'Channel Name', 'Phase', 'Model',
    'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'CP NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order',
    'Meta_Leads', 'Cp lead Forms'
  ];

  // Load existing files from Supabase on component mount
  React.useEffect(() => {
    loadExistingFiles();
  }, []);

  const loadExistingFiles = async () => {
    try {
      const files = await getUploadedFiles();
      setUploadedFiles(files.map(file => ({
        name: file.filename,
        status: 'success',
        message: `Uploaded to Supabase (${file.file_size} bytes)`,
        data: null,
        fileInfo: {
          country: file.country,
          year: file.year,
          month: file.month,
          monthName: file.month_name
        }
      })));
    } catch (error) {
      console.error('Error loading existing files:', error);
    }
  };

  const processFile = async (file) => {
    try {
      console.log(`🔄 Processing file: ${file.name}`);
      
      // Check if file is already being processed
      if (processingFiles.has(file.name)) {
        console.log(`⚠️ File ${file.name} is already being processed, skipping`);
        return;
      }

      // Add file to processing set
      processingFiles.add(file.name);
      setProcessingFiles(new Set(processingFiles));

      // Upload file to Supabase
      const result = await uploadFileToSupabase(file);
      
      if (result.success) {
        console.log(`✅ ${result.message}: ${file.name}`);
        
        // Add to uploaded files list if not already there
        if (!uploadedFiles.some(f => f.filename === file.name)) {
          setUploadedFiles(prev => [...prev, result.fileRecord]);
        }

        // Process the uploaded file to extract data
        console.log(`🔄 Processing data from ${file.name}...`);
        try {
          await processCSVFileFromSupabase(result.fileRecord);
          console.log(`✅ Data processed successfully from ${file.name}`);
          
          // Trigger data refresh in parent components
          if (onDataUpdate) {
            onDataUpdate([]); // This will trigger a refresh
          }
          if (onMetadataUpdate) {
            onMetadataUpdate(null); // This will trigger a refresh
          }
        } catch (processError) {
          console.error(`❌ Error processing data from ${file.name}:`, processError);
        }
      } else {
        console.error(`❌ Failed to upload ${file.name}: ${result.message}`);
      }

    } catch (error) {
      console.error(`❌ Error processing file ${file.name}:`, error);
    } finally {
      // Remove file from processing set
      processingFiles.delete(file.name);
      setProcessingFiles(new Set(processingFiles));
    }
  };

  const handleFiles = useCallback(async (files) => {
    const csvFiles = Array.from(files).filter(file => 
      file.type === 'text/csv' || file.name.endsWith('.csv')
    );

    if (csvFiles.length === 0) {
      onError('Please select CSV files only.');
      return;
    }

    setIsProcessing(true);
    
    try {
      for (const file of csvFiles) {
        await processFile(file);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      onError('Error processing files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [onError]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    handleFiles(files);
  }, [handleFiles]);

  const removeFile = async (index) => {
    const file = uploadedFiles[index];
    try {
      await deleteFileFromSupabase(file.name);
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
      
      // Trigger data refresh
      if (onDataUpdate) {
        onDataUpdate([]);
      }
      if (onMetadataUpdate) {
        onMetadataUpdate(null);
      }
    } catch (error) {
      console.error('Error removing file:', error);
      onError('Error removing file. Please try again.');
    }
  };

  const clearAllFiles = async () => {
    try {
      await clearAllDataFromSupabase();
      setUploadedFiles([]);
      if (onClearAll) {
        onClearAll();
      }
    } catch (error) {
      console.error('Error clearing all files:', error);
      onError('Error clearing all files. Please try again.');
    }
  };

  const handleProcessAllFiles = async () => {
    try {
      console.log('🔄 Processing all uploaded files...');
      setIsProcessing(true);
      
      const result = await processAllCSVsFromSupabase();
      
      if (result.success) {
        console.log('✅ All files processed successfully');
        
        // Trigger data refresh in parent components
        if (onDataUpdate) {
          onDataUpdate([]);
        }
        if (onMetadataUpdate) {
          onMetadataUpdate(null);
        }
        
        // Reload files list
        await loadExistingFiles();
      } else {
        console.error('❌ Error processing files:', result.error);
      }
    } catch (error) {
      console.error('❌ Error processing all files:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={onBack}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
            <p className="text-gray-600 mt-1">Upload and manage BMW CSV files</p>
          </div>
        </div>
      </div>
      
      {/* Enhanced Loading State */}
      {isInitializing && (
        <div className="mb-8 flex justify-center items-center py-16">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-bmw-500 to-bmw-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-large">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Initializing Supabase
            </h3>
            <p className="text-gray-600">
              Setting up cloud storage and database...
            </p>
          </div>
        </div>
      )}

      {/* Data Inventory Section */}
      {!isInitializing && (
        <div className="mb-8 animate-fade-in">
          <DataInventory 
            metadata={metadata}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onLoadServerFiles={onLoadServerFiles}
          />
        </div>
      )}
      
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-bmw-500 to-bmw-600 rounded-xl flex items-center justify-center shadow-md">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">File Upload</h2>
            <p className="text-gray-600 mt-1">
              Upload your BMW CSV files to Supabase cloud storage
            </p>
          </div>
        </div>
        
        {/* Expected Columns Info */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-bmw-600" />
            Expected CSV Structure
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your CSV files should contain the following columns:
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
              {expectedColumns.map((column, index) => (
                <div key={index} className="bg-white px-2 py-1 rounded border text-gray-700 font-mono">
                  {column}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Files will be stored securely in Supabase cloud storage and processed data will be cached for faster loading
          </p>
        </div>
      </div>

      {/* Enhanced Processing Indicator */}
      {isProcessing && (
        <div className="mb-6 bg-gradient-to-r from-bmw-50 to-blue-50 border border-bmw-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-bmw-100 rounded-full flex items-center justify-center mr-4">
              <Loader2 className="h-6 w-6 text-bmw-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-bmw-800 mb-1">Uploading to Supabase</h3>
              <p className="text-bmw-700">Uploading files to cloud storage and processing data...</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          isDragOver 
            ? 'border-bmw-500 bg-gradient-to-br from-bmw-50 to-blue-50 shadow-medium scale-105' 
            : 'border-gray-300 hover:border-bmw-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 ${
          isDragOver ? 'bg-bmw-100 scale-110' : 'bg-gray-100'
        }`}>
          <Upload className={`h-10 w-10 transition-colors duration-300 ${
            isDragOver ? 'text-bmw-600' : 'text-gray-400'
          }`} />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {isDragOver ? 'Drop your files here' : 'Drag and drop CSV files here'}
        </h3>
        <p className="text-gray-600 mb-6">
          or click to browse files
        </p>
        
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="btn-primary inline-flex items-center gap-2 cursor-pointer"
        >
          <FileText className="h-5 w-5" />
          Choose Files
        </label>
      </div>

      {/* Uploaded Files Section */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8 bg-white rounded-xl p-6 shadow-soft border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <button
              onClick={clearAllFiles}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </div>
          
          <div className="space-y-4">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="bg-white border-2 rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      file.status === 'success' ? 'bg-green-100' : 
                      file.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      {file.status === 'success' ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : file.status === 'error' ? (
                        <XCircle className="h-6 w-6 text-red-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{file.name}</h4>
                      <p className={`text-sm font-medium ${
                        file.status === 'success' ? 'text-green-600' : 
                        file.status === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {file.message}
                      </p>
                      {file.fileInfo && (
                        <p className="text-xs text-gray-500 mt-1">
                          {file.fileInfo.country} - {file.fileInfo.monthName} {file.fileInfo.year}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Upload Summary */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Supabase Storage Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{uploadedFiles.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600">
                {uploadedFiles.filter(f => f.status === 'success').length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {uploadedFiles.filter(f => f.status === 'error').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Process All Files Button */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <button
            onClick={handleProcessAllFiles}
            disabled={isProcessing}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Processing...' : 'Process All Files'}
          </button>
          <p className="text-sm text-gray-600 mt-1">
            Process uploaded files to extract data for the dashboard
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadPage; 