const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

/**
 * Main function to aggregate data for all country directories
 */
async function aggregateAllData() {
  console.log("Starting data aggregation process...");

  // Define base directories
  const dataDir = path.join(__dirname, "../data");
  const outputDir = path.join(__dirname, "../output");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all country files that match the pattern (2-character country code)
  const countryFiles = fs.readdirSync(dataDir).filter((file) => {
    // Match files with pattern XX-ALLMODELS-WOW-* where XX is the country code
    return file.match(/^([A-Z]{2})-ALLMODELS-WOW-.*\.csv$/i);
  });

  // Extract unique country codes from filenames
  const countryCodes = new Set();
  countryFiles.forEach((file) => {
    const match = file.match(/^([A-Z]{2})-/i);
    if (match && match[1]) {
      countryCodes.add(match[1].toUpperCase());
    }
  });

  console.log(
    `Found ${countryCodes.size} countries: ${Array.from(countryCodes).join(
      ", "
    )}`
  );

  // Process each country
  for (const countryCode of countryCodes) {
    await aggregateCountryData(countryCode);
  }

  console.log("All data aggregation completed successfully");
}

/**
 * Aggregates data for a specific country
 * @param {string} countryCode - Two-letter country code
 */
async function aggregateCountryData(countryCode) {
  console.log(`\nAggregating data for ${countryCode}...`);

  // Define directories and files
  const dataDir = path.join(__dirname, "../data");
  const outputDir = path.join(__dirname, "../output");
  const outputPath = path.join(
    outputDir,
    `${countryCode.toLowerCase()}-aggregated.json`
  );
  const processingIndexPath = path.join(
    outputDir,
    `${countryCode.toLowerCase()}-processing-index.json`
  );

  // Get list of processed files from index (if exists)
  let processedFiles = [];
  let aggregatedData = {
    months: {},
    models: {},
    yearToDateTotals: {
      mediaSpend: 0,
      impressions: 0,
      clicks: 0,
      iv: 0,
    },
    yearToDateAverages: {
      ctr: 0,
      cpm: 0,
      cpc: 0,
      cpIv: 0,
      cpNvwr: 0,
    },
    lastUpdated: new Date().toISOString(),
  };

  // Load existing aggregated data and processing index if they exist
  if (fs.existsSync(processingIndexPath)) {
    try {
      processedFiles = JSON.parse(fs.readFileSync(processingIndexPath, "utf8"));
      console.log(
        `Found processing index with ${processedFiles.length} previously processed files`
      );
    } catch (err) {
      console.warn(
        `Error reading processing index: ${err.message}. Creating a new one.`
      );
      processedFiles = [];
    }
  }

  if (fs.existsSync(outputPath)) {
    try {
      aggregatedData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      console.log(
        `Loaded existing aggregated data with ${
          Object.keys(aggregatedData.months).length
        } months`
      );
    } catch (err) {
      console.warn(
        `Error reading existing aggregated data: ${err.message}. Creating new aggregation.`
      );
    }
  }

  // Find all data files for this country
  const filePattern = new RegExp(
    `^${countryCode}-ALLMODELS-WOW-.*\\.csv$`,
    "i"
  );
  const allFiles = fs
    .readdirSync(dataDir)
    .filter((file) => file.match(filePattern))
    .map((file) => ({
      path: path.join(dataDir, file),
      filename: file,
    }));

  // Filter out already processed files
  const newFiles = allFiles.filter(
    (file) => !processedFiles.includes(file.filename)
  );

  if (newFiles.length === 0) {
    console.log(`No new files to process for ${countryCode}`);
    return;
  }

  console.log(
    `Found ${newFiles.length} new files to process: ${newFiles
      .map((f) => f.filename)
      .join(", ")}`
  );

  // Process each new file
  for (const file of newFiles) {
    console.log(`Processing ${file.filename}...`);
    try {
      await processDataFile(file.path, aggregatedData, countryCode);
      // Add to processed files list
      processedFiles.push(file.filename);
    } catch (err) {
      console.error(`Error processing ${file.filename}: ${err.message}`);
      continue;
    }
  }

  // Recalculate year-to-date metrics
  calculateYearToDateMetrics(aggregatedData);

  // Update timestamp
  aggregatedData.lastUpdated = new Date().toISOString();

  // Write updated aggregated data to JSON file
  fs.writeFileSync(outputPath, JSON.stringify(aggregatedData, null, 2));
  console.log(`Updated aggregated data written to ${outputPath}`);

  // Write updated processing index
  fs.writeFileSync(
    processingIndexPath,
    JSON.stringify(processedFiles, null, 2)
  );
  console.log(`Updated processing index written to ${processingIndexPath}`);

  // Create monthly summary CSV
  createMonthlySummaryCSV(aggregatedData, countryCode);

  return aggregatedData;
}

