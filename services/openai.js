require("dotenv").config();
const OpenAI = require("openai");

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a completion using OpenAI chat models
 * Handles parameter compatibility for different models
 *
 * @param {string} model - The OpenAI model to use
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options like max tokens
 * @returns {Promise} - The completion response
 */
async function generateCompletion(model, messages, options = {}) {
  console.log(`Calling OpenAI with model: ${model}`);

  // Build parameters based on model compatibility
  const params = {
    model,
    messages,
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
    console.log("OpenAI API parameters:", JSON.stringify(params));
    const completion = await openai.chat.completions.create(params);
    return completion;
  } catch (error) {
    console.error(`OpenAI API Error for ${model}:`, error.message);
    // Don't throw the error - return a fallback response
    return {
      choices: [
        {
          message: {
            content: `Error generating AI content. Please try again. (Error: ${error.message})`,
          },
        },
      ],
    };
  }
}

module.exports = {
  generateCompletion,
};
