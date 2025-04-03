require("dotenv").config();
const OpenAI = require("openai");

// Initialize the OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-testing-not-real",
});

console.log(
  "OpenAI service initialized with API key:",
  process.env.OPENAI_API_KEY
    ? `${process.env.OPENAI_API_KEY.substring(0, 8)}...`
    : "Missing or using dummy key"
);

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
    console.warn(
      "OpenAI API key is missing or using dummy key - returning fallback response"
    );
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

  // Validate messages format
  if (!Array.isArray(messages) || messages.length === 0) {
    console.error("Invalid messages format:", messages);
    throw new Error("Messages must be a non-empty array");
  }

  // Check that each message has role and content
  const invalidMessages = messages.filter(
    (msg) => !msg.role || !msg.content || typeof msg.content !== "string"
  );
  if (invalidMessages.length > 0) {
    console.error("Invalid message format detected:", invalidMessages);
    throw new Error("Each message must have a role and content string");
  }

  // Build parameters based on model compatibility
  const params = {
    model,
    messages,
  };

  // For gpt-4o models, we should also use max_tokens
  if (model.includes("gpt-4o")) {
    if (options.maxTokens) {
      params.max_tokens = options.maxTokens; // This is correct - use max_tokens for all models
      console.log(`Set max_tokens=${options.maxTokens} for ${model}`);
    }

    // No temperature for gpt-4o models unless explicitly set
    if (options.temperature !== undefined && options.temperature !== null) {
      params.temperature = options.temperature;
      console.log(`Set temperature=${options.temperature} for ${model}`);
    }
  } else {
    // For other models that support standard parameters
    if (options.maxTokens) {
      params.max_tokens = options.maxTokens;
      console.log(`Set max_tokens=${options.maxTokens} for ${model}`);
    }

    // Only set temperature for non-4o models if explicitly provided
    if (options.temperature !== undefined && options.temperature !== null) {
      params.temperature = options.temperature;
      console.log(`Set temperature=${options.temperature} for ${model}`);
    } else {
      // Default temperature
      params.temperature = 0.7;
      console.log(`Using default temperature=0.7 for ${model}`);
    }
  }

  console.log(
    "Final OpenAI params:",
    JSON.stringify(
      params,
      (key, value) => {
        // Truncate message content in logs to avoid huge output
        if (
          key === "content" &&
          typeof value === "string" &&
          value.length > 100
        ) {
          return value.substring(0, 100) + "...";
        }
        return value;
      },
      2
    )
  );

  try {
    // Make the API call
    console.log(`Making OpenAI API call to ${model}...`);
    const completion = await openai.chat.completions.create(params);
    console.log("OpenAI API call successful");

    // Log basic response info
    if (completion.choices && completion.choices.length > 0) {
      const contentPreview = completion.choices[0].message.content.substring(
        0,
        50
      );
      console.log(
        `Response received with ${completion.choices.length} choices. First choice: "${contentPreview}..."`
      );
    } else {
      console.warn("OpenAI response has unexpected format:", completion);
    }

    return completion;
  } catch (error) {
    console.error(`OpenAI API Error: ${error.message}`);
    console.error("Error details:", error);

    // Handle common error cases
    if (error.status === 401) {
      console.error("Authentication error - check your API key");
    } else if (error.status === 429) {
      console.error("Rate limit exceeded - consider implementing retries");
    } else if (error.status === 400) {
      console.error("Bad request - check model name and parameters");
    }

    // Return a fallback response
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
