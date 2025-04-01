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
  const outputDir = path.join(__dirname, "../data/aggregated");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find all country directories (2-character named directories)
  const countryDirs = fs
    .readdirSync(dataDir)
    .filter(
      (dir) =>
        dir.length === 2 && fs.statSync(path.join(dataDir, dir)).isDirectory()
    );

  console.log(
    `Found ${countryDirs.length} country directories: ${countryDirs.join(", ")}`
  );

  // Process each country directory
  for (const countryCode of countryDirs) {
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
  const countryDir = path.join(dataDir, countryCode);
  const outputDir = path.join(dataDir, "aggregated");
  const outputPath = path.join(outputDir, `all-aggregated.json`);
  const processingIndexPath = path.join(outputDir, `all-processing-index.json`);

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
    countries: {},
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

  // Initialize country data in the aggregated data if it doesn't exist
  if (!aggregatedData.countries[countryCode]) {
    aggregatedData.countries[countryCode] = {
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
    };
  }

  // Find all data files in the country directory
  const filePattern = new RegExp(
    `${countryCode}-ALLMODELS-[A-Z]+-\\d+\\.csv`,
    "i"
  );
  const allFiles = fs
    .readdirSync(countryDir)
    .filter((file) => file.match(filePattern))
    .map((file) => ({
      path: path.join(countryDir, file),
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

  // Recalculate year-to-date totals and averages for this country
  calculateYearToDateMetrics(aggregatedData.countries[countryCode]);

  // Recalculate global year-to-date metrics
  calculateGlobalYearToDateMetrics(aggregatedData);

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
  createMonthlySummaryCSV(aggregatedData);

  return aggregatedData;
}

/**
 * Process a single data file and add it to the aggregated data
 * @param {string} filePath - Path to the data file
 * @param {object} aggregatedData - The aggregated data object to update
 * @param {string} countryCode - The country code
 */
async function processDataFile(filePath, aggregatedData, countryCode) {
  // Extract month and year from filename
  const fileNameMatch = path
    .basename(filePath)
    .match(/[A-Z]{2}-ALLMODELS-(\w+)-(\d+)\.csv/i);
  if (!fileNameMatch) {
    throw new Error("Invalid filename format");
  }

  const month = fileNameMatch[1].toUpperCase();
  const year = `20${fileNameMatch[2]}`;
  const monthKey = `${month}-${year}`;

  // Initialize month data in global and country-specific data if it doesn't exist
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
      countries: {},
    };
  }

  if (!aggregatedData.months[monthKey].countries[countryCode]) {
    aggregatedData.months[monthKey].countries[countryCode] = {
      totalMediaSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalIV: 0,
    };
  }

  if (!aggregatedData.countries[countryCode].months[monthKey]) {
    aggregatedData.countries[countryCode].months[monthKey] = {
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
  } else {
    console.log(
      `Month ${monthKey} already exists in the country data, appending new model data`
    );
  }

  // Read the CSV file
  const results = await readCSV(filePath);

  // Process data rows
  for (const row of results) {
    // Parse values
    const model = row["Model"];
    const mediaSpend = parseFloat(row["Media Spend"]) || 0;
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

    // Update country-specific monthly data
    updateMonthlyData(
      aggregatedData.countries[countryCode].months[monthKey],
      model,
      {
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
      }
    );

    // Update global monthly data
    updateGlobalMonthlyData(
      aggregatedData.months[monthKey],
      model,
      countryCode,
      {
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
      }
    );

    // Update country-specific model data
    updateModelData(
      aggregatedData.countries[countryCode].models,
      model,
      monthKey,
      {
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
      }
    );

    // Update global model data
    updateGlobalModelData(aggregatedData.models, model, monthKey, countryCode, {
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

  // Recalculate monthly averages
  calculateMonthlyAverages(
    aggregatedData.countries[countryCode].months[monthKey]
  );
  calculateGlobalMonthlyAverages(aggregatedData.months[monthKey]);
}

/**
 * Update the global monthly data with new country information
 */
function updateGlobalMonthlyData(monthData, model, countryCode, metrics) {
  // Add to global month totals
  monthData.totalMediaSpend += metrics.mediaSpend;
  monthData.totalImpressions += metrics.impressions;
  monthData.totalClicks += metrics.clicks;
  monthData.totalIV += metrics.iv;

  // Add to country totals within the month
  monthData.countries[countryCode].totalMediaSpend += metrics.mediaSpend;
  monthData.countries[countryCode].totalImpressions += metrics.impressions;
  monthData.countries[countryCode].totalClicks += metrics.clicks;
  monthData.countries[countryCode].totalIV += metrics.iv;

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
      countries: {},
    };
  }

  if (!monthData.models[model].countries[countryCode]) {
    monthData.models[model].countries[countryCode] = {
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

  const countryModelData = modelData.countries[countryCode];
  countryModelData.mediaSpend += metrics.mediaSpend;
  countryModelData.impressions += metrics.impressions;
  countryModelData.clicks += metrics.clicks;
  countryModelData.iv += metrics.iv;
}

/**
 * Update the global model data with new country information
 */
function updateGlobalModelData(
  modelsData,
  model,
  monthKey,
  countryCode,
  metrics
) {
  if (!modelsData[model]) {
    modelsData[model] = {
      totalMediaSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalIV: 0,
      monthlyData: {},
      countries: {},
    };
  }

  if (!modelsData[model].countries[countryCode]) {
    modelsData[model].countries[countryCode] = {
      totalMediaSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalIV: 0,
    };
  }

  const globalModelData = modelsData[model];
  globalModelData.totalMediaSpend += metrics.mediaSpend;
  globalModelData.totalImpressions += metrics.impressions;
  globalModelData.totalClicks += metrics.clicks;
  globalModelData.totalIV += metrics.iv;

  const countryData = globalModelData.countries[countryCode];
  countryData.totalMediaSpend += metrics.mediaSpend;
  countryData.totalImpressions += metrics.impressions;
  countryData.totalClicks += metrics.clicks;
  countryData.totalIV += metrics.iv;

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
      countries: {},
    };
  } else {
    globalModelData.monthlyData[monthKey].mediaSpend += metrics.mediaSpend;
    globalModelData.monthlyData[monthKey].impressions += metrics.impressions;
    globalModelData.monthlyData[monthKey].clicks += metrics.clicks;
    globalModelData.monthlyData[monthKey].iv += metrics.iv;
  }

  if (!globalModelData.monthlyData[monthKey].countries[countryCode]) {
    globalModelData.monthlyData[monthKey].countries[countryCode] = {
      mediaSpend: metrics.mediaSpend,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      iv: metrics.iv,
    };
  } else {
    globalModelData.monthlyData[monthKey].countries[countryCode].mediaSpend +=
      metrics.mediaSpend;
    globalModelData.monthlyData[monthKey].countries[countryCode].impressions +=
      metrics.impressions;
    globalModelData.monthlyData[monthKey].countries[countryCode].clicks +=
      metrics.clicks;
    globalModelData.monthlyData[monthKey].countries[countryCode].iv +=
      metrics.iv;
  }

  // Recalculate derived metrics if needed
  if (globalModelData.monthlyData[monthKey].impressions > 0) {
    globalModelData.monthlyData[monthKey].ctr =
      globalModelData.monthlyData[monthKey].clicks /
      globalModelData.monthlyData[monthKey].impressions;
  }
}

/**
 * Calculate global monthly averages
 */
function calculateGlobalMonthlyAverages(monthData) {
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
 * Calculate global year-to-date metrics
 */
function calculateGlobalYearToDateMetrics(aggregatedData) {
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
 * Create a monthly summary CSV file for all countries combined
 */
function createMonthlySummaryCSV(aggregatedData) {
  const outputDir = path.join(__dirname, "../data/aggregated");
  const monthlySummaryPath = path.join(outputDir, `all-monthly-summary.csv`);
  const monthKeys = Object.keys(aggregatedData.months).sort();

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
  console.log(`Monthly summary CSV written to ${monthlySummaryPath}`);

  // Also create country-specific summary files
  for (const countryCode of Object.keys(aggregatedData.countries)) {
    const countryData = aggregatedData.countries[countryCode];
    const countrySummaryPath = path.join(
      outputDir,
      `${countryCode.toLowerCase()}-monthly-summary.csv`
    );

    let countryCsvContent =
      "Month,Media Spend,Impressions,Clicks,CTR,CPM,CPC,CP IV,Cp NVWR\n";

    const countryMonthKeys = Object.keys(countryData.months).sort();
    for (const monthKey of countryMonthKeys) {
      const monthData = countryData.months[monthKey];
      countryCsvContent += `${monthKey},${monthData.totalMediaSpend},${monthData.totalImpressions},${monthData.totalClicks},${monthData.avgCTR},${monthData.avgCPM},${monthData.avgCPC},${monthData.avgCPIV},${monthData.avgCpNVWR}\n`;
    }

    // Add country YTD summary
    countryCsvContent += `YTD ${new Date().getFullYear()},${
      countryData.yearToDateTotals.mediaSpend
    },${countryData.yearToDateTotals.impressions},${
      countryData.yearToDateTotals.clicks
    },${countryData.yearToDateAverages.ctr},${
      countryData.yearToDateAverages.cpm
    },${countryData.yearToDateAverages.cpc},${
      countryData.yearToDateAverages.cpIv
    },${countryData.yearToDateAverages.cpNvwr}\n`;

    fs.writeFileSync(countrySummaryPath, countryCsvContent);
    console.log(`Country monthly summary CSV written to ${countrySummaryPath}`);
  }
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
 * Calculates the percentage change between two values
 */
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
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
