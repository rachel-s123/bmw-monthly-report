import Papa from 'papaparse';

// Browser-compatible file operations using localStorage and IndexedDB
// For now, we'll use localStorage for metadata and keep data in memory
// In a real app, you'd want to use IndexedDB for larger datasets

// Expected columns for BMW data validation - now varies by dimension
const expectedColumnsByDimension = {
  'All': [
    'Country', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'CampaignType': [
    'Country', 'Campaign Type', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'ChannelType': [
    'Country', 'Channel Type', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'ChannelName': [
    'Country', 'Channel Name', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'Phase': [
    'Country', 'Phase', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'Model': [
    'Country', 'Model', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ]
};

// Columns that can be missing – optional metrics we rarely have
const optionalColumns = ['CP DCS (pre) Order', 'DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'];

// Alternative column names that should be accepted
const alternativeColumns = {
    'Meta_Leads': 'Meta Leads',  // Handle underscore vs space
    'CP NVWR': 'Cp NVWR',        // Handle case variations
    'CP Lead Forms': 'Cp lead Forms',  // Handle case variations
    'Model ': 'Model',            // Handle trailing space
    'COUNTRY': 'Country',        // Handle uppercase country column
    'country': 'Country'         // Handle lowercase country column
  };

// Columns that should be ignored (extra columns in some files)
const ignoredColumns = [
  'Line Item (Free Field)',
  'Campaign Detail (Free Field)'
];

// Storage keys
const PROCESSED_DATA_KEY = 'bmw_processed_data';
const METADATA_KEY = 'bmw_metadata';
const UPLOADED_FILES_KEY = 'bmw_uploaded_files';

/**
 * Validate CSV structure against expected columns for the specific dimension
 */
export const validateCSVStructure = (data, dimension) => {
  if (data.length === 0) {
    const expectedColumns = expectedColumnsByDimension[dimension] || [];
    return { isValid: false, missingColumns: expectedColumns, headers: [] };
  }
  
  const headers = Object.keys(data[0]);
  
  // Filter out ignored columns and normalize the rest
  const filteredHeaders = headers.filter(header => !ignoredColumns.includes(header));
  
  const normalizedHeaders = filteredHeaders.map(header => {
    return alternativeColumns[header] || header;
  });
  
  const expectedColumns = expectedColumnsByDimension[dimension] || [];
  const requiredColumns = expectedColumns.filter(col => col !== 'Country' && !optionalColumns.includes(col));
  const missingRequiredColumns = requiredColumns.filter(col => !normalizedHeaders.includes(col));
  
  return {
    isValid: missingRequiredColumns.length === 0,
    missingColumns: missingRequiredColumns,
    headers: normalizedHeaders,
    originalHeaders: headers,
    dimension: dimension
  };
};

/**
 * Extract file info from new naming convention
 * Expected format: BMW_[COUNTRY]_[DIMENSION]_[YEAR]_[MONTH].csv
 * Examples: BMW_FR_All_2025_07.csv, BMW_FR_CampaignType_2025_07.csv
 */
export const extractFileInfo = (filename) => {
  const match = filename.match(/BMW_([A-Z]{2})_([A-Za-z]+)_(\d{4})_(\d{2})\.csv/);
  if (match) {
    return {
      country: match[1],
      dimension: match[2],
      year: parseInt(match[3]),
      month: parseInt(match[4]),
      monthName: new Date(parseInt(match[3]), parseInt(match[4]) - 1).toLocaleString('default', { month: 'long' })
    };
  }
  return null;
};

/**
 * Get file inventory from localStorage grouped by market and month
 */
export const getDataInventory = () => {
  try {
    const uploadedFiles = JSON.parse(localStorage.getItem(UPLOADED_FILES_KEY) || '[]');
    
    const files = uploadedFiles
      .filter(file => file.name.endsWith('.csv'))
      .map(file => {
        const fileInfo = extractFileInfo(file.name);
        return {
          filename: file.name,
          info: fileInfo,
          size: file.size,
          lastModified: file.lastModified
        };
      })
      .filter(file => file.info !== null); // Only include valid BMW files

    // Group files by market and month
    const groupedFiles = {};
    files.forEach(file => {
      const key = `${file.info.country}_${file.info.year}_${file.info.month.toString().padStart(2, '0')}`;
      if (!groupedFiles[key]) {
        groupedFiles[key] = {
          country: file.info.country,
          year: file.info.year,
          month: file.info.month,
          monthName: file.info.monthName,
          files: []
        };
      }
      groupedFiles[key].files.push(file);
    });

    // Extract unique markets and months
    const markets = [...new Set(files.map(f => f.info.country))].sort();
    const months = [...new Set(files.map(f => `${f.info.year}-${f.info.month.toString().padStart(2, '0')}`))].sort();
    const dimensions = [...new Set(files.map(f => f.info.dimension))].sort();

    return { 
      files, 
      groupedFiles: Object.values(groupedFiles),
      markets, 
      months,
      dimensions
    };
  } catch (error) {
    console.error('Error getting data inventory:', error);
    return { files: [], groupedFiles: [], markets: [], months: [], dimensions: [] };
  }
};

/**
 * Check if processed data exists and is up to date
 */
export const checkProcessedData = () => {
  try {
    const processedData = localStorage.getItem(PROCESSED_DATA_KEY);
    const metadata = localStorage.getItem(METADATA_KEY);
    
    if (!processedData || !metadata) {
      return { exists: false, metadata: null };
    }

    const metadataObj = JSON.parse(metadata);
    const inventory = getDataInventory();
    
    // Check if any files have been modified since last processing
    const lastProcessed = new Date(metadataObj.lastProcessed);
    const hasChanges = inventory.files.some(file => {
      return file.lastModified > lastProcessed.getTime();
    });

    return {
      exists: true,
      metadata: metadataObj,
      isUpToDate: !hasChanges,
      inventory
    };
  } catch (error) {
    console.error('Error checking processed data:', error);
    return { exists: false, metadata: null };
  }
};

/**
 * Process a single CSV file
 */
export const processCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const fileInfo = extractFileInfo(file.name);
          const dimension = fileInfo.dimension;
          const validation = validateCSVStructure(results.data, dimension);
          
          if (validation.isValid) {
            // Normalize column names in the data and filter out ignored columns
            const normalizedData = results.data.map(row => {
              const normalizedRow = {};
              Object.keys(row).forEach(key => {
                // Skip ignored columns
                if (ignoredColumns.includes(key)) {
                  return;
                }
                const normalizedKey = alternativeColumns[key] || key;
                normalizedRow[normalizedKey] = row[key];
              });
              
              // Add default values for missing optional columns
              // This part needs to be dynamic based on the dimension's expected columns
              const expectedColumns = expectedColumnsByDimension[dimension] || [];
              expectedColumns.forEach(optionalCol => {
                if (!normalizedRow.hasOwnProperty(optionalCol)) {
                  normalizedRow[optionalCol] = '0'; // Default value for missing optional columns
                }
              });
              
              return {
                ...normalizedRow,
                _source: file.name,
                _country: fileInfo?.country,
                _year: fileInfo?.year,
                _month: fileInfo?.month,
                _dimension: dimension
              };
            });
            
            resolve({
              filename: file.name,
              status: 'success',
              message: `Successfully processed ${normalizedData.length} rows`,
              data: normalizedData,
              fileInfo
            });
          } else {
            resolve({
              filename: file.name,
              status: 'error',
              message: `Invalid structure for ${dimension}: ${validation.missingColumns.join(', ')}`,
              data: null,
              fileInfo: null
            });
          }
        },
        error: (error) => {
          resolve({
            filename: file.name,
            status: 'error',
            message: `Error parsing file: ${error.message}`,
            data: null,
            fileInfo: null
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Combine data from multiple dimension files into a unified structure
 */
const combineDimensionData = (allData, country, year, month) => {
  const combinedData = [];
  const dimensionMap = {};

  // Group data by dimension
  allData.forEach(row => {
    const dimension = row._dimension;
    if (!dimensionMap[dimension]) {
      dimensionMap[dimension] = [];
    }
    dimensionMap[dimension].push(row);
  });

  // Process each dimension type
  Object.keys(dimensionMap).forEach(dimension => {
    const dimensionData = dimensionMap[dimension];
    
    dimensionData.forEach(row => {
      // Create a unified record structure
      const unifiedRecord = {
        Country: row.Country || country,
        'Campaign Type': row['Campaign Type'] || 'Not Mapped',
        'Channel Type': row['Channel Type'] || 'Not Mapped',
        'Channel Name': row['Channel Name'] || 'Not Mapped',
        'Phase': row['Phase'] || 'Not Mapped',
        'Model': row['Model'] || 'Not Mapped',
        'Media Cost': row['Media Cost'] || 0,
        'Impressions': row['Impressions'] || 0,
        'CPM': row['CPM'] || 0,
        'Clicks': row['Clicks'] || 0,
        'CTR': row['CTR'] || 0,
        'CPC': row['CPC'] || 0,
        'IV': row['IV'] || 0,
        'CP IV': row['CP IV'] || 0,
        'Entry Rate': row['Entry Rate'] || 0,
        'NVWR': row['NVWR'] || 0,
        'CP NVWR': row['CP NVWR'] || 0,
        'CVR': row['CVR'] || 0,
        'DCS (pre) Order': row['DCS (pre) Order'] || 0,
        'CP DCS (pre) Order': row['CP DCS (pre) Order'] || 0,
        'Meta_Leads': row['Meta_Leads'] || 0,
        'Cp lead Forms': row['Cp lead Forms'] || 0,
        // Metadata
        _source: row._source,
        _country: row._country,
        _dimension: row._dimension,
        _year: row._year,
        _month: row._month,
        // Add dimension-specific flags
        is_all_dimension: dimension === 'All',
        is_campaign_type_dimension: dimension === 'CampaignType',
        is_channel_type_dimension: dimension === 'ChannelType',
        is_channel_name_dimension: dimension === 'ChannelName',
        is_phase_dimension: dimension === 'Phase',
        is_model_dimension: dimension === 'Model'
      };

      combinedData.push(unifiedRecord);
    });
  });

  return combinedData;
};

/**
 * Process all CSV files from localStorage with new multi-file structure
 */
export const processAllCSVs = async () => {
  try {
    const inventory = getDataInventory();
    if (inventory.groupedFiles.length === 0) {
      throw new Error('No CSV files found in storage');
    }

    const allResults = [];
    let allCombinedData = [];
    let totalSuccessCount = 0;
    let totalErrorCount = 0;

    // Get uploaded files from localStorage
    const uploadedFiles = JSON.parse(localStorage.getItem(UPLOADED_FILES_KEY) || '[]');
    
    // Process each market/month group
    for (const marketMonthGroup of inventory.groupedFiles) {
      const { country, year, month, files } = marketMonthGroup;
      console.log(`🔄 Processing ${country} ${year}-${month.toString().padStart(2, '0')} with ${files.length} dimension files`);

      const results = [];
      let allData = [];
      let successCount = 0;
      let errorCount = 0;

      // Process each dimension file in the group
      for (const file of files) {
        try {
          const uploadedFile = uploadedFiles.find(f => f.name === file.filename);
          if (!uploadedFile) {
            results.push({
              filename: file.filename,
              status: 'error',
              message: 'File not found in storage',
              data: null,
              fileInfo: null
            });
            errorCount++;
            continue;
          }

          // Convert stored file data back to File object for Papa.parse
          const fileBlob = new Blob([uploadedFile.content], { type: 'text/csv' });
          const fileObj = new File([fileBlob], uploadedFile.name, {
            type: 'text/csv',
            lastModified: uploadedFile.lastModified
          });

          const result = await processCSVFile(fileObj);
          results.push(result);
          
          if (result.status === 'success') {
            allData = [...allData, ...result.data];
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          results.push({
            filename: file.filename,
            status: 'error',
            message: `Processing failed: ${error.message}`,
            data: null,
            fileInfo: null
          });
          errorCount++;
        }
      }

      // Combine and normalize the data from all dimensions
      const combinedData = combineDimensionData(allData, country, year, month);

      allResults.push({
        success: successCount > 0,
        data: combinedData,
        metadata: {
          country,
          year,
          month,
          totalFiles: files.length,
          successfulFiles: successCount,
          errorFiles: errorCount,
          totalRecords: combinedData.length,
          dimensions: [...new Set(files.map(f => f.info.dimension))],
          fileResults: results
        }
      });

      allCombinedData = [...allCombinedData, ...combinedData];
      totalSuccessCount += successCount;
      totalErrorCount += errorCount;
    }

    // Save combined data to localStorage
    if (allCombinedData.length > 0) {
      localStorage.setItem(PROCESSED_DATA_KEY, JSON.stringify(allCombinedData));
    }

    // Save metadata
    const metadata = {
      lastProcessed: new Date().toISOString(),
      totalMarketMonths: inventory.groupedFiles.length,
      totalFiles: inventory.files.length,
      successfulFiles: totalSuccessCount,
      errorFiles: totalErrorCount,
      totalRecords: allCombinedData.length,
      markets: inventory.markets,
      dimensions: inventory.dimensions,
      months: inventory.months,
      marketMonthResults: allResults.map(r => ({
        country: r.metadata.country,
        year: r.metadata.year,
        month: r.metadata.month,
        success: r.success,
        total_files: r.metadata.totalFiles,
        successful_files: r.metadata.successfulFiles,
        error_files: r.metadata.errorFiles,
        total_records: r.metadata.totalRecords,
        dimensions: r.metadata.dimensions
      }))
    };

    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));

    return {
      success: true,
      data: allCombinedData,
      metadata,
      results: allResults
    };
  } catch (error) {
    console.error('Error processing CSV files:', error);
    throw error;
  }
};

/**
 * Load processed data from localStorage
 */
export const loadProcessedData = () => {
  try {
    const processedData = localStorage.getItem(PROCESSED_DATA_KEY);
    const metadata = localStorage.getItem(METADATA_KEY);
    
    if (!processedData || !metadata) {
      return null;
    }

    const data = JSON.parse(processedData);
    const metadataObj = JSON.parse(metadata);
    
    return { data, metadata: metadataObj };
  } catch (error) {
    console.error('Error loading processed data:', error);
    return null;
  }
};

/**
 * Add a new CSV file to localStorage and regenerate processed data
 */
export const addCSVFile = async (file) => {
  try {
    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const content = new Uint8Array(arrayBuffer);
    
    // Save file to localStorage
    const uploadedFiles = JSON.parse(localStorage.getItem(UPLOADED_FILES_KEY) || '[]');
    const fileData = {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      content: Array.from(content) // Convert to regular array for JSON serialization
    };
    
    // Remove existing file with same name if it exists
    const existingIndex = uploadedFiles.findIndex(f => f.name === file.name);
    if (existingIndex !== -1) {
      uploadedFiles.splice(existingIndex, 1);
    }
    
    uploadedFiles.push(fileData);
    localStorage.setItem(UPLOADED_FILES_KEY, JSON.stringify(uploadedFiles));

    // Regenerate processed data
    return await processAllCSVs();
  } catch (error) {
    console.error('Error adding CSV file:', error);
    throw error;
  }
};

/**
 * Initialize data on app startup
 */
export const initializeData = async () => {
  try {
    // Check for existing processed data
    const processedCheck = checkProcessedData();
    
    if (processedCheck.exists && processedCheck.isUpToDate) {
      // Load existing processed data
      const loadedData = loadProcessedData();
      if (loadedData) {
        return {
          source: 'processed',
          data: loadedData.data,
          metadata: loadedData.metadata
        };
      }
    }

    // Process all CSV files
    const result = await processAllCSVs();
    return {
      source: 'csv',
      data: result.data,
      metadata: result.metadata
    };
  } catch (error) {
    console.error('Error initializing data:', error);
    throw error;
  }
};
