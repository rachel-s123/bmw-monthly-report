/**
 * Format the markdown response to ensure proper formatting
 * @param {string} text - The markdown text to format
 * @returns {string} - Formatted markdown text
 */
const formatMarkdown = (text) => {
  // For narrative summaries, we want to preserve the natural text flow
  // with minimal formatting modifications
  let formattedText = text;

  // Remove any markdown formatting symbols that might interfere with readability
  formattedText = formattedText.replace(/^#+\s+/gm, ""); // Remove heading markers
  formattedText = formattedText.replace(/^\d+\.\s+/gm, ""); // Remove numbered lists

  // Ensure paragraphs have proper spacing
  formattedText = formattedText.replace(/\n{3,}/g, "\n\n");

  return formattedText;
};

/**
 * Client-side service to interact with the OpenAI-powered insights API
 */

/**
 * Generates a market summary from the provided market data.
 *
 * @param {Object} marketData - The market data containing metrics
 * @param {string} timeframe - The timeframe for the summary (e.g., "MAR-2023", "Year-to-Date")
 * @param {string} country - The country code (FR, PT, etc.)
 * @returns {Promise<string>} A markdown-formatted summary of the market data
 */
export const generateMarketSummary = async (
  marketData,
  timeframe = "current month",
  country = "FR"
) => {
  try {
    const response = await fetch("/api/insights/market-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketData,
        timeframe,
        country,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.summary || "# No market summary available";
  } catch (error) {
    console.error("Error generating market summary:", error);
    return `# Market Summary Unavailable\n\nUnable to generate market summary due to an error: ${error.message}`;
  }
};
