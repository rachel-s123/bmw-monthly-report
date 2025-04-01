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
 * Generate a market summary for the France dashboard without requiring a server call
 *
 * @param {Object} marketData - Current market data to analyze
 * @param {string} timeframe - The timeframe (month or 'YTD')
 * @returns {Promise<string>} - The generated market summary
 */
export const generateMarketSummary = async (marketData, timeframe) => {
  try {
    // Create a basic summary directly from the data
    let summary = `# ${timeframe} Data Summary\n\n`;

    // 1. Performance Overview
    summary += `## 1. PERFORMANCE OVERVIEW\n\n`;
    summary += `The France market for ${timeframe} showed total media spend of €${
      marketData.totalMediaSpend?.toLocaleString() || 0
    } with ${(marketData.totalImpressions / 1000000).toFixed(
      1
    )}M impressions, generating ${
      marketData.totalIV?.toLocaleString() || 0
    } Interacting Visits and ${
      marketData.validCpNVWRCount?.toLocaleString() || 0
    } NVWRs.\n\n`;

    // 2. Trend Analysis
    summary += `## 2. TREND ANALYSIS\n\n`;
    summary += `- CTR: ${(marketData.avgCTR * 100).toFixed(2)}%\n`;
    summary += `- CPM: €${marketData.avgCPM?.toFixed(2) || 0}\n`;
    summary += `- CPC: €${marketData.avgCPC?.toFixed(2) || 0}\n`;
    summary += `- CP IV: €${marketData.avgCPIV?.toFixed(2) || 0}\n`;
    summary += `- CP NVWR: €${marketData.avgCpNVWR?.toFixed(2) || 0}\n\n`;

    // 3. Model Performance
    summary += `## 3. MODEL PERFORMANCE\n\n`;

    const topModels = Object.entries(marketData.models || {})
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.mediaSpend - a.mediaSpend)
      .slice(0, 5);

    topModels.forEach((model, index) => {
      summary += `${index + 1}. **${model.name}**: €${
        model.mediaSpend?.toLocaleString() || 0
      } spend, ${(model.impressions / 1000).toFixed(1)}K impressions, ${
        model.clicks?.toLocaleString() || 0
      } clicks\n`;
    });

    return formatMarkdown(summary);
  } catch (error) {
    console.error("Error generating market summary:", error);
    return `# ${timeframe} Data Summary\n\nUnable to generate a complete market summary at this time. Please check the raw data.`;
  }
};
