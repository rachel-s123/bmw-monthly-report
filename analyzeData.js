const { Configuration, OpenAIApi } = require('openai');
const parseCsvFiles = require('./parseData');  // now referencing the CSV parser
const path = require('path');
const fs = require('fs');
const { REPORT_TYPES } = require('./parseData');

const EXPECTED_COLUMNS = {
    required: [
        'Week of Year',
        'Impressions',
        'CPM',
        'Clicks',
        'CTR',
        'CPC'
    ],
    mediaSpend: ['Media Spend', 'Media Cost'] // At least one of these should exist
};

function validateData(parsedData) {
    const issues = {
        missingColumns: {},
        inconsistentMediaColumn: {}
    };

    if (!parsedData || !parsedData.data) {
        return issues;
    }

    // Helper function to validate a dataset
    const validateDataset = (data, region) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            issues.missingColumns[region] = ['No data found'];
            return;
        }

        // Check required columns
        const missingColumns = EXPECTED_COLUMNS.required.filter(col => 
            !Object.keys(data[0]).includes(col)
        );

        // Check media spend columns
        const mediaColumns = EXPECTED_COLUMNS.mediaSpend.filter(col => 
            Object.keys(data[0]).includes(col)
        );

        if (missingColumns.length > 0) {
            issues.missingColumns[region] = missingColumns;
        }

        if (mediaColumns.length === 0) {
            issues.inconsistentMediaColumn[region] = 'No media spend column found';
        } else if (mediaColumns.length > 1) {
            issues.inconsistentMediaColumn[region] = `Multiple media spend columns found: ${mediaColumns.join(', ')}`;
        }
    };

    // Validate overall data
    if (parsedData.data.overall) {
        Object.entries(parsedData.data.overall).forEach(([region, data]) => {
            validateDataset(data, region);
        });
    }

    // Validate campaign-specific data
    if (parsedData.data.campaigns) {
        Object.entries(parsedData.data.campaigns).forEach(([region, modelData]) => {
            Object.entries(modelData).forEach(([model, data]) => {
                validateDataset(data, `${region}-${model}`);
            });
        });
    }

    return issues;
}

function analyzeData(parsedData) {
    if (!parsedData || !parsedData.data || !parsedData.metadata) {
        return {
            summary: {
                overall: {},
                byMarket: {},
                byModel: {},
                byChannel: {}
            },
            insights: {
                keyFindings: [],
                marketPerformance: {},
                modelPerformance: {},
                channelEfficiency: {},
                trends: {
                    weekly: {},
                    monthly: {},
                    quarterly: {}
                },
                recommendations: []
            },
            validation: validateData(parsedData)
        };
    }

    const analysis = {
        summary: {
            overall: {},
            byMarket: {},
            byModel: {},
            byChannel: {}
        },
        insights: {
            keyFindings: [],
            marketPerformance: {},
            modelPerformance: {},
            channelEfficiency: {},
            trends: {
                weekly: {},
                monthly: {},
                quarterly: {}
            },
            recommendations: []
        },
        validation: validateData(parsedData)
    };

    try {
        // Analyze overall traffic data
        if (parsedData.data.overall && Object.keys(parsedData.data.overall).length > 0) {
            analysis.summary.overall = analyzeOverallTraffic(parsedData.data.overall);
        }

        // Analyze market-specific data
        if (parsedData.metadata.markets) {
            for (const market of parsedData.metadata.markets) {
                if (market) {
                    analysis.summary.byMarket[market] = analyzeMarketPerformance(parsedData, market);
                }
            }
        }

        // Analyze model-specific data
        if (parsedData.data.byModel && Object.keys(parsedData.data.byModel).length > 0) {
            analysis.summary.byModel = analyzeModelPerformance(parsedData.data.byModel);
        }

        // Analyze channel data
        if (parsedData.data.byChannel && Object.keys(parsedData.data.byChannel).length > 0) {
            analysis.summary.byChannel = analyzeChannelPerformance(parsedData.data.byChannel);
        }

        // Generate insights
        generateInsights(analysis, parsedData);
    } catch (error) {
        console.error('Error analyzing data:', error);
    }

    return analysis;
}

