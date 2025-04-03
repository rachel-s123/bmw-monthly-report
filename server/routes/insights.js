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
    console.log(`Generating market summary for ${country} - ${timeframe}`);

    // Validate required data
    if (!marketData) {
      return res.status(400).json({ error: "Market data is required" });
    }

    // Format the market data as a readable string for the prompt
    const formattedMarketData = `
Country: ${country || "France"}
Timeframe: ${timeframe || "current month"}
Media Spend: €${marketData.totalMediaSpend?.toLocaleString() || 0}
Impressions: ${(marketData.totalImpressions || 0).toLocaleString()}
Clicks: ${(marketData.totalClicks || 0).toLocaleString()}
CTR: ${((marketData.weightedCTR || 0) * 100).toFixed(2)}%
CPM: €${(marketData.weightedCPM || 0).toFixed(2)}
CPC: €${(marketData.weightedCPC || 0).toFixed(2)}
IV (Interacting Visits): ${(marketData.totalIV || 0).toLocaleString()}
NVWR Count: ${(marketData.validCpNVWRCount || 0).toLocaleString()}

MODEL PERFORMANCE DATA:
${Object.entries(marketData.models || {})
  .sort(([, a], [, b]) => (b.mediaSpend || 0) - (a.mediaSpend || 0))
  .slice(0, 5)
  .map(([modelName, modelData], index) => {
    const impressions = modelData.impressions || 0;
    const clicks = modelData.clicks || 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return `${index + 1}. ${modelName}:
   - Media Spend: €${(modelData.mediaSpend || 0).toLocaleString()}
   - Impressions: ${impressions.toLocaleString()}
   - Clicks: ${clicks.toLocaleString()}
   - CTR: ${ctr.toFixed(2)}%`;
  })
  .join("\n\n")}
`;

    console.log(
      "Formatted market data sample:",
      formattedMarketData.substring(0, 200) + "..."
    );

    // Prepare template data
    const templateData = {
      timeframe: timeframe || "current month",
      marketData: formattedMarketData,
    };

    // Get prompt configuration
    const promptConfig = prompts.marketSummary;
    if (!promptConfig) {
      return res
        .status(500)
        .json({ error: "Market summary prompt configuration not found" });
    }

    // Process message templates
    const processedMessages = Object.entries(promptConfig.messages).map(
      ([role, content]) => ({
        role,
        content: processTemplate(content, templateData),
      })
    );

    // Generate completion using OpenAI
    console.log(
      `Calling OpenAI with model: ${promptConfig.model || "gpt-4o-mini"}`
    );
    const completion = await generateCompletion(
      promptConfig.model || "gpt-4o-mini",
      processedMessages,
      {
        maxTokens: promptConfig.max_completion_tokens || 400,
      }
    );
    console.log("OpenAI response received");

    // Log completion status
    if (completion.choices && completion.choices.length > 0) {
      const messageContent = completion.choices[0].message.content;
      console.log(
        `Response content (first 100 chars): ${messageContent.substring(
          0,
          100
        )}...`
      );

      // Check if it's the fallback response
      if (messageContent.includes("Summary Not Available")) {
        console.warn("Received fallback response from OpenAI service");
      }

      // Extract content from completion
      const summary = messageContent;
      return res.json({ summary });
    } else {
      console.error("Unexpected completion format:", completion);
      return res.status(500).json({
        error: "Invalid response from AI service",
        details: "The response did not contain the expected format",
      });
    }
  } catch (error) {
    console.error("Error generating market summary:", error);
    return res.status(500).json({
      error: "Failed to generate market summary",
      message: error.message,
      stack: error.stack,
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
    console.log(`Received generate request for prompt: ${promptName}`);

    // Validate the prompt exists
    if (!prompts[promptName]) {
      console.error(`Invalid prompt name: ${promptName}`);
      return res.status(400).json({ error: "Invalid prompt name" });
    }

    const promptConfig = prompts[promptName];
    const { model, max_completion_tokens, messages } = promptConfig;
    console.log(`Using model: ${model}, max tokens: ${max_completion_tokens}`);

    // Process templates in messages
    const processedMessages = messages
      ? Object.entries(messages).map(([role, content]) => ({
          role,
          content: processTemplate(content, data),
        }))
      : [];

    // Log a sample of processed messages
    if (processedMessages.length > 0) {
      console.log(
        `First message ${
          processedMessages[0].role
        }: ${processedMessages[0].content.substring(0, 100)}...`
      );
    }

    // Generate completion using OpenAI
    console.log("Calling OpenAI service...");
    const completion = await generateCompletion(
      model || "gpt-4o-mini",
      processedMessages,
      {
        maxTokens: max_completion_tokens || 350,
        ...options,
      }
    );
    console.log("OpenAI response received");

    // Extract content from completion
    const content = completion.choices[0].message.content;
    console.log(
      `Response content (first 100 chars): ${content.substring(0, 100)}...`
    );

    return res.json({ content });
  } catch (error) {
    console.error("Error generating insights:", error);
    return res.status(500).json({
      error: "Failed to generate insights",
      message: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;
