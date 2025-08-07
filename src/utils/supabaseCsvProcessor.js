import Papa from 'papaparse';
import { supabase, STORAGE_BUCKET, TABLES } from './supabase.js';
import { processAllMonthsCompliance } from './autoComplianceProcessor.js';
import { processAllMonthsKPI } from './autoKPIProcessor.js';
import {
  saveMarketMonthTotals,
  saveMetricsBreakdown,
  saveComplianceBreakdownHistory
} from './metricsBreakdown.js';

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

// Columns that should be ignored
const ignoredColumns = [
  'Line Item (Free Field)',
  'Campaign Detail (Free Field)'
];

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
    // Treat 'Country' column as optional since country code is taken from filename
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
 * Upload file to Supabase Storage
 */
export const uploadFileToSupabase = async (file) => {
  try {
    console.log(`📤 Uploading file: ${file.name}`);
    
    // Extract file info
    const fileInfo = extractFileInfo(file.name);
    if (!fileInfo) {
      throw new Error(`Invalid filename format: ${file.name}`);
    }

    // Check if file already exists in database
    const { data: existingFile } = await supabase
      .from(TABLES.FILES)
      .select('id, filename')
      .eq('filename', file.name)
      .single();

    if (existingFile) {
      console.log(`⚠️ File ${file.name} already exists in database, skipping upload`);
      return {
        success: true,
        message: 'File already exists',
        fileRecord: existingFile
      };
    }

    // Create file path for storage
    const filePath = `${fileInfo.country}/${fileInfo.dimension}/${fileInfo.year}/${file.name}`;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (uploadError) {
      if (uploadError.message.includes('already exists')) {
        console.log(`⚠️ File ${file.name} already exists in storage, skipping upload`);
        // Get the existing file URL
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);
        
        const fileRecord = {
          filename: file.name,
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_size: file.size,
          country: fileInfo.country,
          dimension: fileInfo.dimension,
          year: fileInfo.year,
          month: fileInfo.month,
          month_name: fileInfo.monthName,
          status: 'uploaded'
        };

        // Insert into database
        const { data: dbData, error: dbError } = await supabase
          .from(TABLES.FILES)
          .insert(fileRecord)
          .select()
          .single();

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }

        return {
          success: true,
          message: 'File already existed in storage, added to database',
          fileRecord: dbData
        };
      }
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    // Create file record for database
    const fileRecord = {
      filename: file.name,
      file_path: filePath,
      file_url: urlData.publicUrl,
      file_size: file.size,
      country: fileInfo.country,
      dimension: fileInfo.dimension,
      year: fileInfo.year,
      month: fileInfo.month,
      month_name: fileInfo.monthName,
      status: 'uploaded'
    };

    // Insert file record into database
    const { data: dbData, error: dbError } = await supabase
      .from(TABLES.FILES)
      .insert(fileRecord)
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log(`✅ File uploaded successfully: ${file.name}`);
    return {
      success: true,
      message: 'File uploaded successfully',
      fileRecord: dbData
    };

  } catch (error) {
    console.error('Error uploading file to Supabase:', error);
    throw error;
  }
};

/**
 * Process CSV file from Supabase Storage
 */
