const express = require('express');
const path = require('path');
const { parseMonthlyData, REPORT_TYPES } = require('./parseData');
const { analyzeData } = require('./analyzeData');

const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// API endpoint to get analyzed data
app.get('/api/data', async (req, res) => {
    try {
        console.log('Fetching data from monthly exports...');
        
        // Get the most recent month's directory
        const monthDir = path.join(__dirname, 'monthly_exports/2025-03');
        console.log('Reading from directory:', monthDir);
        
        // Parse and analyze the data
        console.log('Parsing monthly data...');
        const parsedData = await parseMonthlyData(monthDir);
        console.log('Data parsed successfully. Markets found:', Array.from(parsedData.metadata.markets));
        
        console.log('Analyzing data...');
        const analyzedData = analyzeData(parsedData);
        console.log('Data analysis complete');
        
        // Add validation warnings to the response
        const warnings = [];
        if (analyzedData.validation) {
            if (Object.keys(analyzedData.validation.missingColumns).length > 0) {
                warnings.push('Some files are missing required columns');
            }
            if (Object.keys(analyzedData.validation.inconsistentMediaColumn).length > 0) {
                warnings.push('Inconsistent media cost column names detected');
            }
        }
        
        res.json({
            success: true,
            data: analyzedData,
            warnings
        });
    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Create a simple HTML dashboard
app.get('/', (req, res) => {
    res.send(`
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
                        <h2>Key Findings</h2>
                        <div id="keyFindings"></div>
                    </div>
                </div>

                <!-- Markets Tab -->
                <div id="markets-tab" class="tab-content">
                    <div id="marketPerformance"></div>
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
                // Fetch and display data
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

                function showTab(tabName) {
                    // Hide all tabs
                    document.querySelectorAll('.tab-content').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    document.querySelectorAll('.tab').forEach(tab => {
                        tab.classList.remove('active');
                    });

                    // Show selected tab
                    document.getElementById(tabName + '-tab').classList.add('active');
                    document.querySelector(\`button[onclick="showTab('\${tabName}')"]\`).classList.add('active');
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
                    
                    metricsDiv.innerHTML = \`
                        <div class="card">
                            <div class="metric">€\${formatNumber(totals.mediaCost)}</div>
                            <div class="metric-label">Total Media Cost</div>
                        </div>
                        <div class="card">
                            <div class="metric">\${formatNumber(totals.impressions)}</div>
                            <div class="metric-label">Total Impressions</div>
                        </div>
                        <div class="card">
                            <div class="metric">\${formatNumber(totals.clicks)}</div>
                            <div class="metric-label">Total Clicks</div>
                        </div>
                        <div class="card">
                            <div class="metric">\${formatNumber(totals.nvwr)}</div>
                            <div class="metric-label">Total NVWR</div>
                        </div>
                        <div class="card">
                            <div class="metric">\${formatNumber(totals.ctr, 2)}%</div>
                            <div class="metric-label">Average CTR</div>
                        </div>
                    \`;
                }

                function displayKeyFindings(findings) {
                    if (!findings || findings.length === 0) return;
                    
                    const findingsDiv = document.getElementById('keyFindings');
                    let html = '';
                    
                    findings.forEach(finding => {
                        html += \`
                            <div class="insight-card">
                                <h3>\${finding.title || 'Finding'}</h3>
                                <p>\${finding.description || finding}</p>
                            </div>
                        \`;
                    });
                    
                    findingsDiv.innerHTML = html;
                }

                function displayMarketPerformance(marketData) {
                    if (!marketData) return;
                    
                    const marketDiv = document.getElementById('marketPerformance');
                    let html = '';
                    
                    Object.entries(marketData).forEach(([market, data]) => {
                        html += \`
                            <div class="card">
                                <h3>\${market}</h3>
                                <div class="grid">
                                    <div>
                                        <div class="metric">€\${formatNumber(data.summary.totalMediaCost)}</div>
                                        <div class="metric-label">Media Cost</div>
                                    </div>
                                    <div>
                                        <div class="metric">\${formatNumber(data.summary.totalImpressions)}</div>
                                        <div class="metric-label">Impressions</div>
                                    </div>
                                    <div>
                                        <div class="metric">\${formatNumber(data.performance.costPerNVWR, 2)}</div>
                                        <div class="metric-label">Cost per NVWR</div>
                                    </div>
                                </div>
                            </div>
                        \`;
                    });
                    
                    marketDiv.innerHTML = html;
                }

                function displayModelPerformance(modelData) {
                    if (!modelData) return;
                    
                    const modelDiv = document.getElementById('modelPerformance');
                    let html = '';
                    
                    Object.entries(modelData).forEach(([model, data]) => {
                        html += \`
                            <div class="card">
                                <h3>\${model}</h3>
                                <div class="grid">
                                    <div>
                                        <div class="metric">€\${formatNumber(data.totalMediaCost)}</div>
                                        <div class="metric-label">Media Cost</div>
                                    </div>
                                    <div>
                                        <div class="metric">\${formatNumber(data.totalImpressions)}</div>
                                        <div class="metric-label">Impressions</div>
                                    </div>
                                    <div>
                                        <div class="metric">\${formatNumber(data.averageCTR, 2)}%</div>
                                        <div class="metric-label">CTR</div>
                                    </div>
                                </div>
                            </div>
                        \`;
                    });
                    
                    modelDiv.innerHTML = html;
                }

                function displayInsights(insights) {
                    if (!insights) return;
                    
                    const strategicDiv = document.getElementById('strategicInsights');
                    const recommendationsDiv = document.getElementById('recommendations');
                    
                    // Display strategic insights
                    let strategicHtml = '';
                    if (insights.marketPerformance) {
                        Object.entries(insights.marketPerformance).forEach(([market, data]) => {
                            strategicHtml += \`
                                <div class="insight-card">
                                    <h3>\${market}</h3>
                                    <p><strong>Strengths:</strong> \${data.strengths.join(', ')}</p>
                                    <p><strong>Opportunities:</strong> \${data.opportunities.join(', ')}</p>
                                </div>
                            \`;
                        });
                    }
                    strategicDiv.innerHTML = strategicHtml;
                    
                    // Display recommendations
                    let recsHtml = '';
                    if (insights.recommendations) {
                        insights.recommendations.forEach(rec => {
                            recsHtml += \`
                                <div class="insight-card">
                                    <h3>\${rec.type}</h3>
                                    <ul>
                                        \${rec.suggestions.map(s => \`<li>\${s}</li>\`).join('')}
                                    </ul>
                                </div>
                            \`;
                        });
                    }
                    recommendationsDiv.innerHTML = recsHtml;
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
                            warnings.push(\`\${region}: Missing columns - \${columns.join(', ')}\`);
                        });
                    }
                    
                    // Check for inconsistent media columns
                    if (Object.keys(validation.inconsistentMediaColumn).length > 0) {
                        Object.entries(validation.inconsistentMediaColumn).forEach(([region, message]) => {
                            warnings.push(\`\${region}: \${message}\`);
                        });
                    }
                    
                    if (warnings.length > 0) {
                        contentDiv.innerHTML = warnings.map(w => \`<div>\${w}</div>\`).join('');
                        warningsDiv.style.display = 'block';
                    } else {
                        warningsDiv.style.display = 'none';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Start the server
app.listen(port, () => {
    console.log(`Dashboard server running at http://localhost:${port}`);
}).on('error', (err) => {
    console.error('Server error:', err);
});
