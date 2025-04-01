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
