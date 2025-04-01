const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

/**
 * Aggregates data from multiple CSV files and compiles it into a single object
 * with month-by-month metrics and YoY calculations.
 */
async function aggregateFranceData() {
  console.log("Aggregating France data from all months...");

  // Define the source data directory and files
  const dataDir = path.join(__dirname, "../data/FR");
  const outputDir = path.join(__dirname, "../data/aggregated");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find all FR-ALLMODELS CSV files
  const files = fs
    .readdirSync(dataDir)
    .filter((file) => file.match(/FR-ALLMODELS-[A-Z]+-\d+\.csv/))
    .map((file) => path.join(dataDir, file));

  if (files.length === 0) {
    console.error("No France data files found!");
    return;
  }

  console.log(
    `Found ${files.length} France data files: ${files
      .map((f) => path.basename(f))
      .join(", ")}`
  );

  // Aggregate the data
  const aggregatedData = await aggregateMonthlyData(files);

  // Write the aggregated data to a JSON file
  const outputPath = path.join(outputDir, "france-aggregated.json");
  fs.writeFileSync(outputPath, JSON.stringify(aggregatedData, null, 2));

  console.log(`Aggregated data written to ${outputPath}`);

  // Create a monthly summary CSV
  const monthlySummaryPath = path.join(outputDir, "france-monthly-summary.csv");
  const monthKeys = Object.keys(aggregatedData.months).sort();

  let csvContent =
    "Month,Media Spend,Impressions,Clicks,CTR,CPM,CPC,CP IV,Cp NVWR\n";

  for (const monthKey of monthKeys) {
    const monthData = aggregatedData.months[monthKey];
    csvContent += `${monthKey},${monthData.totalMediaSpend},${monthData.totalImpressions},${monthData.totalClicks},${monthData.avgCTR},${monthData.avgCPM},${monthData.avgCPC},${monthData.avgCPIV},${monthData.avgCpNVWR}\n`;
  }

  // Add YTD summary
  csvContent += `YTD 2025,${aggregatedData.yearToDateTotals.mediaSpend},${aggregatedData.yearToDateTotals.impressions},${aggregatedData.yearToDateTotals.clicks},${aggregatedData.yearToDateAverages.ctr},${aggregatedData.yearToDateAverages.cpm},${aggregatedData.yearToDateAverages.cpc},${aggregatedData.yearToDateAverages.cpIv},${aggregatedData.yearToDateAverages.cpNvwr}\n`;

  fs.writeFileSync(monthlySummaryPath, csvContent);
  console.log(`Monthly summary CSV written to ${monthlySummaryPath}`);

  return aggregatedData;
}

/**
 * Aggregates data from multiple CSV files and compiles it into a single object
 * with month-by-month metrics and YoY calculations.
 *
 * @param {Array} filePaths Array of file paths to the monthly CSV files
 * @returns {Promise} Promise resolving to the aggregated data object
 */
