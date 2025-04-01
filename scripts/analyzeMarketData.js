const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

/**
 * Analyzes marketing data for a specific market and model from CSV files
 *
 * @param {string} market - Market code (e.g., 'FR', 'BELUX')
 * @param {string} modelOrFile - Model code or specific file to analyze
 * @param {string} month - Month and year (format: 'MAR-25')
 */
function analyzeMarketData(market, modelOrFile, month) {
  // Determine the file path based on input parameters
  let filePath;
  if (modelOrFile.endsWith(".csv")) {
    // If a full file name is provided
    filePath = path.join(__dirname, "..", "data", market, modelOrFile);
  } else {
    // Construct file name from model and month
    filePath = path.join(
      __dirname,
      "..",
      "data",
      market,
      `${market}-${modelOrFile}-${month}.csv`
    );
  }

  console.log(`Analyzing data from: ${filePath}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    return;
  }

  // Store data
  const models = [];
  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalNVWR = 0;

  // Read and process the CSV file
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      // Convert string values to numbers
      const model = {
        segment: row.Segment,
        model: row.Model,
        mediaSpend: parseFloat(row["Media Spend"] || row["Media Cost"] || 0),
        impressions: parseInt(row.Impressions || 0),
        cpm: parseFloat(row.CPM || 0),
        clicks: parseInt(row.Clicks || 0),
        ctr: parseFloat(row.CTR || 0),
        cpc: parseFloat(row.CPC || 0),
        nvwr: parseInt(row.NVWR || 0),
        cpNvwr: parseFloat(row["Cp NVWR"] || 0),
        conversion: parseFloat(row.CVR || 0),
      };

      // Add to totals
      totalSpend += model.mediaSpend;
      totalImpressions += model.impressions;
      totalClicks += model.clicks;
      totalNVWR += model.nvwr;

      models.push(model);
    })
    .on("end", () => {
      if (models.length === 0) {
        console.error("Error: No data found in file or invalid CSV format");
        return;
      }

      // Overall statistics
      console.log(`\n=== BMW ${market} Marketing Analysis (${month}) ===`);
      console.log(`Total models/entries analyzed: ${models.length}`);
      console.log(`Total media spend: €${totalSpend.toFixed(2)}`);
      console.log(`Total impressions: ${totalImpressions.toLocaleString()}`);
      console.log(`Total clicks: ${totalClicks.toLocaleString()}`);
      console.log(`Total NVWRs: ${totalNVWR}`);
      console.log(
        `Average CPM: €${((totalSpend / totalImpressions) * 1000).toFixed(2)}`
      );
      console.log(
        `Overall CTR: ${((totalClicks / totalImpressions) * 100).toFixed(4)}%`
      );
      console.log(
        `Overall conversion rate: ${(
          (totalNVWR / totalImpressions) *
          100
        ).toFixed(4)}%`
      );

      // Top 5 models by spend
      const topBySpend = [...models]
        .sort((a, b) => b.mediaSpend - a.mediaSpend)
        .slice(0, 5);

      console.log("\n=== Top 5 Entries by Media Spend ===");
      topBySpend.forEach((model, i) => {
        console.log(
          `${i + 1}. ${model.model || "N/A"}: €${model.mediaSpend.toFixed(
            2
          )} (Impressions: ${model.impressions.toLocaleString()}, NVWRs: ${
            model.nvwr
          })`
        );
      });

      // Top models by NVWR count
      const topByNVWR = [...models].sort((a, b) => b.nvwr - a.nvwr).slice(0, 5);

      console.log("\n=== Top 5 Entries by NVWR Count ===");
      topByNVWR.forEach((model, i) => {
        console.log(
          `${i + 1}. ${model.model || "N/A"}: ${
            model.nvwr
          } NVWRs (Spend: €${model.mediaSpend.toFixed(
            2
          )}, Impressions: ${model.impressions.toLocaleString()})`
        );
      });

      // Top models by conversion rate (with at least 5 NVWRs)
      const topByConversion = [...models]
        .filter((m) => m.nvwr >= 5)
        .map((m) => ({ ...m, convRate: (m.nvwr / m.impressions) * 10000 })) // per 10,000 impressions
        .sort((a, b) => b.convRate - a.convRate)
        .slice(0, 5);

      console.log(
        "\n=== Top 5 Entries by Conversion Rate (per 10,000 impressions) ==="
      );
      topByConversion.forEach((model, i) => {
        console.log(
          `${i + 1}. ${model.model || "N/A"}: ${model.convRate.toFixed(
            2
          )} (Spend: €${model.mediaSpend.toFixed(2)}, NVWRs: ${model.nvwr})`
        );
      });

      // Models with cost efficiency (lowest cost per NVWR, at least 5 NVWRs)
      const mostEfficient = [...models]
        .filter((m) => m.nvwr >= 5 && m.cpNvwr > 0)
        .sort((a, b) => a.cpNvwr - b.cpNvwr)
        .slice(0, 5);

      if (mostEfficient.length > 0) {
        console.log("\n=== Most Cost-Efficient Entries (by Cost per NVWR) ===");
        mostEfficient.forEach((model, i) => {
          console.log(
            `${i + 1}. ${model.model || "N/A"}: €${model.cpNvwr.toFixed(
              2
            )} per NVWR (Spend: €${model.mediaSpend.toFixed(2)}, NVWRs: ${
              model.nvwr
            })`
          );
        });
      }

      // Weekly data analysis if "Week of Year" column exists
      if (models.some((m) => m["Week of Year"] !== undefined)) {
        console.log("\n=== Weekly Performance Trends ===");
        const weeklyData = models.reduce((acc, model) => {
          const week = model["Week of Year"] || "Unknown";
          if (!acc[week]) {
            acc[week] = {
              impressions: 0,
              clicks: 0,
              spend: 0,
              nvwr: 0,
            };
          }
          acc[week].impressions += model.impressions;
          acc[week].clicks += model.clicks;
          acc[week].spend += model.mediaSpend;
          acc[week].nvwr += model.nvwr;
          return acc;
        }, {});

        Object.entries(weeklyData)
          .sort(([weekA], [weekB]) => weekA.localeCompare(weekB))
          .forEach(([week, data]) => {
            console.log(
              `Week ${week}: €${data.spend.toFixed(
                2
              )} spend, ${data.impressions.toLocaleString()} impressions, ${
                data.nvwr
              } NVWRs`
            );
          });
      }

      console.log("\nAnalysis complete!");
    });
}

// Check if script is being run directly
if (require.main === module) {
  // Get command line arguments
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(
      "Usage: node analyzeMarketData.js <market> [model/file] [month]"
    );
    console.log("Example: node analyzeMarketData.js FR ALLMODELS MAR-25");
    console.log(
      "Example with filename: node analyzeMarketData.js FR FR-ALLMODELS-MAR-25.csv"
    );
    process.exit(1);
  }

  const market = args[0];
  const modelOrFile = args[1] || "ALLMODELS";
  const month = args[2] || "MAR-25";

  analyzeMarketData(market, modelOrFile, month);
}

module.exports = { analyzeMarketData };
