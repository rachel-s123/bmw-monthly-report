const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/**
 * Route to get market data by country code
 * GET /api/market-data/:country
 */
router.get("/:country", async (req, res) => {
  try {
    const countryCode = req.params.country.toLowerCase();
    console.log(
      `[Market-Data API] Received request for country: ${countryCode}`
    );

    // Map country codes to file paths
    let filePath;
    if (countryCode === "fr") {
      filePath = path.join(__dirname, "../../output/fr-aggregated.json");
    } else if (countryCode === "pt") {
      filePath = path.join(__dirname, "../../output/pt-aggregated.json");
    } else {
      console.error(
        `[Market-Data API] Country code not supported: ${countryCode}`
      );
      return res.status(404).json({
        error: "Country not found",
        message: `Data for country code '${countryCode}' is not available`,
        availableCountries: ["fr", "pt"],
      });
    }

    console.log(`[Market-Data API] Looking for file at: ${filePath}`);
    const fileExists = fs.existsSync(filePath);
    console.log(`[Market-Data API] File exists: ${fileExists}`);

    if (!fileExists) {
      console.error(`[Market-Data API] File not found: ${filePath}`);
      return res.status(404).json({
        error: "Data file not found",
        message: `The ${countryCode} aggregated data file could not be found`,
        path: filePath,
      });
    }

    // Read and parse the JSON file
    const fileContents = fs.readFileSync(filePath, "utf8");
    console.log(`[Market-Data API] File size: ${fileContents.length} bytes`);

    try {
      const data = JSON.parse(fileContents);
      console.log(
        `[Market-Data API] Successfully parsed JSON for ${countryCode}`
      );
      console.log(
        `[Market-Data API] Data has keys: ${Object.keys(data).join(", ")}`
      );
      console.log(
        `[Market-Data API] Months found: ${
          data.months ? Object.keys(data.months).length : 0
        }`
      );

      // Return the data directly
      res.json(data);
      console.log(`[Market-Data API] Response sent for ${countryCode}`);
    } catch (parseError) {
      console.error(
        `[Market-Data API] JSON parse error: ${parseError.message}`
      );
      return res.status(500).json({
        error: "Invalid JSON",
        message: `The data file for ${countryCode} contains invalid JSON`,
        details: parseError.message,
      });
    }
  } catch (error) {
    console.error(`[Market-Data API] Server error:`, error);
    res.status(500).json({
      error: "Server error",
      message: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