function analyzeOverallTraffic(overallData) {
    const summary = {};
    for (const [market, data] of Object.entries(overallData)) {
        summary[market] = {
            totalMediaCost: sum(data, getMediaCostValue),
            totalImpressions: sum(data, 'Impressions'),
            totalClicks: sum(data, 'Clicks'),
            totalNVWR: sum(data, 'NVWR'),
            averageCPM: average(data, 'CPM'),
            averageCTR: average(data, 'CTR'),
            averageCPC: average(data, 'CPC'),
            conversionRate: calculateConversionRate(data),
            weeklyTrends: analyzeWeeklyTrends(data)
        };
    }
    return summary;
}

function analyzeMarketPerformance(parsedData, market) {
    const marketData = {
        overall: parsedData.data.overall[market] || [],
        campaigns: parsedData.data.campaigns[market] || {},
        models: parsedData.data.byModel[market] || {},
        channels: parsedData.data.byChannel[market] || []
    };

    return {
        summary: calculateMarketSummary(marketData),
        performance: analyzeMarketEfficiency(marketData),
        trends: identifyMarketTrends(marketData)
    };
}

function analyzeModelPerformance(modelData) {
    const modelSummary = {};

    // Process each market's model data
    Object.entries(modelData).forEach(([market, models]) => {
        Object.entries(models).forEach(([model, data]) => {
            if (!modelSummary[model]) {
                modelSummary[model] = {
                    totalMediaCost: 0,
                    totalImpressions: 0,
                    totalClicks: 0,
                    totalNVWR: 0,
                    markets: new Set(),
                    averageCPM: 0,
                    averageCTR: 0,
                    averageCPC: 0,
                    performance: {
                        costPerNVWR: 0,
                        conversionRate: 0
                    }
                };
            }

            // Aggregate metrics
            modelSummary[model].totalMediaCost += sum(data, getMediaCostValue);
            modelSummary[model].totalImpressions += sum(data, 'Impressions');
            modelSummary[model].totalClicks += sum(data, 'Clicks');
            modelSummary[model].totalNVWR += sum(data, 'NVWR');
            modelSummary[model].markets.add(market);

            // Calculate averages
            const marketMetrics = {
                cpm: average(data, 'CPM'),
                ctr: average(data, 'CTR'),
                cpc: average(data, 'CPC')
            };

            // Update running averages
            const marketCount = modelSummary[model].markets.size;
            modelSummary[model].averageCPM = 
                (modelSummary[model].averageCPM * (marketCount - 1) + marketMetrics.cpm) / marketCount;
            modelSummary[model].averageCTR = 
                (modelSummary[model].averageCTR * (marketCount - 1) + marketMetrics.ctr) / marketCount;
            modelSummary[model].averageCPC = 
                (modelSummary[model].averageCPC * (marketCount - 1) + marketMetrics.cpc) / marketCount;
        });
    });

    // Calculate performance metrics
    Object.values(modelSummary).forEach(model => {
        model.performance.costPerNVWR = 
            model.totalNVWR > 0 ? model.totalMediaCost / model.totalNVWR : 0;
        model.performance.conversionRate = 
            model.totalClicks > 0 ? (model.totalNVWR / model.totalClicks) * 100 : 0;
        model.markets = Array.from(model.markets); // Convert Set to Array for JSON
    });

    return modelSummary;
}

function generateInsights(analysis, parsedData) {
    const insights = analysis.insights;
    
    // Key Performance Indicators
    insights.keyFindings = [
        identifyTopPerformers(analysis.summary),
        identifyGrowthOpportunities(analysis.summary),
        identifyEfficiencyGains(analysis.summary)
    ];

    // Market-specific insights
    for (const market of parsedData.metadata.markets) {
        insights.marketPerformance[market] = {
            strengths: identifyMarketStrengths(analysis.summary.byMarket[market]),
            weaknesses: identifyMarketWeaknesses(analysis.summary.byMarket[market]),
            opportunities: suggestMarketOpportunities(analysis.summary.byMarket[market])
        };
    }

    // Generate recommendations
    insights.recommendations = generateRecommendations(analysis);
}

function identifyTopPerformers(summary) {
    const topPerformers = {
        markets: [],
        models: [],
        campaigns: [],
        channels: []
    };

    // Identify top markets by NVWR and efficiency
    if (summary.byMarket) {
        topPerformers.markets = Object.entries(summary.byMarket)
            .map(([market, data]) => ({
                market,
                nvwr: data.summary.totalNVWR,
                efficiency: data.performance.costPerNVWR
            }))
            .sort((a, b) => b.nvwr - a.nvwr)
            .slice(0, 3);
    }

    // Add similar logic for models, campaigns, and channels

    return topPerformers;
}