async function aggregateMonthlyData(filePaths) {
  // Object to store aggregated data
  const aggregatedData = {
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

  // Process each file
  for (const filePath of filePaths) {
    // Extract month and year from filename
    const fileNameMatch = path
      .basename(filePath)
      .match(/FR-ALLMODELS-(\w+)-(\d+)\.csv/);
    if (!fileNameMatch) continue;

    const month = fileNameMatch[1];
    const year = `20${fileNameMatch[2]}`;
    const monthKey = `${month}-${year}`;

    // Initialize month data
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

      // Add to month totals
      const monthData = aggregatedData.months[monthKey];
      monthData.totalMediaSpend += mediaSpend;
      monthData.totalImpressions += impressions;
      monthData.totalClicks += clicks;
      monthData.totalIV += iv;

      // Add weighted metrics
      if (!isNaN(cpm) && cpm > 0) {
        monthData.weightedCPM += cpm * impressions;
        monthData.validCPMCount += impressions;
      }

      if (!isNaN(cpc) && cpc > 0) {
        monthData.weightedCPC += cpc * clicks;
        monthData.validCPCCount += clicks;
      }

      if (!isNaN(cpIv) && cpIv > 0) {
        monthData.weightedCPIV += cpIv * iv;
        monthData.validCPIVCount += iv;
      }

      if (!isNaN(cpNvwr) && cpNvwr > 0 && nvwr > 0) {
        monthData.weightedCpNVWR += cpNvwr * nvwr;
        monthData.validCpNVWRCount += nvwr;
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
      modelData.mediaSpend += mediaSpend;
      modelData.impressions += impressions;
      modelData.clicks += clicks;
      modelData.iv += iv;

      // Add to global models aggregation
      if (!aggregatedData.models[model]) {
        aggregatedData.models[model] = {
          totalMediaSpend: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalIV: 0,
          monthlyData: {},
        };
      }

      const globalModelData = aggregatedData.models[model];
      globalModelData.totalMediaSpend += mediaSpend;
      globalModelData.totalImpressions += impressions;
      globalModelData.totalClicks += clicks;
      globalModelData.totalIV += iv;

      if (!globalModelData.monthlyData[monthKey]) {
        globalModelData.monthlyData[monthKey] = {
          mediaSpend,
          impressions,
          clicks,
          iv,
          ctr,
          cpm,
          cpc,
          cpIv,
          cpNvwr,
        };
      } else {
        globalModelData.monthlyData[monthKey].mediaSpend += mediaSpend;
        globalModelData.monthlyData[monthKey].impressions += impressions;
        globalModelData.monthlyData[monthKey].clicks += clicks;
        globalModelData.monthlyData[monthKey].iv += iv;
      }

      // Add to year-to-date totals
      aggregatedData.yearToDateTotals.mediaSpend += mediaSpend;
      aggregatedData.yearToDateTotals.impressions += impressions;
      aggregatedData.yearToDateTotals.clicks += clicks;
      aggregatedData.yearToDateTotals.iv += iv;
    }

    // Calculate month averages
    const monthData = aggregatedData.months[monthKey];
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

  // Calculate YoY metrics if we have more than one month
  const monthKeys = Object.keys(aggregatedData.months).sort();
  if (monthKeys.length > 1) {
    const latestMonth = monthKeys[monthKeys.length - 1];
    const previousMonth = monthKeys[monthKeys.length - 2];

    // Calculate month-over-month change
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

    // Calculate year-to-date averages
    aggregatedData.yearToDateAverages.ctr =
      aggregatedData.yearToDateTotals.impressions > 0
        ? aggregatedData.yearToDateTotals.clicks /
          aggregatedData.yearToDateTotals.impressions
        : 0;

    let totalWeightedCPM = 0;
    let totalWeightedCPC = 0;
    let totalWeightedCPIV = 0;
    let totalWeightedCpNVWR = 0;
    let totalValidCPMCount = 0;
    let totalValidCPCCount = 0;
    let totalValidCPIVCount = 0;
    let totalValidCpNVWRCount = 0;

    for (const monthKey of monthKeys) {
      const monthData = aggregatedData.months[monthKey];
      totalWeightedCPM += monthData.weightedCPM;
      totalWeightedCPC += monthData.weightedCPC;
      totalWeightedCPIV += monthData.weightedCPIV;
      totalWeightedCpNVWR += monthData.weightedCpNVWR;
      totalValidCPMCount += monthData.validCPMCount;
      totalValidCPCCount += monthData.validCPCCount;
      totalValidCPIVCount += monthData.validCPIVCount;
      totalValidCpNVWRCount += monthData.validCpNVWRCount;
    }

    aggregatedData.yearToDateAverages.cpm =
      totalValidCPMCount > 0 ? totalWeightedCPM / totalValidCPMCount : 0;
    aggregatedData.yearToDateAverages.cpc =
      totalValidCPCCount > 0 ? totalWeightedCPC / totalValidCPCCount : 0;
    aggregatedData.yearToDateAverages.cpIv =
      totalValidCPIVCount > 0 ? totalWeightedCPIV / totalValidCPIVCount : 0;
    aggregatedData.yearToDateAverages.cpNvwr =
      totalValidCpNVWRCount > 0
        ? totalWeightedCpNVWR / totalValidCpNVWRCount
        : 0;
  }

  // Return the aggregated data
  return aggregatedData;
}

/**
 * Reads a CSV file and returns its contents as an array of objects
 *
 * @param {string} filePath Path to the CSV file
 * @returns {Promise} Promise resolving to an array of objects representing the CSV rows
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
 *
 * @param {number} oldValue The original value
 * @param {number} newValue The new value
 * @returns {number} The percentage change
 */
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Run the script if called directly
if (require.main === module) {
  aggregateFranceData().catch((err) => {
    console.error("Error aggregating France data:", err);
    process.exit(1);
  });
}

module.exports = {
  aggregateFranceData,
};