export const processCSVFileFromSupabase = async (fileRecord) => {
  try {
    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(fileRecord.file_path);

    if (downloadError) {
      throw downloadError;
    }

    // Convert to text
    const fileText = await fileData.text();

    // Parse CSV
    return new Promise((resolve, reject) => {
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            // Validate structure
            const validation = validateCSVStructure(results.data, fileRecord.dimension);
            console.log(`🔍 Validating ${fileRecord.filename}:`, {
              originalHeaders: validation.originalHeaders,
              normalizedHeaders: validation.headers,
              missingColumns: validation.missingColumns,
              isValid: validation.isValid,
              dimension: validation.dimension
            });
            
            if (!validation.isValid) {
              resolve({
                filename: fileRecord.filename,
                status: 'error',
                message: `Invalid CSV structure for dimension ${validation.dimension}. Missing columns: ${validation.missingColumns.join(', ')}`,
                data: null,
                fileInfo: null
              });
              return;
            }

            // Process data with normalized column names
            const processedData = results.data.map(row => {
              const normalizedRow = {};
              
              // Normalize column names
              Object.keys(row).forEach(key => {
                const normalizedKey = alternativeColumns[key] || key;
                normalizedRow[normalizedKey] = row[key];
              });
              
              // Add file metadata
              return {
                ...normalizedRow,
                file_source: fileRecord.filename,
                country: fileRecord.country,
                dimension: fileRecord.dimension,
                year: fileRecord.year,
                month: fileRecord.month
              };
            });

            resolve({
              filename: fileRecord.filename,
              status: 'success',
              message: `Successfully processed ${processedData.length} records for dimension ${fileRecord.dimension}`,
              data: processedData,
              fileInfo: {
                country: fileRecord.country,
                dimension: fileRecord.dimension,
                year: fileRecord.year,
                month: fileRecord.month,
                monthName: fileRecord.month_name,
                recordCount: processedData.length
              }
            });
          } catch (error) {
            resolve({
              filename: fileRecord.filename,
              status: 'error',
              message: `Processing failed: ${error.message}`,
              data: null,
              fileInfo: null
            });
          }
        },
        error: (error) => {
          resolve({
            filename: fileRecord.filename,
            status: 'error',
            message: `CSV parsing failed: ${error.message}`,
            data: null,
            fileInfo: null
          });
        }
      });
    });
  } catch (error) {
    console.error('Error processing CSV file from Supabase:', error);
    throw error;
  }
};

/**
 * Get all uploaded files from Supabase
 */
export const getUploadedFiles = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.FILES)
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching uploaded files:', error);
    throw error;
  }
};

/**
 * Get all uploaded files from Supabase grouped by market and month
 */
export const getUploadedFilesGrouped = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.FILES)
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Group files by market and month
    const groupedFiles = {};
    (data || []).forEach(file => {
      const key = `${file.country}_${file.year}_${file.month.toString().padStart(2, '0')}`;
      if (!groupedFiles[key]) {
        groupedFiles[key] = {
          country: file.country,
          year: file.year,
          month: file.month,
          monthName: file.month_name,
          files: []
        };
      }
      groupedFiles[key].files.push(file);
    });

    return Object.values(groupedFiles);
  } catch (error) {
    console.error('Error fetching uploaded files:', error);
    throw error;
  }
};

/**
 * Process all dimension files for a specific market and month
 */
