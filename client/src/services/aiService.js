/**
 * Format the markdown response to ensure proper formatting
 * @param {string} text - The markdown text to format
 * @returns {string} - Formatted markdown text
 */
const formatMarkdown = (text) => {
  // Add line breaks after section titles (like "PERFORMANCE OVERVIEW:")
  return text.replace(/(\d+\.\s+[A-Z\s]+):(\s*)/g, "$1:\n\n");
};

/**
 * Client-side service to interact with the OpenAI-powered insights API
 */

/**
 * Generate a market summary for the dashboard by calling the server's AI insights endpoint
 *
 * @param {Object} marketData - Current market data to analyze
 * @param {string} timeframe - The timeframe (month or 'YTD')
 * @param {string} country - The country name (France, Portugal, etc.)
 * @returns {Promise<string>} - The AI-generated market summary
 */
export const generateMarketSummary = async (
  marketData,
  timeframe,
  country = "France"
) => {
  try {
    // Call the server's insights API
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
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return (
      data.summary ||
      "# Summary Not Available\n\nThe AI-powered summary service is not available at this time."
    );
  } catch (error) {
    console.error("Error generating market summary:", error);
    return "# Summary Not Available\n\nThe AI-powered summary service is not available at this time.";
  }
};
