const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Report types and their identifiers
const REPORT_TYPES = {
    CAMPAIGN_SPECIFIC: 'campaign_specific',
    OVERALL_TRAFFIC: 'overall_traffic',
    MODEL_BREAKDOWN: 'model_breakdown',
    CHANNEL_BREAKDOWN: 'channel_breakdown'
};

function identifyReportType(filename) {
    // Example: F-900-UK-Q1.csv would be campaign_specific
    // You can add more sophisticated detection logic based on your naming conventions
    if (filename.includes('overview') || filename.includes('traffic')) {
        return REPORT_TYPES.OVERALL_TRAFFIC;
    } else if (filename.includes('model')) {
        return REPORT_TYPES.MODEL_BREAKDOWN;
    } else if (filename.includes('channel')) {
        return REPORT_TYPES.CHANNEL_BREAKDOWN;
    }
    return REPORT_TYPES.CAMPAIGN_SPECIFIC;
}

function extractMetadata(filename) {
    // Extract useful information from filename
    const parts = filename.split('-');
    return {
        model: parts[0] || 'Unknown',
        market: parts[2]?.split('.')[0] || 'Unknown',
        quarter: parts[3]?.split('.')[0] || 'Unknown',
        reportType: identifyReportType(filename)
    };
}

/**
 * Asynchronously parse all CSV files in a directory and return an array of:
 * [{ file: string, data: Array<object> }, ...]
 *
 * @param {string} dirPath - Directory containing CSV files
 * @returns {Promise<Array>} 
 */
async function parseCsvFiles(dirPath) {
  const files = fs.readdirSync(dirPath);
  const results = [];

  // We'll parse each file in series or using Promise.all
  for (const file of files) {
    if (file.toLowerCase().endsWith('.csv')) {
      const filePath = path.join(dirPath, file);

      // parse one file
      const parsedRows = await new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => rows.push(data))
          .on('end', () => resolve(rows))
          .on('error', (err) => reject(err));
      });

      results.push({ file, data: parsedRows });
    }
  }

  return results;
}

async function parseMonthlyData(monthDir) {
    const results = {
        metadata: {
            totalFiles: 0,
            processedFiles: 0,
            markets: new Set(),
            reportTypes: {},
            period: {
                month: path.basename(monthDir),
                startDate: null,
                endDate: null
            }
        },
        data: {
            overall: {},      // Overall traffic data
            byMarket: {},     // Market-specific data
            byModel: {},      // Model-specific breakdowns
            byChannel: {},    // Channel-specific breakdowns
            campaigns: {}     // Campaign-specific data
        },
        insights: {
            topPerformers: {},
            trends: {},
            anomalies: [],
            recommendations: []
        }
    };

    // Get all CSV files in the directory
    const files = fs.readdirSync(monthDir).filter(file => file.endsWith('.csv'));
    results.metadata.totalFiles = files.length;

    // Process each file
    for (const file of files) {
        const metadata = extractMetadata(file);
        results.metadata.markets.add(metadata.market);
        
        // Initialize report type counter
        results.metadata.reportTypes[metadata.reportType] = 
            (results.metadata.reportTypes[metadata.reportType] || 0) + 1;

        const data = await new Promise((resolve, reject) => {
            const fileData = [];
            fs.createReadStream(path.join(monthDir, file))
                .pipe(csv({
                    mapValues: ({ value }) => {
                        const num = Number(value);
                        return isNaN(num) ? value : num;
                    }
                }))
                .on('data', (row) => fileData.push(row))
                .on('end', () => {
                    results.metadata.processedFiles++;
                    resolve(fileData);
                })
                .on('error', reject);
        });

        // Organize data based on report type
        switch (metadata.reportType) {
            case REPORT_TYPES.OVERALL_TRAFFIC:
                results.data.overall[metadata.market] = data;
                break;
            case REPORT_TYPES.MODEL_BREAKDOWN:
                if (!results.data.byModel[metadata.market]) {
                    results.data.byModel[metadata.market] = {};
                }
                results.data.byModel[metadata.market][metadata.model] = data;
                break;
            case REPORT_TYPES.CHANNEL_BREAKDOWN:
                results.data.byChannel[metadata.market] = data;
                break;
            case REPORT_TYPES.CAMPAIGN_SPECIFIC:
                // Store in campaigns section
                if (!results.data.campaigns[metadata.market]) {
                    results.data.campaigns[metadata.market] = {};
                }
                results.data.campaigns[metadata.market][metadata.model] = data;
                
                // Also store in overall section since these are our main traffic metrics
                results.data.overall[metadata.market] = data;
                break;
        }

        // Update period information from the data
        if (data.length > 0) {
            const dates = data.map(row => new Date(row['Year'] || row['Date'] || row['Week of Year']));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            
            if (!results.metadata.period.startDate || minDate < results.metadata.period.startDate) {
                results.metadata.period.startDate = minDate;
            }
            if (!results.metadata.period.endDate || maxDate > results.metadata.period.endDate) {
                results.metadata.period.endDate = maxDate;
            }
        }
    }

    return results;
}

// If we run this file directly: node parseData.js 2025-03
if (require.main === module) {
  const monthFolder = process.argv[2] || '2025-03';
  const dirPath = path.join(__dirname, 'monthly_exports', monthFolder);
  
  parseCsvFiles(dirPath)
    .then(parsedData => {
      console.log(JSON.stringify(parsedData, null, 2));
    })
    .catch(err => {
      console.error(err);
    });
}

module.exports = { 
    parseMonthlyData,
    REPORT_TYPES
};