/**
 * Create a monthly summary CSV file for a specific country
 */
function createMonthlySummaryCSV(aggregatedData, countryCode) {
  const outputDir = path.join(__dirname, "../output");
  const monthlySummaryPath = path.join(
    outputDir,
    `${countryCode.toLowerCase()}-monthly-summary.csv`
  );

  // Define month order for sorting
  const monthOrder = {
    JAN: 1,
    FEB: 2,
    MAR: 3,
    APR: 4,
    MAY: 5,
    JUN: 6,
    JUL: 7,
    AUG: 8,
    SEP: 9,
    OCT: 10,
    NOV: 11,
    DEC: 12,
  };

  // Sort month keys chronologically by year, then by month
  const monthKeys = Object.keys(aggregatedData.months).sort((a, b) => {
    const [monthA, yearA] = a.split("-");
    const [monthB, yearB] = b.split("-");

    // Sort by year first
    if (yearA !== yearB) {
      return parseInt(yearA) - parseInt(yearB);
    }

    // Then sort by month
    return monthOrder[monthA] - monthOrder[monthB];
  });

  let csvContent =
    "Month,Media Spend,Impressions,Clicks,CTR,CPM,CPC,CP IV,Cp NVWR\n";

  for (const monthKey of monthKeys) {
    const monthData = aggregatedData.months[monthKey];
    csvContent += `${monthKey},${monthData.totalMediaSpend},${monthData.totalImpressions},${monthData.totalClicks},${monthData.avgCTR},${monthData.avgCPM},${monthData.avgCPC},${monthData.avgCPIV},${monthData.avgCpNVWR}\n`;
  }

  // Add YTD summary
  csvContent += `YTD ${new Date().getFullYear()},${
    aggregatedData.yearToDateTotals.mediaSpend
  },${aggregatedData.yearToDateTotals.impressions},${
    aggregatedData.yearToDateTotals.clicks
  },${aggregatedData.yearToDateAverages.ctr},${
    aggregatedData.yearToDateAverages.cpm
  },${aggregatedData.yearToDateAverages.cpc},${
    aggregatedData.yearToDateAverages.cpIv
  },${aggregatedData.yearToDateAverages.cpNvwr}\n`;

  fs.writeFileSync(monthlySummaryPath, csvContent);
  console.log(`Country monthly summary CSV written to ${monthlySummaryPath}`);
}

/**
 * Reads a CSV file and returns its contents as an array of objects
 */
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

/**
 * Process a single data file and add it to the aggregated data
 * @param {string} filePath - Path to the data file
 * @param {object} aggregatedData - The aggregated data object to update
 * @param {string} countryCode - The country code
 */
