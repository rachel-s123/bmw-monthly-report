require("dotenv").config();
const express = require("express");
const path = require("path");
const { parseMonthlyData, REPORT_TYPES } = require("./parseData");
const { analyzeData } = require("./analyzeData");

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static("public"));

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// API endpoint to get analyzed data
app.get("/api/data", async (req, res) => {
  try {
    console.log("Fetching data from monthly exports...");

    // Get the most recent month's directory
    const monthDir = path.join(__dirname, "monthly_exports/2025-03");
    console.log("Reading from directory:", monthDir);

    // Parse and analyze the data
    console.log("Parsing monthly data...");
    const parsedData = await parseMonthlyData(monthDir);
    console.log(
      "Data parsed successfully. Markets found:",
      Array.from(parsedData.metadata.markets)
    );

    console.log("Analyzing data...");
    const analyzedData = analyzeData(parsedData);
    console.log("Data analysis complete");

    // Add validation warnings to the response
    const warnings = [];
    if (analyzedData.validation) {
      if (Object.keys(analyzedData.validation.missingColumns).length > 0) {
        warnings.push("Some files are missing required columns");
      }
      if (
        Object.keys(analyzedData.validation.inconsistentMediaColumn).length > 0
      ) {
        warnings.push("Inconsistent media cost column names detected");
      }
    }

    res.json({
      success: true,
      data: analyzedData,
      warnings,
    });
  } catch (error) {
    console.error("Error processing data:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Add endpoint to refresh AI insights
app.get("/api/refresh-insights", async (req, res) => {
  try {
    console.log("Refreshing AI insights...");

    // Get the most recent month's directory
    const monthDir = path.join(__dirname, "monthly_exports/2025-03");

    // Parse the data
    const parsedData = await parseMonthlyData(monthDir);

    // Generate fresh insights using all updated prompts
    const { generateAIInsights, analyzeData } = require("./analyzeData");

    // Create summary data for the prompts
    const analysis = analyzeData(parsedData);

    // Prepare trend data specifically for trend analysis
    const trendData = {
      markets: [],
      weeklyTrends: {},
      growthCalculation: {
        method: "Week over week percentage change in impressions",
        formula:
          "(current_week_impressions - previous_week_impressions) / previous_week_impressions * 100",
      },
    };

    // Extract weekly trends for top markets
    if (analysis.summary.byMarket) {
      // Get top 5 markets by performance
      const topMarkets = Object.entries(analysis.summary.byMarket)
        .map(([market, data]) => ({
          market,
          efficiency: data.performance?.costPerNVWR || 999999,
          data,
        }))
        .sort((a, b) => a.efficiency - b.efficiency)
        .slice(0, 5);

      // Add to trend data
      trendData.markets = topMarkets.map((m) => ({
        market: m.market,
        efficiency: m.efficiency,
        totalMediaCost: m.data.summary?.totalMediaCost || 0,
        totalImpressions: m.data.summary?.totalImpressions || 0,
        totalClicks: m.data.summary?.totalClicks || 0,
        averageCTR: m.data.summary?.averageCTR || 0,
        weeklyGrowth: m.data.trends?.growth || 0,
        trendDirection: m.data.trends?.trend || "stable",
      }));

      // Extract weekly performance for these markets
      topMarkets.forEach((market) => {
        if (market.data.trends && market.data.trends.weeklyPerformance) {
          trendData.weeklyTrends[market.market] =
            market.data.trends.weeklyPerformance;
        }
      });
    }

    // Prepare market data for recommendations
    const marketData = {
      markets: Object.entries(analysis.summary.byMarket || {}).map(
        ([market, data]) => ({
          market,
          efficiency: data.performance?.costPerNVWR || 0,
          conversionRate: data.performance?.conversionRate || 0,
          totalMediaCost: data.summary?.totalMediaCost || 0,
          totalImpressions: data.summary?.totalImpressions || 0,
          totalClicks: data.summary?.totalClicks || 0,
          averageCTR: data.summary?.averageCTR || 0,
          trend: data.trends?.trend || "stable",
        })
      ),
    };

    // Run all three prompts
    const [generalInsights, marketRecommendations, trendAnalysis] =
      await Promise.all([
        generateAIInsights(analysis, parsedData),
        generateMarketRecommendations(marketData),
        generateTrendAnalysis(trendData),
      ]);

    res.json({
      success: true,
      insights: [
        ...(generalInsights || []),
        ...(marketRecommendations || []),
        ...(trendAnalysis || []),
      ],
    });
  } catch (error) {
    console.error("Error refreshing insights:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Create a simple HTML dashboard
app.get("/", (req, res) => {
  res.send(
    `
        <!DOCTYPE html>
        <html>
        <head>
            <title>BMW Marketing Dashboard</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0;
                    background-color: #f5f5f5;
                }
                .container { 
                    max-width: 1400px; 
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #fff;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }
                .card { 
                    background-color: #fff;
                    border: 1px solid #ddd; 
                    padding: 20px; 
                    margin: 10px 0; 
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }
                .warning {
                    background-color: #fff3cd;
                    color: #856404;
                    border-color: #ffeeba;
                    padding: 12px;
                    margin: 10px 0;
                    border-radius: 4px;
                    display: none;
                }
                .warning-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                .insights-section {
                    margin-top: 20px;
                }
                .insight-card {
                    background-color: #f8f9fa;
                    border-left: 4px solid #007bff;
                    padding: 15px;
                    margin-bottom: 10px;
                }
                .metric {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                }
                .metric-label {
                    font-size: 14px;
                    color: #6c757d;
                }
                .tab-container {
                    margin-bottom: 20px;
                }
                .tab {
                    padding: 10px 20px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 16px;
                    color: #6c757d;
                }
                .tab.active {
                    color: #007bff;
                    border-bottom: 2px solid #007bff;
                }
                .tab-content {
                    display: none;
                }
                .tab-content.active {
                    display: block;
                }
                .refresh-button {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 6px 12px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-left: 10px;
                }
                .refresh-button:hover {
                    background-color: #0056b3;
                }
                .refresh-button:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
                .markdown-content {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                }
                .markdown-content h1 {
                    font-size: 2em;
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                    color: #333;
                }
                .markdown-content h2 {
                    font-size: 1.6em;
                    margin-top: 0.8em;
                    margin-bottom: 0.4em;
                    color: #444;
                }
                .markdown-content h3 {
                    font-size: 1.3em;
                    margin-top: 0.6em;
                    margin-bottom: 0.3em;
                    color: #555;
                }
                .markdown-content p {
                    margin-bottom: 1em;
                }
                .markdown-content ul, .markdown-content ol {
                    padding-left: 2em;
                    margin-bottom: 1em;
                }
                .markdown-content table {
                    border-collapse: collapse;
                    width: 100%;
                    margin-bottom: 1em;
                }
                .markdown-content table, .markdown-content th, .markdown-content td {
                    border: 1px solid #ddd;
                }
                .markdown-content th, .markdown-content td {
                    padding: 8px;
                    text-align: left;
                }
                .markdown-content th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                }
                .markdown-content code {
                    background-color: #f5f5f5;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: monospace;
                }
                .markdown-content pre {
                    background-color: #f5f5f5;
                    padding: 10px;
                    border-radius: 5px;
                    overflow-x: auto;
                    margin-bottom: 1em;
                }
                .markdown-content blockquote {
                    border-left: 4px solid #ddd;
                    padding-left: 10px;
                    margin-left: 0;
                    color: #666;
                }
                .market-tabs {
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }
                .market-tab {
                    padding: 8px 16px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-size: 14px;
                    color: #6c757d;
                }
                .market-tab.active {
                    color: #007bff;
                    border-bottom: 2px solid #007bff;
                }
                .market-content {
                    display: none;
                }
                .market-content.active {
                    display: block;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .data-table th, .data-table td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                .data-table th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                }
                .metric-card {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>BMW Marketing Dashboard</h1>
                <div id="period"></div>
            </div>
            
            <div class="container">
                <!-- Data Validation Warnings -->
                <div id="validationWarnings" class="warning">
                    <div class="warning-title">Data Validation Warnings</div>
                    <div id="validationContent"></div>
                </div>

                <!-- Navigation Tabs -->
                <div class="tab-container">
                    <button class="tab active" onclick="showTab('overview')">Overview</button>
                    <button class="tab" onclick="showTab('markets')">Markets</button>
                    <button class="tab" onclick="showTab('models')">Models</button>
                    <button class="tab" onclick="showTab('campaigns')">Campaigns</button>
                    <button class="tab" onclick="showTab('insights')">Insights</button>
                </div>

                <!-- Overview Tab -->
                <div id="overview-tab" class="tab-content active">
                    <div class="card">
                        <h2>Overall Performance</h2>
                        <div id="overallMetrics" class="grid"></div>
                    </div>
                    <div class="card">
                        <h2>Key Findings <button id="refreshInsights" class="refresh-button">Refresh</button></h2>
                        <div id="keyFindings"></div>
                    </div>
                </div>

                <!-- Markets Tab -->
                <div id="markets-tab" class="tab-content">
                    <div class="tab-container market-tabs">
                        <button class="market-tab active" onclick="showMarketTab('all')">All Markets</button>
                        <button class="market-tab" onclick="showMarketTab('fr')">France</button>
                        <button class="market-tab" onclick="showMarketTab('belux')">BELUX</button>
                        <button class="market-tab" onclick="showMarketTab('uk')">UK</button>
                    </div>
                    
                    <div id="market-all" class="market-content active">
                        <div id="marketPerformance"></div>
                    </div>
                    
                    <div id="market-fr" class="market-content">
                        <div class="card">
                            <h2>France Market Analysis</h2>
                            <div class="market-summary">
                                <div class="grid">
                                    <div class="metric-card">
                                        <div class="metric">€104,927</div>
                                        <div class="metric-label">Total Media Spend</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric">5.03M</div>
                                        <div class="metric-label">Total Impressions</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric">281.4K</div>
                                        <div class="metric-label">Total Clicks</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric">2,854</div>
                                        <div class="metric-label">Total NVWRs</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <h2>Top Performing Models</h2>
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Model</th>
                                        <th>Media Spend</th>
                                        <th>Impressions</th>
                                        <th>NVWRs</th>
                                        <th>Cost per NVWR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>NOT MAPPED</td>
                                        <td>€481.60</td>
                                        <td>10,047</td>
                                        <td>1,979</td>
                                        <td>€0.24</td>
                                    </tr>
                                    <tr>
                                        <td>Brand</td>
                                        <td>€10,455.71</td>
                                        <td>772,740</td>
                                        <td>326</td>
                                        <td>€32.07</td>
                                    </tr>
                                    <tr>
                                        <td>Generic</td>
                                        <td>€3,738.76</td>
                                        <td>49,799</td>
                                        <td>115</td>
                                        <td>€32.51</td>
                                    </tr>
                                    <tr>
                                        <td>F 900 R (K83)</td>
                                        <td>€4,632.96</td>
                                        <td>1,064,205</td>
                                        <td>89</td>
                                        <td>€52.06</td>
                                    </tr>
                                    <tr>
                                        <td>F 900 XR (K84)</td>
                                        <td>€3,216.73</td>
                                        <td>601,633</td>
                                        <td>89</td>
                                        <td>€36.14</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="card">
                            <h2>Cost Efficiency Analysis</h2>
                            <div class="insight-card">
                                <h3>Most Cost-Efficient Models</h3>
                                <ul>
                                    <li><strong>NOT MAPPED</strong>: €0.24 per NVWR (1,979 NVWRs)</li>
                                    <li><strong>R 1300 GS Adventure</strong>: €12.07 per NVWR (10 NVWRs)</li>
                                    <li><strong>S 1000 R</strong>: €14.70 per NVWR (27 NVWRs)</li>
                                    <li><strong>S 1000 RR</strong>: €15.55 per NVWR (15 NVWRs)</li>
                                    <li><strong>CE 04</strong>: €20.58 per NVWR (48 NVWRs)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div id="market-belux" class="market-content">
                        <div class="card">
                            <h2>BELUX Market Analysis</h2>
                            <p>Data analysis not available yet</p>
                        </div>
                    </div>
                    
                    <div id="market-uk" class="market-content">
                        <div class="card">
                            <h2>UK Market Analysis</h2>
                            <p>Data analysis not available yet</p>
                        </div>
                    </div>
                </div>

                <!-- Models Tab -->
                <div id="models-tab" class="tab-content">
                    <div id="modelPerformance"></div>
                </div>

                <!-- Campaigns Tab -->
                <div id="campaigns-tab" class="tab-content">
                    <div id="campaignPerformance"></div>
                </div>

                <!-- Insights Tab -->
                <div id="insights-tab" class="tab-content">
                    <div class="card">
                        <h2>Strategic Insights</h2>
                        <div id="strategicInsights"></div>
                    </div>
                    <div class="card">
                        <h2>Recommendations</h2>
                        <div id="recommendations"></div>
                    </div>
                </div>
            </div>

            <script>
                // Fetch initial data
                fetchData();

                // Function to fetch and display data
                function fetchData() {
                    fetch('/api/data')
                        .then(response => response.json())
                        .then(result => {
                            if (result.success) {
                                displayData(result.data);
                                displayValidationWarnings(result.data.validation);
                            } else {
                                console.error('Error fetching data:', result.error);
                                alert('Error loading dashboard data. Please check the console for details.');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error loading dashboard data. Please check the console for details.');
                        });
                }

                function displayData(data) {
                    // Display overall metrics
                    displayOverallMetrics(data.summary.overall);
                    
                    // Display key findings
                    displayKeyFindings(data.insights.keyFindings);
                    
                    // Display market performance
                    displayMarketPerformance(data.summary.byMarket);
                    
                    // Display model performance
                    displayModelPerformance(data.summary.byModel);
                    
                    // Display insights
                    displayInsights(data.insights);
                }

                function displayOverallMetrics(overall) {
                    const metricsDiv = document.getElementById('overallMetrics');
                    const totals = calculateTotals(overall);
                    
                    metricsDiv.innerHTML = `
                        <div class="card">
                            <div class="metric">€${formatNumber(totals.mediaCost)}</div>
                            <div class="metric-label">Total Media Cost</div>
                        </div>
                        <div class="card">
                            <div class="metric">${formatNumber(totals.impressions)}</div>
                            <div class="metric-label">Total Impressions</div>
                        </div>
                        <div class="card">
                            <div class="metric">${formatNumber(totals.clicks)}</div>
                            <div class="metric-label">Total Clicks</div>
                        </div>
                        <div class="card">
                            <div class="metric">${formatNumber(totals.nvwr)}</div>
                            <div class="metric-label">Total NVWR</div>
                        </div>
                        <div class="card">
                            <div class="metric">${formatNumber(totals.ctr, 2)}%</div>
                            <div class="metric-label">Average CTR</div>
                        </div>
                    `;
                }

                function displayKeyFindings(findings) {
                    if (!findings || findings.length === 0) return;
                    
                    const findingsDiv = document.getElementById('keyFindings');
                    let html = '';
                    
                    findings.forEach(finding => {
                        html += `
                            <div class="insight-card">
                                <h3>${finding.title || 'Finding'}</h3>
                                <p>${finding.description || finding}</p>
                            </div>
                        `;
                    });
                    
                    findingsDiv.innerHTML = html;
                }

                function displayMarketPerformance(marketData) {
                    if (!marketData) return;
                    
                    const marketDiv = document.getElementById('marketPerformance');
                    let html = '';
                    
                    Object.entries(marketData).forEach(([market, data]) => {
                        html += `
                            <div class="card">
                                <h3>${market}</h3>
                                <div class="grid">
                                    <div>
                                        <div class="metric">€${formatNumber(data.summary.totalMediaCost)}</div>
                                        <div class="metric-label">Media Cost</div>
                                    </div>
                                    <div>
                                        <div class="metric">${formatNumber(data.summary.totalImpressions)}</div>
                                        <div class="metric-label">Impressions</div>
                                    </div>
                                    <div>
                                        <div class="metric">${formatNumber(data.performance.costPerNVWR, 2)}</div>
                                        <div class="metric-label">Cost per NVWR</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    marketDiv.innerHTML = html;
                }

                function displayModelPerformance(modelData) {
                    if (!modelData) return;
                    
                    const modelDiv = document.getElementById('modelPerformance');
                    let html = '';
                    
                    Object.entries(modelData).forEach(([model, data]) => {
                        html += `
                            <div class="card">
                                <h3>${model}</h3>
                                <div class="grid">
                                    <div>
                                        <div class="metric">€${formatNumber(data.totalMediaCost)}</div>
                                        <div class="metric-label">Media Cost</div>
                                    </div>
                                    <div>
                                        <div class="metric">${formatNumber(data.totalImpressions)}</div>
                                        <div class="metric-label">Impressions</div>
                                    </div>
                                    <div>
                                        <div class="metric">${formatNumber(data.averageCTR, 2)}%</div>
                                        <div class="metric-label">CTR</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    modelDiv.innerHTML = html;
                }

                function displayInsights(insights) {
                    if (!insights) return;
                    
                    const strategicDiv = document.getElementById('strategicInsights');
                    
                    // Display strategic insights
                    let strategicHtml = '';
                    if (insights.marketPerformance) {
                        Object.entries(insights.marketPerformance).forEach(([market, data]) => {
                            strategicHtml += `
                                <div class="insight-card">
                                    <h3>${market}</h3>
                                    <p><strong>Strengths:</strong> ${data.strengths ? data.strengths.join(', ') : 'None'}</p>
                                    <p><strong>Opportunities:</strong> ${data.opportunities ? data.opportunities.join(', ') : 'None'}</p>
                                </div>
                            `;
                        });
                    }
                    if (strategicDiv) {
                        strategicDiv.innerHTML = strategicHtml;
                    }
                }

                function formatNumber(value, decimals = 0) {
                    if (typeof value !== 'number') return '0';
                    return value.toLocaleString('en-US', {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    });
                }

                function calculateTotals(overall) {
                    return Object.values(overall).reduce((totals, market) => ({
                        mediaCost: totals.mediaCost + (market.totalMediaCost || 0),
                        impressions: totals.impressions + (market.totalImpressions || 0),
                        clicks: totals.clicks + (market.totalClicks || 0),
                        nvwr: totals.nvwr + (market.totalNVWR || 0),
                        ctr: totals.ctr + (market.averageCTR || 0)
                    }), {
                        mediaCost: 0,
                        impressions: 0,
                        clicks: 0,
                        nvwr: 0,
                        ctr: 0
                    });
                }

                function displayValidationWarnings(validation) {
                    const warningsDiv = document.getElementById('validationWarnings');
                    const contentDiv = document.getElementById('validationContent');
                    
                    if (!validation) return;
                    
                    const warnings = [];
                    
                    // Check for missing columns
                    if (Object.keys(validation.missingColumns).length > 0) {
                        Object.entries(validation.missingColumns).forEach(([region, columns]) => {
                            warnings.push(`${region}: Missing columns - ${columns.join(', ')}`);
                        });
                    }
                    
                    // Check for inconsistent media columns
                    if (Object.keys(validation.inconsistentMediaColumn).length > 0) {
                        Object.entries(validation.inconsistentMediaColumn).forEach(([region, message]) => {
                            warnings.push(`${region}: ${message}`);
                        });
                    }
                    
                    if (warnings.length > 0) {
                        contentDiv.innerHTML = warnings.map(w => `<div>${w}</div>`).join('');
                        warningsDiv.style.display = 'block';
                    } else {
                        warningsDiv.style.display = 'none';
                    }
                }

                // Simple function to convert markdown to HTML
                function markdownToHtml(markdown) {
                    if (!markdown) return '';
                    
                    // Handle headers
                    let html = markdown
                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                        .replace(/^# (.*$)/gm, '<h1>$1</h1>');
                    
                    // Handle tables
                    const tableRegex = /\|(.+)\|/g;
                    const tableHeaderRegex = /\|[\s:-]+\|/g;
                    
                    if (tableRegex.test(html) && tableHeaderRegex.test(html)) {
                        // Find table headers and rows
                        const lines = html.split('\n');
                        let inTable = false;
                        let tableHtml = '<table>';
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            
                            if (line.match(tableRegex)) {
                                if (!inTable) {
                                    inTable = true;
                                    // Table header
                                    const headerCells = line.split('|').filter(cell => cell.trim() !== '');
                                    tableHtml += '<tr>';
                                    headerCells.forEach(cell => tableHtml += '<th>' + cell.trim() + '</th>');
                                    tableHtml += '</tr>';
                                    
                                    // Skip the separator line
                                    i++;
                                } else {
                                    // Table row
                                    const cells = line.split('|').filter(cell => cell.trim() !== '');
                                    tableHtml += '<tr>';
                                    cells.forEach(cell => tableHtml += '<td>' + cell.trim() + '</td>');
                                    tableHtml += '</tr>';
                                }
                            } else if (inTable) {
                                inTable = false;
                                tableHtml += '</table>';
                                lines[i] = tableHtml + line;
                                tableHtml = '<table>';
                            }
                        }
                        
                        if (inTable) {
                            tableHtml += '</table>';
                            lines.push(tableHtml);
                        }
                        
                        html = lines.join('\n');
                    }
                    
                    // Handle lists
                    html = html
                        .replace(/^\s*\*\s(.*$)/gm, '<li>$1</li>')
                        .replace(/^\s*\d+\.\s(.*$)/gm, '<li>$1</li>');
                    
                    // Wrap lists in ul/ol tags
                    html = html
                        .replace(/(<li>.*?<\/li>)\n\n/gs, '<ul>$1</ul>\n\n')
                        .replace(/(<li>.*?<\/li>)$/gs, '<ul>$1</ul>');
                    
                    // Handle paragraphs
                    html = html
                        .replace(/^\n+|\n+$/g, '')
                        .replace(/\n{2,}/g, '</p><p>')
                        .replace(/\n/g, '<br>');
                    
                    // Handle inline styles
                    html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
                    html = html.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');
                    html = html.replace(/\u0060([\s\S]*?)\u0060/g, '<code>$1</code>');
                    
                    // Wrap in paragraphs if not already done
                    if (!html.startsWith('<h') && !html.startsWith('<p')) {
                        html = '<p>' + html + '</p>';
                    }
                    
                    return html;
                }

                // Handle refresh button click
                document.getElementById('refreshInsights').addEventListener('click', function() {
                    const button = this;
                    button.disabled = true;
                    button.textContent = 'Refreshing...';
                    
                    fetch('/api/refresh-insights')
                        .then(response => response.json())
                        .then(result => {
                            if (result.success && result.insights) {
                                // Clear existing insights and display new ones
                                const findingsDiv = document.getElementById('keyFindings');
                                let html = '';
                                
                                result.insights.forEach(finding => {
                                    html += '<div class="insight-card">' +
                                        '<h3>' + (finding.title || 'Finding') + '</h3>' +
                                        '<div class="markdown-content">' + markdownToHtml(finding.description || finding) + '</div>' +
                                        '</div>';
                                });
                                
                                findingsDiv.innerHTML = html;
                                button.textContent = 'Refresh';
                                button.disabled = false;
                            } else {
                                console.error('Error refreshing insights:', result.error);
                                button.textContent = 'Refresh Failed';
                                setTimeout(() => {
                                    button.textContent = 'Refresh';
                                    button.disabled = false;
                                }, 3000);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            button.textContent = 'Refresh Failed';
                            setTimeout(() => {
                                button.textContent = 'Refresh';
                                button.disabled = false;
                            }, 3000);
                        });
                });

                // Function to switch tabs
                function showTab(tabName) {
                    // Hide all tab contents
                    document.querySelectorAll('.tab-content').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    
                    // Remove active class from all tabs
                    document.querySelectorAll('.tab').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    
                    // Show the selected tab content
                    document.getElementById(tabName + '-tab').classList.add('active');
                    
                    // Add active class to the clicked tab
                    document.querySelector(`.tab[
      (onclick *= "${tabName}")
    ]`).classList.add('active');
                }

                // Function to switch market tabs
                function showMarketTab(marketName) {
                    // Hide all market contents
                    document.querySelectorAll('.market-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // Remove active class from all market tabs
                    document.querySelectorAll('.market-tab').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    
                    // Show the selected market content
                    document.getElementById('market-' + marketName).classList.add('active');
                    
                    // Add active class to the clicked market tab
                    document.querySelector(`.market -
      tab[(onclick *= "${marketName}")]`).classList.add('active');
                }
            </script>
        </body>
        </html>
    `
  );
});

// Start the server
app
  .listen(port, () => {
    console.log(`Dashboard server running at http://localhost:${port}`);
  })
  .on("error", (err) => {
    console.error("Server error:", err);
  });
