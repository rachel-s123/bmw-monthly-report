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
    console.log(`Received request for country: ${countryCode}`);

    // Map country codes to file paths
    let filePath;
    if (countryCode === "fr") {
      filePath = path.resolve(process.cwd(), "output/fr-aggregated.json");
    } else if (countryCode === "pt") {
      filePath = path.resolve(process.cwd(), "output/pt-aggregated.json");
    } else {
      return res.status(404).json({
        error: "Country not found",
        message: `Data for country code '${countryCode}' is not available`,
        availableCountries: ["fr", "pt"],
      });
    }

    console.log(`Looking for file at: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Data file not found",
        message: `The ${countryCode} aggregated data file could not be found`,
        path: filePath,
      });
    }

    // Read and parse the JSON file
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log(`Successfully loaded data for ${countryCode}`);

    // Return the data directly
    res.json(data);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
