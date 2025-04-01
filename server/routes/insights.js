const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { generateCompletion } = require("../services/openai");

// Load prompts from configuration file
const promptsPath = path.resolve(__dirname, "../../config/prompts.json");
let prompts = {};

try {
  prompts = JSON.parse(fs.readFileSync(promptsPath, "utf8"));
  console.log("Loaded prompts configuration");
} catch (error) {
  console.error("Error loading prompts configuration:", error);
}

/**
 * Helper function to process templates with data
 * @param {string} template - Template string with {{variable}} placeholders
 * @param {Object} data - Data object to replace placeholders
 * @returns {string} - Processed template
 */
function processTemplate(template, data) {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = data[key.trim()];
    return value !== undefined ? value : match;
  });
}

/**
 * Generate market summary using AI
 * POST /api/insights/market-summary
 */
router.post("/market-summary", async (req, res) => {
  try {
    const { marketData, timeframe, country } = req.body;

    if (!marketData) {
      return res.status(400).json({ error: "Missing market data" });
    }

    // Create a formatted data summary for the prompt
    const dataSummary = `
      Country: ${country || "France"}
      Timeframe: ${timeframe || "current month"}
      Media Spend: €${marketData.totalMediaSpend?.toLocaleString() || 0}
      Impressions: ${(marketData.totalImpressions || 0).toLocaleString()}
      Clicks: ${(marketData.totalClicks || 0).toLocaleString()}
      CTR: ${((marketData.weightedCTR || 0) * 100).toFixed(2)}%
      CPM: €${(marketData.weightedCPM || 0).toFixed(2)}
      Top Models: ${Object.keys(marketData.models || {})
        .slice(0, 3)
        .join(", ")}
    `;

    // Construct messages for the AI
    const messages = [
      {
        role: "system",
        content: `You are a marketing data analyst generating insights about BMW marketing performance in ${country}. 
                 Provide a clear, data-focused summary without any marketing strategy recommendations.
                 Format your response in markdown with 3 sections: Performance Overview, Trend Analysis, and Model Performance.`,
      },
      {
        role: "user",
        content: `Analyze this ${country} market data for ${timeframe}:\n${dataSummary}`,
      },
    ];

    // Generate completion using OpenAI
    const completion = await generateCompletion("gpt-4-turbo", messages, {
      maxTokens: 750,
    });

    // Extract content from completion
    const summary = completion.choices[0].message.content;

    return res.json({ summary });
  } catch (error) {
    console.error("Error generating market summary:", error);
    return res.status(500).json({
      error: "Failed to generate market summary",
      message: error.message,
    });
  }
});

/**
 * Generate insights using AI
 * POST /api/insights/generate
 */
router.post("/generate", async (req, res) => {
  try {
    const { promptName, data, options = {} } = req.body;

    // Validate the prompt exists
    if (!prompts[promptName]) {
      return res.status(400).json({ error: "Invalid prompt name" });
    }

    const promptConfig = prompts[promptName];
    const { model, max_completion_tokens, messages } = promptConfig;

    // Process templates in messages
    const processedMessages = messages
      ? Object.entries(messages).map(([role, content]) => ({
          role,
          content: processTemplate(content, data),
        }))
      : [];

    // Generate completion using OpenAI
    const completion = await generateCompletion(
      model || "gpt-4o-mini",
      processedMessages,
      {
        maxTokens: max_completion_tokens || 350,
        ...options,
      }
    );

    // Extract content from completion
    const content = completion.choices[0].message.content;

    return res.json({ content });
  } catch (error) {
    console.error("Error generating insights:", error);
    return res.status(500).json({
      error: "Failed to generate insights",
      message: error.message,
    });
  }
});

module.exports = router;