async function processDataFile(filePath, aggregatedData, countryCode) {
  // Extract month and year from filename, now with the new pattern
  // Example: FR-ALLMODELS-WOW-MAR-25.csv
  const fileNameMatch = path
    .basename(filePath)
    .match(/[A-Z]{2}-ALLMODELS-WOW-(\w+)-(\d+)\.csv/i);

  if (!fileNameMatch) {
    throw new Error("Invalid filename format");
  }

  const fileMonth = fileNameMatch[1].toUpperCase();
  const fileYear = `20${fileNameMatch[2]}`;

  // Map of week numbers to months (approximate mapping)
  const weekToMonth = {
    // January
    "01": "JAN",
    "02": "JAN",
    "03": "JAN",
    "04": "JAN",
    "05": "JAN",
    // February
    "06": "FEB",
    "07": "FEB",
    "08": "FEB",
    "09": "FEB",
    // March
    10: "MAR",
    11: "MAR",
    12: "MAR",
    13: "MAR",
    // April
    14: "APR",
    15: "APR",
    16: "APR",
    17: "APR",
    // May
    18: "MAY",
    19: "MAY",
    20: "MAY",
    21: "MAY",
    22: "MAY",
    // June
    23: "JUN",
    24: "JUN",
    25: "JUN",
    26: "JUN",
    // July
    27: "JUL",
    28: "JUL",
    29: "JUL",
    30: "JUL",
    // August
    31: "AUG",
    32: "AUG",
    33: "AUG",
    34: "AUG",
    35: "AUG",
    // September
    36: "SEP",
    37: "SEP",
    38: "SEP",
    39: "SEP",
    // October
    40: "OCT",
    41: "OCT",
    42: "OCT",
    43: "OCT",
    44: "OCT",
    // November
    45: "NOV",
    46: "NOV",
    47: "NOV",
    48: "NOV",
    // December
    49: "DEC",
    50: "DEC",
    51: "DEC",
    52: "DEC",
    // Week 53 is explicitly excluded
  };

  // Read the CSV file
  const results = await readCSV(filePath);

  // Group data by weeks
  const weeklyData = {};

  // Process data rows
  for (const row of results) {
    // Get the week number
    const weekOfYear = row["Week of Year"]?.toString().padStart(2, "0");
    if (!weekOfYear) continue;

    // Skip week 53 - it shouldn't exist in most years and causes issues
    if (weekOfYear === "53") {
      console.log(`Ignoring data from Week 53 as requested`);
      continue;
    }

    // Determine the month based on week number
    // Use the month from the file name if the week number is not in our mapping
    const month = weekToMonth[weekOfYear] || fileMonth;
    const monthKey = `${month}-${fileYear}`;

    // Initialize month data if it doesn't exist
    if (!aggregatedData.months[monthKey]) {
      aggregatedData.months[monthKey] = {
        totalMediaSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalIV: 0,
        weightedCTR: 0,
        weightedCPM: 0,
        weightedCPC: 0,
        weightedCPIV: 0,
        weightedCpNVWR: 0,
        validCTRCount: 0,
        validCPMCount: 0,
        validCPCCount: 0,
        validCPIVCount: 0,
        validCpNVWRCount: 0,
        models: {},
      };
    }

    // Parse values
    const model = row["Model"];
    const mediaSpend = parseFloat(row["Media Cost"] || row["Media Spend"]) || 0;
    const impressions = parseFloat(row["Impressions"]) || 0;
    const clicks = parseFloat(row["Clicks"]) || 0;
    const iv = parseFloat(row["IV"]) || 0;
    const ctr = parseFloat(row["CTR"]) || 0;
    const cpm = parseFloat(row["CPM"]) || 0;
    const cpc = parseFloat(row["CPC"]) || 0;
    const cpIv = parseFloat(row["CP IV"]) || 0;
    const cpNvwr = parseFloat(row["Cp NVWR"]) || 0;
    const nvwr = parseFloat(row["NVWR"]) || 0;

    if (!model) continue; // Skip rows without model info

    // Update monthly data
    updateMonthlyData(aggregatedData.months[monthKey], model, {
      mediaSpend,
      impressions,
      clicks,
      iv,
      ctr,
      cpm,
      cpc,
      cpIv,
      cpNvwr,
      nvwr,
    });

    // Update model data
    updateModelData(aggregatedData.models, model, monthKey, {
      mediaSpend,
      impressions,
      clicks,
      iv,
      ctr,
      cpm,
      cpc,
      cpIv,
      cpNvwr,
      nvwr,
    });
  }

  // Recalculate monthly averages for all affected months
  for (const monthKey of Object.keys(aggregatedData.months)) {
    calculateMonthlyAverages(aggregatedData.months[monthKey]);
  }
}

/**
 * Update the monthly data with new model information
 */
