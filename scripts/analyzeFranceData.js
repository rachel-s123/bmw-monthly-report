const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { analyzeMarketData } = require("./analyzeMarketData");

// Make sure data directory exists
const dataDir = path.join(__dirname, "..", "data");
const frDataDir = path.join(dataDir, "FR");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(frDataDir)) {
  fs.mkdirSync(frDataDir);
}

// Define the source and destination paths
const sourcePath = path.join(
  __dirname,
  "..",
  "monthly_exports",
  "2025-03",
  "F-900-BELUX-Q1.csv"
);
const destPath = path.join(frDataDir, "FR-ALLMODELS-MAR-25.csv");

// Copy the FR-ALLMODELS-MAR-25.csv file to the data/FR directory
if (!fs.existsSync(destPath)) {
  try {
    console.log(`Copying data from ${sourcePath} to ${destPath}...`);
    fs.copyFileSync(sourcePath, destPath);
    console.log("File copied successfully.");
  } catch (err) {
    console.error(`Error copying file: ${err.message}`);
    process.exit(1);
  }
} else {
  console.log("File already exists in data directory.");
}

// Now analyze the data using the generic analyzer
console.log("Analyzing France marketing data...");
analyzeMarketData("FR", "FR-ALLMODELS-MAR-25.csv");

// If you want to run this directly, use:
// node scripts/analyzeFranceData.js