function generateRecommendations(analysis) {
    const recommendations = [];

    // Budget allocation recommendations
    recommendations.push({
        type: 'budget',
        suggestions: suggestBudgetAllocations(analysis)
    });

    // Channel optimization recommendations
    recommendations.push({
        type: 'channel',
        suggestions: suggestChannelOptimizations(analysis)
    });

    // Market-specific recommendations
    recommendations.push({
        type: 'market',
        suggestions: suggestMarketStrategies(analysis)
    });

    return recommendations;
}

// Utility functions
function calculateConversionRate(data) {
    const totalClicks = sum(data, 'Clicks');
    const totalNVWR = sum(data, 'NVWR');
    return totalClicks > 0 ? (totalNVWR / totalClicks) * 100 : 0;
}

function analyzeWeeklyTrends(data) {
    // Group data by week
    const weeklyData = {};
    data.forEach(row => {
        const week = row['Week of Year'];
        if (!weeklyData[week]) {
            weeklyData[week] = {
                impressions: 0,
                clicks: 0,
                mediaCost: 0,
                nvwr: 0
            };
        }
        weeklyData[week].impressions += row.Impressions || 0;
        weeklyData[week].clicks += row.Clicks || 0;
        weeklyData[week].mediaCost += getMediaCostValue(row);
        weeklyData[week].nvwr += row.NVWR || 0;
    });

    return weeklyData;
}

function getMediaCostValue(row) {
    // Try both column names
    return row['Media Spend'] || row['Media Cost'] || 0;
}

function analyzeRegion(data) {
    return {
        totalMediaCost: data.reduce((sum, row) => sum + getMediaCostValue(row), 0),
        totalImpressions: sum(data, 'Impressions'),
        totalClicks: sum(data, 'Clicks'),
        averageCPM: average(data, 'CPM'),
        averageCTR: average(data, 'CTR'),
        averageCPC: average(data, 'CPC'),
        weeklyStats: calculateWeeklyStats(data)
    };
}

function calculateWeeklyStats(data) {
    const weeklyStats = {};
    data.forEach(row => {
        const week = row['Week of Year'];
        if (!weeklyStats[week]) {
            weeklyStats[week] = {
                impressions: 0,
                clicks: 0,
                mediaCost: 0
            };
        }
        weeklyStats[week].impressions += row.Impressions || 0;
        weeklyStats[week].clicks += row.Clicks || 0;
        weeklyStats[week].mediaCost += getMediaCostValue(row);
    });
    return weeklyStats;
}

function calculateOverallSummary(regionAnalysis) {
    const summary = {
        totalMediaCost: 0,
        totalImpressions: 0,
        totalClicks: 0,
        averageCPM: 0,
        averageCTR: 0,
        averageCPC: 0
    };

    const regions = Object.values(regionAnalysis);
    if (regions.length === 0) return summary;

    summary.totalMediaCost = regions.reduce((sum, r) => sum + r.totalMediaCost, 0);
    summary.totalImpressions = regions.reduce((sum, r) => sum + r.totalImpressions, 0);
    summary.totalClicks = regions.reduce((sum, r) => sum + r.totalClicks, 0);
    summary.averageCPM = regions.reduce((sum, r) => sum + r.averageCPM, 0) / regions.length;
    summary.averageCTR = regions.reduce((sum, r) => sum + r.averageCTR, 0) / regions.length;
    summary.averageCPC = regions.reduce((sum, r) => sum + r.averageCPC, 0) / regions.length;

    return summary;
}

function analyzeTrends(data) {
    const weekly = {};
    const overall = {
        impressionsGrowth: [],
        clicksGrowth: [],
        costEfficiency: []
    };

    // Calculate weekly trends for each metric
    Object.entries(data).forEach(([region, regionData]) => {
        regionData.forEach(row => {
            const week = row['Week of Year'];
            if (!weekly[week]) {
                weekly[week] = {
                    impressions: 0,
                    clicks: 0,
                    mediaCost: 0,
                    regions: new Set()
                };
            }
            weekly[week].impressions += row.Impressions || 0;
            weekly[week].clicks += row.Clicks || 0;
            weekly[week].mediaCost += getMediaCostValue(row);
            weekly[week].regions.add(region);
        });
    });

    return { weekly, overall };
}

