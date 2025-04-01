require("dotenv").config();
const OpenAI = require("openai");

// Initialize the OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-testing-not-real",
});

/**
 * Generate a completion using OpenAI chat models
 * Handles parameter compatibility for different models
 * Falls back gracefully if API is not available
 *
 * @param {string} model - The OpenAI model to use
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options like max tokens
 * @returns {Promise} - The completion response
 */
async function generateCompletion(model, messages, options = {}) {
  console.log(`Calling OpenAI with model: ${model}`);

  // Check if API key is missing or is the dummy key
  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "sk-dummy-key-for-testing-not-real"
  ) {
    console.warn("OpenAI API key is missing - returning fallback response");
    return {
      choices: [
        {
          message: {
            content:
              "# Summary Not Available\n\nThe AI-powered summary service is not available at this time.",
          },
        },
      ],
    };
  }

  // Build parameters based on model compatibility
  const params = {
    model,
    messages,
    max_tokens: options.maxTokens || 1000,
    temperature: options.temperature || 0.7,
  };

  // For gpt-4o models, we must use max_completion_tokens
  // and explicitly NOT set temperature or other incompatible params
  if (model.includes("gpt-4o")) {
    if (options.maxTokens) {
      params.max_completion_tokens = options.maxTokens;
    }
    // Specifically avoiding temperature parameter for 4o models
  } else {
    // For other models that support standard parameters
    if (options.maxTokens) {
      params.max_tokens = options.maxTokens;
    }
    // Only set temperature for non-4o models if explicitly provided
    if (options.temperature !== undefined && options.temperature !== null) {
      params.temperature = options.temperature;
    }
  }

  try {
    // Log without API key for debugging
    console.log(`OpenAI API call to model: ${model}`);
    const completion = await openai.chat.completions.create(params);
    return completion;
  } catch (error) {
    console.error(`OpenAI API Error: ${error.message}`);
    return {
      choices: [
        {
          message: {
            content:
              "# Summary Not Available\n\nThe AI-powered summary service is not available at this time.",
          },
        },
      ],
    };
  }
}

module.exports = {
  generateCompletion,
};