function updateMonthlyData(monthData, model, metrics) {
  // Add to month totals
  monthData.totalMediaSpend += metrics.mediaSpend;
  monthData.totalImpressions += metrics.impressions;
  monthData.totalClicks += metrics.clicks;
  monthData.totalIV += metrics.iv;

  // Add weighted metrics
  if (!isNaN(metrics.cpm) && metrics.cpm > 0) {
    monthData.weightedCPM += metrics.cpm * metrics.impressions;
    monthData.validCPMCount += metrics.impressions;
  }

  if (!isNaN(metrics.cpc) && metrics.cpc > 0) {
    monthData.weightedCPC += metrics.cpc * metrics.clicks;
    monthData.validCPCCount += metrics.clicks;
  }

  if (!isNaN(metrics.cpIv) && metrics.cpIv > 0) {
    monthData.weightedCPIV += metrics.cpIv * metrics.iv;
    monthData.validCPIVCount += metrics.iv;
  }

  if (!isNaN(metrics.cpNvwr) && metrics.cpNvwr > 0 && metrics.nvwr > 0) {
    monthData.weightedCpNVWR += metrics.cpNvwr * metrics.nvwr;
    monthData.validCpNVWRCount += metrics.nvwr;
  }

  // Track model data per month
  if (!monthData.models[model]) {
    monthData.models[model] = {
      mediaSpend: 0,
      impressions: 0,
      clicks: 0,
      iv: 0,
    };
  }

  const modelData = monthData.models[model];
  modelData.mediaSpend += metrics.mediaSpend;
  modelData.impressions += metrics.impressions;
  modelData.clicks += metrics.clicks;
  modelData.iv += metrics.iv;
}

/**
 * Update the model data with new monthly information
 */
function updateModelData(modelsData, model, monthKey, metrics) {
  if (!modelsData[model]) {
    modelsData[model] = {
      totalMediaSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalIV: 0,
      monthlyData: {},
    };
  }

  const globalModelData = modelsData[model];
  globalModelData.totalMediaSpend += metrics.mediaSpend;
  globalModelData.totalImpressions += metrics.impressions;
  globalModelData.totalClicks += metrics.clicks;
  globalModelData.totalIV += metrics.iv;

  if (!globalModelData.monthlyData[monthKey]) {
    globalModelData.monthlyData[monthKey] = {
      mediaSpend: metrics.mediaSpend,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      iv: metrics.iv,
      ctr: metrics.ctr,
      cpm: metrics.cpm,
      cpc: metrics.cpc,
      cpIv: metrics.cpIv,
      cpNvwr: metrics.cpNvwr,
    };
  } else {
    globalModelData.monthlyData[monthKey].mediaSpend += metrics.mediaSpend;
    globalModelData.monthlyData[monthKey].impressions += metrics.impressions;
    globalModelData.monthlyData[monthKey].clicks += metrics.clicks;
    globalModelData.monthlyData[monthKey].iv += metrics.iv;

    // Recalculate derived metrics if needed
    if (globalModelData.monthlyData[monthKey].impressions > 0) {
      globalModelData.monthlyData[monthKey].ctr =
        globalModelData.monthlyData[monthKey].clicks /
        globalModelData.monthlyData[monthKey].impressions;
    }
  }
}

/**
 * Calculate monthly averages
 */
function calculateMonthlyAverages(monthData) {
  monthData.avgCTR =
    monthData.totalImpressions > 0
      ? monthData.totalClicks / monthData.totalImpressions
      : 0;
  monthData.avgCPM =
    monthData.validCPMCount > 0
      ? monthData.weightedCPM / monthData.validCPMCount
      : 0;
  monthData.avgCPC =
    monthData.validCPCCount > 0
      ? monthData.weightedCPC / monthData.validCPCCount
      : 0;
  monthData.avgCPIV =
    monthData.validCPIVCount > 0
      ? monthData.weightedCPIV / monthData.validCPIVCount
      : 0;
  monthData.avgCpNVWR =
    monthData.validCpNVWRCount > 0
      ? monthData.weightedCpNVWR / monthData.validCpNVWRCount
      : 0;
}

/**
 * Calculate year-to-date metrics
 */
