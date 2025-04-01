const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Route to get aggregated data for France
router.get("/", async (req, res) => {
  try {
    // Use the pre-aggregated JSON file instead of processing CSV directly
    const aggregatedFilePath = path.join(
      __dirname,
      "../../output/fr-aggregated.json"
    );

    console.log("Trying to read aggregated file:", aggregatedFilePath);
    console.log("File exists:", fs.existsSync(aggregatedFilePath));

    if (!fs.existsSync(aggregatedFilePath)) {
      return res.status(404).json({
        error: "Data file not found",
        message: "The France aggregated data file could not be found",
      });
    }

    // Read and parse the JSON file
    const aggregatedData = JSON.parse(
      fs.readFileSync(aggregatedFilePath, "utf8")
    );

    // Return the pre-processed data directly - it's already in the format expected by the client
    res.json(aggregatedData);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Server error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