// Utility functions
function sum(data, field) {
    if (!data || !Array.isArray(data)) return 0;
    return data.reduce((sum, row) => {
        if (field === getMediaCostValue) {
            return sum + getMediaCostValue(row);
        }
        return sum + safeGetNumber(row[field]);
    }, 0);
}

function average(data, field) {
    if (!data || !Array.isArray(data)) return 0;
    const validValues = data.filter(row => row[field] != null && !isNaN(row[field]));
    if (validValues.length === 0) return 0;
    return sum(validValues, field) / validValues.length;
}

function calculateMarketSummary(marketData) {
    return {
        totalMediaCost: sum(marketData.overall, getMediaCostValue),
        totalImpressions: sum(marketData.overall, 'Impressions'),
        totalClicks: sum(marketData.overall, 'Clicks'),
        totalNVWR: sum(marketData.overall, 'NVWR') || 0,
        averageCPM: average(marketData.overall, 'CPM'),
        averageCTR: average(marketData.overall, 'CTR'),
        averageCPC: average(marketData.overall, 'CPC')
    };
}

function analyzeMarketEfficiency(marketData) {
    const summary = calculateMarketSummary(marketData);
    return {
        costPerNVWR: summary.totalNVWR ? summary.totalMediaCost / summary.totalNVWR : 0,
        costPerClick: summary.totalClicks ? summary.totalMediaCost / summary.totalClicks : 0,
        costPerImpression: summary.totalImpressions ? summary.totalMediaCost / summary.totalImpressions : 0,
        conversionRate: summary.totalClicks ? (summary.totalNVWR / summary.totalClicks) * 100 : 0
    };
}

function identifyMarketTrends(marketData) {
    const weeklyStats = calculateWeeklyStats(marketData.overall);
    const weeks = Object.keys(weeklyStats).sort();
    
    if (weeks.length < 2) {
        return {
            growth: 0,
            trend: 'insufficient_data',
            weeklyPerformance: weeklyStats
        };
    }

    // Calculate week-over-week changes
    const changes = weeks.slice(1).map((week, index) => {
        const currentWeek = weeklyStats[week];
        const prevWeek = weeklyStats[weeks[index]];
        
        return {
            week,
            impressionsChange: ((currentWeek.impressions - prevWeek.impressions) / prevWeek.impressions) * 100,
            clicksChange: ((currentWeek.clicks - prevWeek.clicks) / prevWeek.clicks) * 100,
            costChange: ((currentWeek.mediaCost - prevWeek.mediaCost) / prevWeek.mediaCost) * 100
        };
    });

    // Calculate average growth
    const avgGrowth = changes.reduce((sum, change) => sum + change.impressionsChange, 0) / changes.length;

    return {
        growth: avgGrowth,
        trend: avgGrowth > 5 ? 'growing' : avgGrowth < -5 ? 'declining' : 'stable',
        weeklyPerformance: weeklyStats,
        weeklyChanges: changes
    };
}

function identifyMarketStrengths(marketData) {
    if (!marketData || !marketData.summary) return [];
    
    const strengths = [];
    const { summary, performance } = marketData;

    if (performance.costPerNVWR < 100) {
        strengths.push('Efficient cost per NVWR');
    }
    if (summary.averageCTR > 1.5) {
        strengths.push('Strong click-through rate');
    }
    if (performance.conversionRate > 2) {
        strengths.push('High conversion rate');
    }

    return strengths;
}

function identifyMarketWeaknesses(marketData) {
    if (!marketData || !marketData.summary) return [];
    
    const weaknesses = [];
    const { summary, performance } = marketData;

    if (performance.costPerNVWR > 200) {
        weaknesses.push('High cost per NVWR');
    }
    if (summary.averageCTR < 0.5) {
        weaknesses.push('Low click-through rate');
    }
    if (performance.conversionRate < 0.5) {
        weaknesses.push('Low conversion rate');
    }

    return weaknesses;
}

function suggestMarketOpportunities(marketData) {
    if (!marketData || !marketData.summary) return [];
    
    const opportunities = [];
    const { summary, performance, trends } = marketData;

    if (performance.costPerNVWR > 150) {
        opportunities.push('Optimize campaigns for better NVWR efficiency');
    }
    if (summary.averageCTR < 1.0) {
        opportunities.push('Improve ad targeting and creative');
    }
    if (trends && trends.trend === 'declining') {
        opportunities.push('Investigate and address declining performance');
    }

    return opportunities;
}

