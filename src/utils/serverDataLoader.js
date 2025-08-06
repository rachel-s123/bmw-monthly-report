/**
 * Load existing CSV files from the server's data/uploads folder
 * This allows the app to work with files that are already on the server
 */
export const loadServerFiles = async () => {
  try {
    // List of known BMW files in the data/uploads folder
    const knownFiles = [
      'BMW_BE_2025_06.csv',  // June 2025 BE data for MoM calculations
      'BMW_BE_2025_07.csv',
      'BMW_CH_2025_07.csv', 
      'BMW_CS_2025_07.csv',
      'BMW_ES_2025_07.csv',
      'BMW_FR_2025_07.csv',
      'BMW_IT_2025_07.csv',
      'BMW_NE_2025_07.csv',
      'BMW_NL_2025_07.csv',
      'BMW_PT_2025_07.csv',
      'BMW_UK_2025_07.csv'
    ];

    const loadedFiles = [];
    let allData = [];

    for (const filename of knownFiles) {
      try {
        // Try to fetch the file from the server
        const response = await fetch(`/data/uploads/${filename}`);
        
        if (response.ok) {
          const csvContent = await response.text();
          
          // Convert to File object for processing
          const file = new File([csvContent], filename, {
            type: 'text/csv',
            lastModified: Date.now()
          });

          // Process the file using existing CSV processor
          const { processCSVFile } = await import('./csvProcessor.js');
          const result = await processCSVFile(file);
          
          if (result.status === 'success') {
            loadedFiles.push({
              name: filename,
              status: 'success',
              message: `Loaded ${result.data.length} records`,
              data: result.data
            });
            allData = [...allData, ...result.data];
          } else {
            loadedFiles.push({
              name: filename,
              status: 'error',
              message: result.message,
              data: null
            });
          }
        } else {
          // File not found on server, skip it
          console.log(`File not found on server: ${filename}`);
        }
      } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        loadedFiles.push({
          name: filename,
          status: 'error',
          message: `Failed to load: ${error.message}`,
          data: null
        });
      }
    }

    if (allData.length > 0) {
      // Save to localStorage for future use
      localStorage.setItem('bmw_processed_data', JSON.stringify(allData));
      
      // Extract unique markets and months from the data
      const markets = [...new Set(allData.map(item => item.Country))].filter(Boolean).sort();
      const months = [...new Set(allData.map(item => `${item._year || '2025'}-${(item._month || '07').toString().padStart(2, '0')}`))].sort();
      
      const metadata = {
        lastProcessed: new Date().toISOString(),
        totalFiles: loadedFiles.length,
        successfulFiles: loadedFiles.filter(f => f.status === 'success').length,
        errorFiles: loadedFiles.filter(f => f.status === 'error').length,
        totalRecords: allData.length,
        source: 'server',
        markets,
        months,
        fileResults: loadedFiles.map(f => ({
          filename: f.name,
          status: f.status,
          message: f.message
        }))
      };
      
      localStorage.setItem('bmw_metadata', JSON.stringify(metadata));

      return {
        success: true,
        data: allData,
        metadata,
        loadedFiles
      };
    } else {
      throw new Error('No CSV files could be loaded from the server');
    }
  } catch (error) {
    console.error('Error loading server files:', error);
    throw error;
  }
};

/**
 * Check if server files are available
 */
export const checkServerFiles = async () => {
  try {
    const response = await fetch('/data/uploads/BMW_BE_2025_07.csv');
    return response.ok;
  } catch (error) {
    return false;
  }
}; 