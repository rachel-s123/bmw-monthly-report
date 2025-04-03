const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Route to get aggregated data for FR
router.get("/", (req, res) => {
  try {
    // Read the aggregated data file
    const dataPath = path.join(__dirname, "../../output/fr-aggregated.json");

    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({
        success: false,
        message: "The FR aggregated data file could not be found",
      });
    }

    const aggregatedData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    return res.json(aggregatedData);
  } catch (error) {
    console.error("Error fetching FR data:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