export const processMarketMonthFiles = async (marketMonthGroup) => {
  try {
    const { country, year, month, files } = marketMonthGroup;
    console.log(`🔄 Processing ${country} ${year}-${month.toString().padStart(2, '0')} with ${files.length} dimension files`);

    const results = [];
    let allData = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each dimension file
    for (const fileRecord of files) {
      try {
        const result = await processCSVFileFromSupabase(fileRecord);
        results.push(result);
        
        if (result.status === 'success') {
          allData = [...allData, ...result.data];
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        results.push({
          filename: fileRecord.filename,
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

    return {
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
        dimensions: [...new Set(files.map(f => f.dimension))],
        fileResults: results
      }
    };
  } catch (error) {
    console.error('Error processing market month files:', error);
    throw error;
  }
};

/**
 * Combine data from multiple dimension files into a unified structure
 */
const combineDimensionData = (allData, country, year, month) => {
  const combinedData = [];
  const dimensionMap = {};

  // Group data by dimension
  allData.forEach(row => {
    const dimension = row.dimension;
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
        Country: country,
        'Sub Country': row.Country || null,
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
        file_source: row.file_source,
        country: row.country,
        dimension: row.dimension,
        year: row.year,
        month: row.month,
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
 * Process all CSV files from Supabase with new multi-file structure
 */
export const processAllCSVsFromSupabase = async () => {
  try {
    const groupedFiles = await getUploadedFilesGrouped();
    
    if (groupedFiles.length === 0) {
      throw new Error('No CSV files found in Supabase storage');
    }

    const allResults = [];
    let allCombinedData = [];
    let totalSuccessCount = 0;
    let totalErrorCount = 0;

    // Process each market/month group
    for (const marketMonthGroup of groupedFiles) {
      try {
        const result = await processMarketMonthFiles(marketMonthGroup);
        allResults.push(result);
        
        if (result.success) {
          allCombinedData = [...allCombinedData, ...result.data];
          totalSuccessCount += result.metadata.successfulFiles;
          totalErrorCount += result.metadata.errorFiles;
        }
      } catch (error) {
        console.error(`Error processing ${marketMonthGroup.country} ${marketMonthGroup.year}-${marketMonthGroup.month}:`, error);
        totalErrorCount++;
      }
    }

    // Save processed data to Supabase
    if (allCombinedData.length > 0) {
      const { error: dataError } = await supabase
        .from(TABLES.PROCESSED_DATA)
        .upsert({
          id: 'latest',
          data: allCombinedData,
          total_records: allCombinedData.length,
          processed_at: new Date().toISOString()
        });

      if (dataError) {
        console.error('Error saving processed data:', dataError);
      }
    }

    // Save metadata to Supabase
    const metadata = {
      last_processed: new Date().toISOString(),
      total_market_months: groupedFiles.length,
      total_files: groupedFiles.reduce((sum, group) => sum + group.files.length, 0),
      successful_files: totalSuccessCount,
      error_files: totalErrorCount,
      total_records: allCombinedData.length,
      markets: [...new Set(allCombinedData.map(row => row.country))],
      dimensions: [...new Set(allCombinedData.map(row => row.dimension))],
      months: [...new Set(allCombinedData.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))],
      market_month_results: allResults.map(r => ({
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

    const { error: metadataError } = await supabase
      .from(TABLES.METADATA)
      .upsert({
        id: 'latest',
        metadata: metadata,
        updated_at: new Date().toISOString()
      });

    if (metadataError) {
      console.error('Error saving metadata:', metadataError);
    }

    // Save dimension coverage history for all markets and dimensions
    try {
      console.log('🔄 Saving dimension coverage history...');
      const { calculateComprehensiveDataQuality } = await import('./dataQualityScorer.js');
      const { saveDimensionCoverageHistory } = await import('./dimensionCoverageHistory.js');
      
      // Get all unique markets and months from the processed data
      const markets = [...new Set(allCombinedData.map(row => row.country))];
      const months = [...new Set(allCombinedData.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))];
      
      for (const market of markets) {
        for (const month of months) {
          try {
            // Calculate quality data for this market and month
            const qualityData = calculateComprehensiveDataQuality(allCombinedData, market, month);
            
            if (qualityData && qualityData.marketAnalysis && qualityData.marketAnalysis[market]) {
              const marketAnalysis = qualityData.marketAnalysis[market];
              
              // Save dimension coverage history for each dimension
              const dimensions = ['Channel Name', 'Channel Type', 'Campaign Type', 'Model', 'Phase'];
              for (const dimension of dimensions) {
                if (marketAnalysis.dimensionScores && marketAnalysis.dimensionScores[dimension]) {
                  const dimensionScore = marketAnalysis.dimensionScores[dimension];
                  
                  // Extract gap data for each metric
                  const gaps = dimensionScore.gaps || {};
                  const [year, monthNum] = month.split('-');
                  
                  const historyRecord = {
                    market_code: market,
                    year: parseInt(year),
                    month: parseInt(monthNum),
                    month_name: new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('en-US', { month: 'long' }),
                    dimension: dimension,
                    overall_coverage: dimensionScore.coverage || 0,
                    media_cost_gap: gaps['Media Cost']?.gap || 0,
                    impressions_gap: gaps['Impressions']?.gap || 0,
                    clicks_gap: gaps['Clicks']?.gap || 0,
                    iv_gap: gaps['IV']?.gap || 0,
                    nvwr_gap: gaps['NVWR']?.gap || 0,
                    total_missing_media_cost: gaps['Media Cost']?.missingValue || 0,
                    total_missing_impressions: gaps['Impressions']?.missingValue || 0,
                    total_missing_clicks: gaps['Clicks']?.missingValue || 0,
                    total_missing_iv: gaps['IV']?.missingValue || 0,
                    total_missing_nvwr: gaps['NVWR']?.missingValue || 0,
                    all_media_cost: gaps['Media Cost']?.allValue || 0,
                    all_impressions: gaps['Impressions']?.allValue || 0,
                    all_clicks: gaps['Clicks']?.allValue || 0,
                    all_iv: gaps['IV']?.allValue || 0,
                    all_nvwr: gaps['NVWR']?.allValue || 0,
                    dimension_media_cost: gaps['Media Cost']?.dimensionValue || 0,
                    dimension_impressions: gaps['Impressions']?.dimensionValue || 0,
                    dimension_clicks: gaps['Clicks']?.dimensionValue || 0,
                    dimension_iv: gaps['IV']?.dimensionValue || 0,
                    dimension_nvwr: gaps['NVWR']?.dimensionValue || 0
                  };
                  
                  await saveDimensionCoverageHistory(historyRecord, supabase);
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ Error saving dimension coverage history for ${market} ${month}:`, error);
            // Don't fail the entire process if dimension coverage saving fails
          }
        }
      }
      console.log('✅ Dimension coverage history saved successfully');
    } catch (error) {
      console.warn('⚠️ Dimension coverage history saving failed:', error);
      // Don't fail the entire process if dimension coverage saving fails
    }

    // Save market totals, metrics breakdown, and compliance breakdown
    try {
      console.log('🔄 Saving market totals and metrics breakdown data...');
      await saveMarketMonthTotals(allCombinedData);
      await saveMetricsBreakdown(allCombinedData);
      await saveComplianceBreakdownHistory(allCombinedData);
      console.log('✅ Market totals and breakdown data saved successfully');
    } catch (error) {
      console.warn('⚠️ Saving market totals or breakdown data failed:', error);
      // Continue processing even if saving fails
    }

    // Automatically process compliance for all months to enable MoM calculations
    try {
      console.log('🔄 Auto-processing compliance for MoM calculations...');
      const complianceResult = await processAllMonthsCompliance();
      if (complianceResult.success) {
        console.log('✅ Auto-compliance processing completed');
      } else {
        console.warn('⚠️ Auto-compliance processing had issues:', complianceResult.error);
      }
    } catch (error) {
      console.warn('⚠️ Auto-compliance processing failed:', error);
      // Don't fail the entire process if compliance processing fails
    }

    // Automatically process KPI metrics for all months to enable MoM calculations
    try {
      console.log('🔄 Auto-processing KPI metrics for MoM calculations...');
      const kpiResult = await processAllMonthsKPI();
      if (kpiResult.success) {
        console.log('✅ Auto-KPI processing completed');
      } else {
        console.warn('⚠️ Auto-KPI processing had issues:', kpiResult.error);
      }
    } catch (error) {
      console.warn('⚠️ Auto-KPI processing failed:', error);
      // Don't fail the entire process if KPI processing fails
    }

    return {
      success: true,
      data: allCombinedData,
      metadata,
      results: allResults
    };
  } catch (error) {
    console.error('Error processing CSV files from Supabase:', error);
    throw error;
  }
};

/**
 * Get processed data from Supabase
 */
export const getProcessedData = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROCESSED_DATA)
      .select('*')
      .eq('id', 'latest')
      .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

    if (error) {
      console.error('Error fetching processed data:', error);
      return null;
    }

    if (!data) {
      console.log('ℹ️ No processed data found yet - this is normal for a new setup');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching processed data:', error);
    return null;
  }
};

/**
 * Get metadata from Supabase
 */
export const getMetadata = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.METADATA)
      .select('*')
      .eq('id', 'latest')
      .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors

    if (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }

    if (!data) {
      console.log('ℹ️ No metadata found yet - this is normal for a new setup');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
};

/**
 * Delete file from Supabase
 */
export const deleteFileFromSupabase = async (filename) => {
  try {
    // Get file record
    const { data: fileRecord, error: fetchError } = await supabase
      .from(TABLES.FILES)
      .select('*')
      .eq('filename', filename)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileRecord.file_path]);

    if (storageError) {
      throw storageError;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from(TABLES.FILES)
      .delete()
      .eq('filename', filename);

    if (dbError) {
      throw dbError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting file from Supabase:', error);
    throw error;
  }
};

/**
 * Clear all data from Supabase
 */
export const clearAllDataFromSupabase = async () => {
  try {
    // Delete all files from storage
    const { data: files } = await supabase
      .from(TABLES.FILES)
      .select('file_path');

    if (files && files.length > 0) {
      const filePaths = files.map(f => f.file_path);
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(filePaths);
    }

    // Clear database tables
    await supabase.from(TABLES.FILES).delete().neq('id', 0);
    await supabase.from(TABLES.PROCESSED_DATA).delete().neq('id', 0);
    await supabase.from(TABLES.METADATA).delete().neq('id', 0);
    await supabase.from(TABLES.COMPLIANCE_HISTORY).delete().neq('id', 0);
    await supabase.from(TABLES.KPI_HISTORY).delete().neq('id', 0);

    return { success: true };
  } catch (error) {
    console.error('Error clearing all data from Supabase:', error);
    throw error;
  }
}; 