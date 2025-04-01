const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const router = express.Router();

// Route to get summary data for France
router.get("/", async (req, res) => {
  try {
    const results = [];
    const filePath = path.join(
      __dirname,
      "../../data/FR/FR-ALLMODELS-MAR-25.csv"
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Data file not found",
        message: "The France data file could not be found",
      });
    }

    // Get the latest month from the filename
    const filenameMatch = path
      .basename(filePath)
      .match(/FR-ALLMODELS-(\w+)-(\d+)\.csv/);
    const month = filenameMatch ? filenameMatch[1] : "MAR";
    const year = filenameMatch ? filenameMatch[2] : "25";
    const latestMonth = `${month} 20${year}`;

    // Read and process the CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        // Filter data for the latest month if needed
        // Note: In this case, the entire file is already for March 2025
        const filteredData = results;

        // Calculate summary metrics
        const summary = calculateSummary(filteredData);
        summary.month = latestMonth;

        // Calculate model performance metrics
        const modelPerformance = calculateModelPerformance(filteredData);

        // Return the processed data
        res.json({
          summary,
          modelPerformance,
          month: latestMonth,
          rawData: filteredData,
        });
      })
      .on("error", (err) => {
        console.error("Error reading CSV file:", err);
        res.status(500).json({
          error: "Server error",
          message: "Error processing data file",
        });
      });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Internal server error",
    });
  }
});

// Helper function to calculate summary metrics
function calculateSummary(data) {
  // Initial values
  let totalMediaSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalIV = 0;
  let totalCost = 0;
  let weightedCPM = 0;
  let weightedCPC = 0;
  let weightedCPIV = 0;
  let weightedCpNVWR = 0;
  let validCPMCount = 0;
  let validCPCCount = 0;
  let validCPIVCount = 0;
  let validCpNVWRCount = 0;
  let weightedCTR = 0;
  let weightedCVR = 0;
  let validCVRCount = 0;

  // Process each row
  data.forEach((row) => {
    // Parse numeric values
    const mediaSpend = parseFloat(row["Media Spend"]) || 0;
    const impressions = parseFloat(row["Impressions"]) || 0;
    const clicks = parseFloat(row["Clicks"]) || 0;
    const iv = parseFloat(row["IV"]) || 0;
    const cvr = parseFloat(row["CVR"]) || 0;
    const cpm = parseFloat(row["CPM"]) || 0;
    const cpc = parseFloat(row["CPC"]) || 0;
    const cpIv = parseFloat(row["CP IV"]) || 0;
    const cpNvwr = parseFloat(row["Cp NVWR"]) || 0;

    // Add to totals
    totalMediaSpend += mediaSpend;
    totalImpressions += impressions;
    totalClicks += clicks;
    totalIV += iv;

    // Calculate weighted metrics
    if (!isNaN(cpm) && cpm > 0) {
      weightedCPM += cpm * impressions;
      validCPMCount += impressions;
    }

    if (!isNaN(cpc) && cpc > 0) {
      weightedCPC += cpc * clicks;
      validCPCCount += clicks;
    }

    if (!isNaN(cpIv) && cpIv > 0) {
      weightedCPIV += cpIv * iv;
      validCPIVCount += iv;
    }

    if (!isNaN(cpNvwr) && cpNvwr > 0 && row["NVWR"] > 0) {
      const nvwr = parseFloat(row["NVWR"]) || 0;
      weightedCpNVWR += cpNvwr * nvwr;
      validCpNVWRCount += nvwr;
    }

    if (!isNaN(cvr) && cvr > 0) {
      weightedCVR += cvr * mediaSpend;
      validCVRCount += mediaSpend;
    }
  });

  // Calculate averages and derived metrics
  const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgCVR = validCVRCount > 0 ? weightedCVR / validCVRCount : 0;
  const avgCPM = validCPMCount > 0 ? weightedCPM / validCPMCount : 0;
  const avgCPC = validCPCCount > 0 ? weightedCPC / validCPCCount : 0;
  const avgCPIV = validCPIVCount > 0 ? weightedCPIV / validCPIVCount : 0;
  const avgCpNVWR =
    validCpNVWRCount > 0 ? weightedCpNVWR / validCpNVWRCount : 0;

  return {
    totalMediaSpend,
    totalImpressions,
    totalClicks,
    totalIV,
    avgCTR,
    avgCVR,
    avgCPM,
    avgCPC,
    avgCPIV,
    avgCpNVWR,
    // Format for frontend display
    formattedMediaSpend: new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
      currencyDisplay: "symbol",
    }).format(totalMediaSpend),
    formattedImpressions: new Intl.NumberFormat("fr-FR").format(
      totalImpressions
    ),
    formattedClicks: new Intl.NumberFormat("fr-FR").format(totalClicks),
    formattedCTR: (avgCTR * 100).toFixed(2) + "%",
    formattedCVR: (avgCVR * 100).toFixed(2) + "%",
    formattedCPM: new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
      currencyDisplay: "symbol",
    }).format(avgCPM),
    formattedCPC: new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
      currencyDisplay: "symbol",
    }).format(avgCPC),
    formattedCPIV: new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
      currencyDisplay: "symbol",
    }).format(avgCPIV),
    formattedCpNVWR: new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
      currencyDisplay: "symbol",
    }).format(avgCpNVWR),
  };
}

// Helper function to calculate model performance
function calculateModelPerformance(data) {
  // Group data by model
  const modelMap = new Map();

  // Process each row
  data.forEach((row) => {
    const model = row["Model"];
    const mediaSpend = parseFloat(row["Media Spend"]) || 0;
    const impressions = parseFloat(row["Impressions"]) || 0;
    const clicks = parseFloat(row["Clicks"]) || 0;
    const iv = parseFloat(row["IV"]) || 0;

    if (!modelMap.has(model)) {
      modelMap.set(model, {
        model,
        mediaSpend: 0,
        impressions: 0,
        clicks: 0,
        iv: 0,
      });
    }

    const modelData = modelMap.get(model);
    modelData.mediaSpend += mediaSpend;
    modelData.impressions += impressions;
    modelData.clicks += clicks;
    modelData.iv += iv;
  });

  // Convert map to array and calculate CTR
  const modelPerformance = Array.from(modelMap.values()).map((item) => {
    return {
      ...item,
      ctr: item.impressions > 0 ? item.clicks / item.impressions : 0,
      cpm:
        item.impressions > 0 ? (item.mediaSpend / item.impressions) * 1000 : 0,
    };
  });

  // Sort by media spend (descending)
  return modelPerformance.sort((a, b) => b.mediaSpend - a.mediaSpend);
}

module.exports = router;