function calculateYearToDateMetrics(aggregatedData) {
  // Reset year-to-date totals
  aggregatedData.yearToDateTotals = {
    mediaSpend: 0,
    impressions: 0,
    clicks: 0,
    iv: 0,
  };

  let totalWeightedCPM = 0;
  let totalWeightedCPC = 0;
  let totalWeightedCPIV = 0;
  let totalWeightedCpNVWR = 0;
  let totalValidCPMCount = 0;
  let totalValidCPCCount = 0;
  let totalValidCPIVCount = 0;
  let totalValidCpNVWRCount = 0;

  // Sum up all monthly data
  const monthKeys = Object.keys(aggregatedData.months || {}).sort();
  for (const monthKey of monthKeys) {
    const monthData = aggregatedData.months[monthKey];

    // Add to totals
    aggregatedData.yearToDateTotals.mediaSpend += monthData.totalMediaSpend;
    aggregatedData.yearToDateTotals.impressions += monthData.totalImpressions;
    aggregatedData.yearToDateTotals.clicks += monthData.totalClicks;
    aggregatedData.yearToDateTotals.iv += monthData.totalIV;

    // Add to weighted metrics
    totalWeightedCPM += monthData.weightedCPM;
    totalWeightedCPC += monthData.weightedCPC;
    totalWeightedCPIV += monthData.weightedCPIV;
    totalWeightedCpNVWR += monthData.weightedCpNVWR;
    totalValidCPMCount += monthData.validCPMCount;
    totalValidCPCCount += monthData.validCPCCount;
    totalValidCPIVCount += monthData.validCPIVCount;
    totalValidCpNVWRCount += monthData.validCpNVWRCount;
  }

  // Calculate year-to-date averages
  aggregatedData.yearToDateAverages = {
    ctr:
      aggregatedData.yearToDateTotals.impressions > 0
        ? aggregatedData.yearToDateTotals.clicks /
          aggregatedData.yearToDateTotals.impressions
        : 0,
    cpm: totalValidCPMCount > 0 ? totalWeightedCPM / totalValidCPMCount : 0,
    cpc: totalValidCPCCount > 0 ? totalWeightedCPC / totalValidCPCCount : 0,
    cpIv: totalValidCPIVCount > 0 ? totalWeightedCPIV / totalValidCPIVCount : 0,
    cpNvwr:
      totalValidCpNVWRCount > 0
        ? totalWeightedCpNVWR / totalValidCpNVWRCount
        : 0,
  };

  // Calculate month-over-month changes if we have more than one month
  if (monthKeys.length > 1) {
    const latestMonth = monthKeys[monthKeys.length - 1];
    const previousMonth = monthKeys[monthKeys.length - 2];

    aggregatedData.monthlyComparison = {
      mediaSpendChange: calculatePercentageChange(
        aggregatedData.months[previousMonth].totalMediaSpend,
        aggregatedData.months[latestMonth].totalMediaSpend
      ),
      impressionsChange: calculatePercentageChange(
        aggregatedData.months[previousMonth].totalImpressions,
        aggregatedData.months[latestMonth].totalImpressions
      ),
      clicksChange: calculatePercentageChange(
        aggregatedData.months[previousMonth].totalClicks,
        aggregatedData.months[latestMonth].totalClicks
      ),
      ctrChange: calculatePercentageChange(
        aggregatedData.months[previousMonth].avgCTR,
        aggregatedData.months[latestMonth].avgCTR
      ),
      cpmChange: calculatePercentageChange(
        aggregatedData.months[previousMonth].avgCPM,
        aggregatedData.months[latestMonth].avgCPM
      ),
      cpcChange: calculatePercentageChange(
        aggregatedData.months[previousMonth].avgCPC,
        aggregatedData.months[latestMonth].avgCPC
      ),
    };
  }
}

/**
 * Calculates the percentage change between two values
 */
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Run the script if called directly
if (require.main === module) {
  aggregateAllData().catch((err) => {
    console.error("Error aggregating data:", err);
    process.exit(1);
  });
}

// Export for use in other modules
module.exports = {
  aggregateAllData,
  aggregateCountryData,
};