function suggestBudgetAllocations(analysis) {
    const suggestions = [];
    const markets = analysis.summary.byMarket;

    if (!markets) return suggestions;

    // Find best performing markets
    const marketPerformance = Object.entries(markets)
        .map(([market, data]) => ({
            market,
            efficiency: data.performance.costPerNVWR,
            volume: data.summary.totalNVWR
        }))
        .sort((a, b) => a.efficiency - b.efficiency);

    // Suggest budget reallocation
    const topMarkets = marketPerformance.slice(0, 3);
    const bottomMarkets = marketPerformance.slice(-3);

    topMarkets.forEach(market => {
        suggestions.push(`Increase budget allocation for ${market.market} due to strong performance (€${market.efficiency.toFixed(2)} per NVWR)`);
    });

    bottomMarkets.forEach(market => {
        suggestions.push(`Review and optimize campaigns in ${market.market} to improve efficiency`);
    });

    return suggestions;
}

function suggestChannelOptimizations(analysis) {
    const suggestions = [];
    
    if (!analysis.summary.byChannel) return suggestions;

    Object.entries(analysis.summary.byChannel).forEach(([market, data]) => {
        const performance = data.performance || {};
        
        if (performance.costPerNVWR > 150) {
            suggestions.push(`Optimize channel mix in ${market} to reduce cost per NVWR`);
        }
        if (performance.conversionRate < 1) {
            suggestions.push(`Improve targeting in ${market} to increase conversion rate`);
        }
    });

    return suggestions;
}

function suggestMarketStrategies(analysis) {
    const suggestions = [];
    
    if (!analysis.summary.byMarket) return suggestions;

    Object.entries(analysis.summary.byMarket).forEach(([market, data]) => {
        const { performance, trends } = data;
        
        if (trends && trends.trend === 'declining') {
            suggestions.push(`Develop recovery strategy for ${market} to address declining performance`);
        }
        if (performance && performance.costPerNVWR > 200) {
            suggestions.push(`Review and optimize campaign efficiency in ${market}`);
        }
    });

    return suggestions;
}

function identifyGrowthOpportunities(summary) {
    const opportunities = [];
    
    if (!summary.byMarket) return opportunities;

    // Analyze market growth potential
    Object.entries(summary.byMarket).forEach(([market, data]) => {
        const { performance, trends } = data;
        
        // Check for markets with good efficiency but low volume
        if (performance.costPerNVWR < 150 && data.summary.totalNVWR < 1000) {
            opportunities.push({
                title: `Growth Potential in ${market}`,
                description: `Market shows good efficiency (€${performance.costPerNVWR.toFixed(2)} per NVWR) but low volume. Consider increasing investment.`
            });
        }

        // Check for positive trends
        if (trends && trends.trend === 'growing') {
            opportunities.push({
                title: `Capitalize on Growth in ${market}`,
                description: `Market shows positive growth trend (${trends.growth.toFixed(1)}%). Consider scaling successful campaigns.`
            });
        }
    });

    return opportunities;
}

function identifyEfficiencyGains(summary) {
    const efficiencyInsights = [];
    
    if (!summary.byMarket) return efficiencyInsights;

    // Analyze efficiency opportunities
    Object.entries(summary.byMarket).forEach(([market, data]) => {
        const { performance, summary: marketSummary } = data;
        
        // Check for high cost markets
        if (performance.costPerNVWR > 200) {
            efficiencyInsights.push({
                title: `Efficiency Opportunity in ${market}`,
                description: `High cost per NVWR (€${performance.costPerNVWR.toFixed(2)}). Review campaign targeting and creative.`
            });
        }

        // Check for low CTR
        if (marketSummary.averageCTR < 1.0) {
            efficiencyInsights.push({
                title: `CTR Optimization in ${market}`,
                description: `Low click-through rate (${marketSummary.averageCTR.toFixed(2)}%). Consider creative optimization.`
            });
        }
    });

    return efficiencyInsights;
}

// Helper function to safely get numeric values
function safeGetNumber(value) {
    if (value === undefined || value === null || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

// If run directly: node analyzeData.js 2025-03
if (require.main === module) {
  const monthFolder = process.argv[2] || '2025-03';
  analyzeData(monthFolder).then(insights => {
    console.log('=== AI Insights ===');
    console.log(insights);
  }).catch(console.error);
}

module.exports = {
    analyzeData,
    generateInsights
};
