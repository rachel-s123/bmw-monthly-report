/**
 * Data Quality Scoring System
 * Measures how well the sum of filtered dimension data matches the total "All" data
 * Identifies gaps in data completeness (missing records) only
 * Note: Data quality issues like "NOT MAPPED" values are handled separately in Onebuilder compliance
 */

// Core metrics to compare for data quality
const CORE_METRICS = ['Media Cost', 'Impressions', 'Clicks', 'IV', 'NVWR'];

// Weights for weighted average calculation
const METRIC_WEIGHTS = {
  'Media Cost': 0.25,
  'Impressions': 0.20,
  'Clicks': 0.15,
  'IV': 0.20,
  'NVWR': 0.20
};

/**
 * Sum dimension data for a specific metric with optional predicate
 */
const sumDimensionData = (dimensionData, metric, predicate = null) => {
  return dimensionData.reduce((sum, row) => {
    const value = parseFloat(row[metric]) || 0;
    const rowValue = row[metric];
    
    // If predicate is provided, only sum rows that match the condition
    if (predicate && !predicate(rowValue)) {
      return sum;
    }
    
    return sum + value;
  }, 0);
};

/**
 * Calculate coverage and mapping gaps for a single metric
 */
const calculateMetricGaps = (allData, dimensionData, metric) => {
  const allTotal = parseFloat(allData[metric]) || 0;
  
  if (allTotal === 0) {
    return {
      coverageGap: 0,
      mappingGap: 0,
      coverage: 100,
      mappedSum: 0,
      unmappedSum: 0,
      missingValue: 0
    };
  }
  
  // Calculate total dimension data (including all values, regardless of mapping status)
  const dimensionTotal = sumDimensionData(dimensionData, metric);
  
  // Calculate coverage gap (missing data - records that exist in "All" but not in dimension files)
  const coverageGap = 100 - (dimensionTotal / allTotal) * 100;
  
  // For dimension coverage, we don't distinguish between mapped and unmapped
  // All dimension data is considered "mapped" for coverage purposes
  const mappedSum = dimensionTotal;
  const unmappedSum = 0; // No unmapped concept in pure dimension coverage
  
  return {
    coverageGap: Math.round(coverageGap * 100) / 100,
    mappingGap: 0, // No mapping gap in pure dimension coverage
    coverage: Math.round((dimensionTotal / allTotal) * 100 * 100) / 100,
    mappedSum: Math.round(mappedSum * 100) / 100,
    unmappedSum: 0,
    missingValue: Math.round(allTotal * (coverageGap / 100) * 100) / 100
  };
};

/**
 * Calculate discrepancy analysis for all metrics
 */
const calculateDiscrepancies = (allData, dimensionData) => {
  return CORE_METRICS.map(metric => {
    const gaps = calculateMetricGaps(allData, dimensionData, metric);
    const totalGap = gaps.coverageGap; // Only coverage gap in pure dimension coverage
    
    return {
      metric,
      coverage: gaps.coverage,
      coverageGap: gaps.coverageGap,
      mappingGap: 0, // No mapping gap in pure dimension coverage
      totalGap: Math.round(totalGap * 100) / 100,
      missingValue: gaps.missingValue,
      mappedSum: gaps.mappedSum,
      unmappedSum: 0, // No unmapped concept in pure dimension coverage
      severity: totalGap > 20 ? 'CRITICAL' : totalGap > 10 ? 'WARNING' : 'OK'
    };
  });
};

/**
 * Calculate overall quality score using weighted average of coverage gaps
 */
const calculateWeightedScore = (discrepancies) => {
  return CORE_METRICS.reduce((acc, metric, index) => {
    const discrepancy = discrepancies[index];
    const weight = METRIC_WEIGHTS[metric];
    
    // Calculate score based on coverage only (no mapping gap in pure dimension coverage)
    const coverageScore = 100 - discrepancy.coverageGap;
    
    return acc + (coverageScore * weight);
  }, 0);
};

/**
 * Get quality grade based on score
 */
const getQualityGrade = (score) => {
  if (score >= 95) return { grade: 'A+', color: 'green', status: 'Excellent' };
  if (score >= 90) return { grade: 'A', color: 'green', status: 'Good' };
  if (score >= 80) return { grade: 'B', color: 'yellow', status: 'Acceptable' };
  if (score >= 70) return { grade: 'C', color: 'orange', status: 'Needs Attention' };
  if (score >= 60) return { grade: 'D', color: 'red', status: 'Poor' };
  return { grade: 'F', color: 'darkred', status: 'Critical' };
};

/**
 * Identify missing items by comparing dimension data with "All" data
 */
const identifyDataGaps = (allData, dimensionData, dimension) => {
  const allTotal = parseFloat(allData['Media Cost']) || 0;
  const gaps = calculateMetricGaps(allData, dimensionData, 'Media Cost');
  
  // Estimate counts based on average values
  const avgDimensionValue = dimensionData.length > 0 ? gaps.mappedSum / dimensionData.length : 0;
  const estimatedMissingCount = avgDimensionValue > 0 ? Math.round(gaps.missingValue / avgDimensionValue) : 0;
  
  return {
    missing: {
      count: estimatedMissingCount,
      value: gaps.missingValue,
      percentage: gaps.coverageGap
    },
    unmapped: {
      count: 0, // No unmapped concept in pure dimension coverage
      value: 0,
      percentage: 0
    }
  };
};

/**
 * Generate recommendations based on discrepancies
 */
const generateRecommendations = (discrepancies, dimension) => {
  const recommendations = [];
  
  const criticalIssues = discrepancies.filter(d => d.severity === 'CRITICAL');
  const warningIssues = discrepancies.filter(d => d.severity === 'WARNING');
  
  if (criticalIssues.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      type: 'CRITICAL',
      message: `${criticalIssues.length} critical data gaps detected in ${dimension}`,
      action: 'Review data completeness and mapping in Datorama',
      impact: 'Insights may be significantly unreliable'
    });
  }
  
  if (warningIssues.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      type: 'WARNING',
      message: `${warningIssues.length} data gaps detected in ${dimension}`,
      action: 'Verify data categorization and completeness in Datorama',
      impact: 'Some insights may be affected'
    });
  }
  
  // Add specific metric recommendations
  discrepancies.forEach(discrepancy => {
    if (discrepancy.totalGap > 5) {
      let message = `${discrepancy.metric}: ${discrepancy.totalGap}% total gap`;
      let action = `Check ${discrepancy.metric} in ${dimension}`;
      
      if (discrepancy.coverageGap > 0) {
        message += ` (${discrepancy.coverageGap}% missing data)`;
        action += ' - ensure all campaigns are included in dimension file';
      }
      
      if (discrepancy.mappingGap > 0) {
        message += ` (${discrepancy.mappingGap}% not mapped)`;
        action += ' - map unmapped campaigns in Datorama';
      }
      
      recommendations.push({
        priority: discrepancy.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        type: 'METRIC_GAP',
        message: message,
        action: action,
        impact: `${discrepancy.metric} insights may be incomplete`
      });
    }
  });
  
  return recommendations;
};

/**
 * Calculate data quality score for a single dimension
 */
export const calculateDataQualityScore = (allData, dimensionData, dimension) => {
  if (!allData || !dimensionData || dimensionData.length === 0) {
    return {
      dimension,
      overallScore: 0,
      metricScores: [],
      dataGaps: { missing: { count: 0, value: 0, percentage: 0 }, unmapped: { count: 0, value: 0, percentage: 0 } },
      grade: getQualityGrade(0),
      recommendations: [{
        priority: 'HIGH',
        type: 'NO_DATA',
        message: 'No dimension data available',
        action: 'Upload dimension-specific data file',
        impact: 'Cannot calculate quality score'
      }]
    };
  }
  
  // Calculate discrepancies for all metrics
  const discrepancies = calculateDiscrepancies(allData, dimensionData);
  
  // Calculate overall weighted score
  const weightedScore = calculateWeightedScore(discrepancies);
  
  // Identify data gaps (missing and unmapped)
  const dataGaps = identifyDataGaps(allData, dimensionData, dimension);
  
  // Generate recommendations
  const recommendations = generateRecommendations(discrepancies, dimension);
  
  return {
    dimension,
    overallScore: Math.round(weightedScore * 100) / 100,
    metricScores: discrepancies,
    dataGaps,
    grade: getQualityGrade(weightedScore),
    recommendations
  };
};

/**
 * Calculate comprehensive data quality for all dimensions
 */
export const calculateComprehensiveDataQuality = (data, market, period) => {
  const dimensions = ['Channel Name', 'Channel Type', 'Campaign Type', 'Model', 'Phase'];
  const qualityScores = {};
  
  // Handle multiple markets or single market
  const markets = market === 'all' ? [...new Set(data.map(row => row.country))] : [market];
  
  // Get "All" data for all markets in the period
  const allDataRecords = data.filter(row => 
    row.dimension === 'All' && 
    markets.includes(row.country) && 
    (period === 'all-periods' || (
      row.year === parseInt(period.split('-')[0]) && 
      row.month === parseInt(period.split('-')[1])
    ))
  );
  
  if (allDataRecords.length === 0) {
    return {
      market: market === 'all' ? 'All Markets' : market,
      period,
      overallScore: 0,
      dimensionBreakdown: {},
      criticalIssues: [],
      dataCompleteness: 0,
      grade: getQualityGrade(0),
      error: 'No "All" data found for this market and period'
    };
  }
  
  // Aggregate "All" data across markets
  const aggregatedAllData = {
    'Media Cost': allDataRecords.reduce((sum, row) => sum + (parseFloat(row['Media Cost']) || 0), 0),
    'Impressions': allDataRecords.reduce((sum, row) => sum + (parseFloat(row['Impressions']) || 0), 0),
    'Clicks': allDataRecords.reduce((sum, row) => sum + (parseFloat(row['Clicks']) || 0), 0),
    'IV': allDataRecords.reduce((sum, row) => sum + (parseFloat(row['IV']) || 0), 0),
    'NVWR': allDataRecords.reduce((sum, row) => sum + (parseFloat(row['NVWR']) || 0), 0),
    'Country': market === 'all' ? 'All Markets' : market,
    'dimension': 'All',
    'year': parseInt(period.split('-')[0]),
    'month': parseInt(period.split('-')[1])
  };
  
  // Calculate quality score for each dimension with enhanced market-specific analysis
  dimensions.forEach(dimension => {
    const dimensionData = data.filter(row => 
      row.dimension === dimension.replace(' ', '') && 
      markets.includes(row.country) && 
      (period === 'all-periods' || (
        row.year === parseInt(period.split('-')[0]) && 
        row.month === parseInt(period.split('-')[1])
      ))
    );
    
    qualityScores[dimension] = calculateDataQualityScore(aggregatedAllData, dimensionData, dimension);
    
    // Add market-specific discrepancy analysis
    qualityScores[dimension].marketDiscrepancies = calculateMarketDiscrepancies(
      allDataRecords, 
      dimensionData, 
      dimension, 
      markets
    );
  });
  
  // Calculate overall quality
  const dimensionScores = Object.values(qualityScores).map(score => score.overallScore);
  const overallScore = dimensionScores.length > 0 ? 
    Math.round((dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length) * 100) / 100 : 0;
  
  // Identify critical issues
  const criticalIssues = Object.values(qualityScores)
    .flatMap(score => score.recommendations)
    .filter(rec => rec.priority === 'HIGH');
  
  // Calculate data completeness
  const dataCompleteness = Math.round((Object.values(qualityScores)
    .filter(score => score.overallScore > 0).length / dimensions.length) * 100);
  
  return {
    market: market === 'all' ? 'All Markets' : market,
    period: period === 'all-periods' ? 'All Periods' : period,
    overallScore,
    dimensionBreakdown: qualityScores,
    criticalIssues,
    dataCompleteness,
    grade: getQualityGrade(overallScore),
    marketAnalysis: generateMarketAnalysis(qualityScores, markets)
  };
};

/**
 * Calculate market-specific discrepancies for each dimension
 */
const calculateMarketDiscrepancies = (allDataRecords, dimensionData, dimension, markets) => {
  const marketDiscrepancies = {};
  
  markets.forEach(marketCode => {
    const marketAllData = allDataRecords.filter(row => row.country === marketCode);
    const marketDimensionData = dimensionData.filter(row => row.country === marketCode);
    
    if (marketAllData.length === 0) {
      marketDiscrepancies[marketCode] = {
        error: 'No "All" data found for this market',
        coverage: 0,
        gaps: {}
      };
      return;
    }
    
    // Aggregate market-specific "All" data
    const marketAllAggregated = {
      'Media Cost': marketAllData.reduce((sum, row) => sum + (parseFloat(row['Media Cost']) || 0), 0),
      'Impressions': marketAllData.reduce((sum, row) => sum + (parseFloat(row['Impressions']) || 0), 0),
      'Clicks': marketAllData.reduce((sum, row) => sum + (parseFloat(row['Clicks']) || 0), 0),
      'IV': marketAllData.reduce((sum, row) => sum + (parseFloat(row['IV']) || 0), 0),
      'NVWR': marketAllData.reduce((sum, row) => sum + (parseFloat(row['NVWR']) || 0), 0)
    };
    
    // Calculate gaps for each metric
    const gaps = {};
    CORE_METRICS.forEach(metric => {
      const allValue = marketAllAggregated[metric];
      const dimensionValue = marketDimensionData.reduce((sum, row) => 
        sum + (parseFloat(row[metric]) || 0), 0
      );
      
      const gap = allValue > 0 ? ((allValue - dimensionValue) / allValue) * 100 : 0;
      
      gaps[metric] = {
        allValue: Math.round(allValue * 100) / 100,
        dimensionValue: Math.round(dimensionValue * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        missingValue: Math.round((allValue - dimensionValue) * 100) / 100
      };
    });
    
    // Calculate overall coverage
    const totalGaps = CORE_METRICS.map(metric => gaps[metric].gap);
    const overallCoverage = 100 - (totalGaps.reduce((a, b) => a + b, 0) / totalGaps.length);
    
    marketDiscrepancies[marketCode] = {
      coverage: Math.round(overallCoverage * 100) / 100,
      gaps,
      totalRecords: marketDimensionData.length,
      allRecords: marketAllData.length
    };
  });
  
  return marketDiscrepancies;
};

/**
 * Generate comprehensive market analysis
 */
const generateMarketAnalysis = (qualityScores, markets) => {
  const marketAnalysis = {};
  
  markets.forEach(marketCode => {
    const marketScores = {};
    let totalCoverage = 0;
    let dimensionCount = 0;
    
    Object.entries(qualityScores).forEach(([dimension, score]) => {
      if (score.marketDiscrepancies && score.marketDiscrepancies[marketCode]) {
        const marketData = score.marketDiscrepancies[marketCode];
        marketScores[dimension] = {
          coverage: marketData.coverage,
          gaps: marketData.gaps,
          totalRecords: marketData.totalRecords,
          allRecords: marketData.allRecords
        };
        
        if (!marketData.error) {
          totalCoverage += marketData.coverage;
          dimensionCount++;
        }
      }
    });
    
    const overallCoverage = dimensionCount > 0 ? totalCoverage / dimensionCount : 0;
    
    marketAnalysis[marketCode] = {
      overallCoverage: Math.round(overallCoverage * 100) / 100,
      dimensionScores: marketScores,
      grade: getQualityGrade(overallCoverage),
      criticalIssues: Object.values(marketScores)
        .filter(score => score.coverage < 80)
        .map(score => ({
          dimension: Object.keys(marketScores).find(key => marketScores[key] === score),
          coverage: score.coverage,
          severity: score.coverage < 60 ? 'CRITICAL' : 'WARNING'
        }))
    };
  });
  
  return marketAnalysis;
};

/**
 * Generate discrepancy report with detailed analysis
 */
export const generateDiscrepancyReport = (qualityData) => {
  const { dimensionBreakdown, criticalIssues } = qualityData;
  
  // Calculate total missing and unmapped spend
  const totalMissingSpend = Object.values(dimensionBreakdown)
    .reduce((sum, score) => sum + (score.dataGaps?.missing?.value || 0), 0);
  
  const totalUnmappedSpend = Object.values(dimensionBreakdown)
    .reduce((sum, score) => sum + (score.dataGaps?.unmapped?.value || 0), 0);
  
  // Calculate total missing and unmapped impressions
  const totalMissingImpressions = Object.values(dimensionBreakdown)
    .reduce((sum, score) => {
      const impressionsGap = score.metricScores.find(m => m.metric === 'Impressions');
      return sum + (impressionsGap?.missingValue || 0);
    }, 0);
  
  const totalUnmappedImpressions = Object.values(dimensionBreakdown)
    .reduce((sum, score) => {
      const impressionsGap = score.metricScores.find(m => m.metric === 'Impressions');
      return sum + (impressionsGap?.unmappedSum || 0);
    }, 0);
  
  // Identify data gaps
  const dataGaps = Object.entries(dimensionBreakdown)
    .filter(([dimension, score]) => score.overallScore < 80)
    .map(([dimension, score]) => ({
      dimension,
      score: score.overallScore,
      grade: score.grade.grade,
      dataGaps: score.dataGaps
    }));
  
  return {
    summary: {
      missingSpend: Math.round(totalMissingSpend * 100) / 100,
      unmappedSpend: Math.round(totalUnmappedSpend * 100) / 100,
      missingImpressions: Math.round(totalMissingImpressions * 100) / 100,
      unmappedImpressions: Math.round(totalUnmappedImpressions * 100) / 100,
      dataGaps: dataGaps.length,
      criticalIssues: criticalIssues.length
    },
    details: {
      byDimension: dimensionBreakdown,
      byMetric: generateMetricBreakdown(dimensionBreakdown),
      trends: null // Could be extended to compare with historical data
    },
    actions: {
      immediate: criticalIssues.filter(issue => issue.type === 'CRITICAL'),
      shortTerm: criticalIssues.filter(issue => issue.type === 'WARNING'),
      preventive: generatePreventiveActions(qualityData)
    }
  };
};

/**
 * Generate metric breakdown across all dimensions
 */
const generateMetricBreakdown = (dimensionBreakdown) => {
  const metricBreakdown = {};
  
  CORE_METRICS.forEach(metric => {
    metricBreakdown[metric] = {
      averageCoverage: 0,
      worstDimension: null,
      bestDimension: null,
      totalGap: 0
    };
    
    let totalCoverage = 0;
    let count = 0;
    let worstCoverage = 100;
    let bestCoverage = 0;
    
    Object.entries(dimensionBreakdown).forEach(([dimension, score]) => {
      const metricScore = score.metricScores.find(m => m.metric === metric);
      if (metricScore) {
        totalCoverage += metricScore.coverage;
        count++;
        
        if (metricScore.coverage < worstCoverage) {
          worstCoverage = metricScore.coverage;
          metricBreakdown[metric].worstDimension = dimension;
        }
        
        if (metricScore.coverage > bestCoverage) {
          bestCoverage = metricScore.coverage;
          metricBreakdown[metric].bestDimension = dimension;
        }
        
        metricBreakdown[metric].totalGap += metricScore.gap;
      }
    });
    
    if (count > 0) {
      metricBreakdown[metric].averageCoverage = Math.round((totalCoverage / count) * 100) / 100;
    }
  });
  
  return metricBreakdown;
};

/**
 * Generate preventive actions
 */
const generatePreventiveActions = (qualityData) => {
  const actions = [];
  
  if (qualityData.overallScore < 80) {
    actions.push({
      priority: 'MEDIUM',
      type: 'PREVENTIVE',
      message: 'Implement data quality monitoring',
      action: 'Set up automated alerts for data gaps > 10%',
      impact: 'Prevent future data quality issues'
    });
  }
  
  if (qualityData.dataCompleteness < 100) {
    actions.push({
      priority: 'MEDIUM',
      type: 'PREVENTIVE',
      message: 'Standardize data upload process',
      action: 'Ensure all dimension files are uploaded for each period',
      impact: 'Improve data completeness'
    });
  }
  
  return actions;
};

/**
 * Integrate Onebuilder compliance data into quality scoring
 */
export const integrateComplianceData = (qualityData, complianceData) => {
  if (!complianceData || !qualityData.dimensionBreakdown['Campaign Type']) {
    return qualityData;
  }
  
  // Get the Campaign Type dimension quality
  const campaignTypeQuality = qualityData.dimensionBreakdown['Campaign Type'];
  
  // Calculate compliance percentage
  const totalCampaigns = complianceData.total || 0;
  const compliantCampaigns = complianceData.compliant || 0;
  const compliancePercentage = totalCampaigns > 0 ? (compliantCampaigns / totalCampaigns) * 100 : 100;
  
  // Update the mapping gap for Campaign Type to include compliance
  const updatedMetricScores = campaignTypeQuality.metricScores.map(metricScore => {
    if (metricScore.metric === 'Media Cost') {
      // Combine existing mapping gap with compliance gap
      const complianceGap = 100 - compliancePercentage;
      const totalMappingGap = Math.max(metricScore.mappingGap, complianceGap);
      
      return {
        ...metricScore,
        mappingGap: Math.round(totalMappingGap * 100) / 100,
        complianceGap: Math.round(complianceGap * 100) / 100,
        totalGap: Math.round((metricScore.coverageGap + totalMappingGap) * 100) / 100
      };
    }
    return metricScore;
  });
  
  // Recalculate overall score for Campaign Type
  const updatedWeightedScore = calculateWeightedScore(updatedMetricScores);
  
  // Update the Campaign Type quality data
  const updatedCampaignTypeQuality = {
    ...campaignTypeQuality,
    metricScores: updatedMetricScores,
    overallScore: Math.round(updatedWeightedScore * 100) / 100,
    grade: getQualityGrade(updatedWeightedScore),
    complianceData: {
      total: totalCampaigns,
      compliant: compliantCampaigns,
      percentage: Math.round(compliancePercentage * 100) / 100
    }
  };
  
  // Update the overall quality data
  const updatedDimensionBreakdown = {
    ...qualityData.dimensionBreakdown,
    'Campaign Type': updatedCampaignTypeQuality
  };
  
  // Recalculate overall market quality
  const dimensionScores = Object.values(updatedDimensionBreakdown).map(score => score.overallScore);
  const overallScore = dimensionScores.length > 0 ? 
    Math.round((dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length) * 100) / 100 : 0;
  
  return {
    ...qualityData,
    overallScore,
    dimensionBreakdown: updatedDimensionBreakdown,
    grade: getQualityGrade(overallScore)
  };
};

/**
 * Generate quality-aware insight with confidence level
 */
export const generateQualityAwareInsight = (insight, qualityData, dimension) => {
  const dimensionQuality = qualityData.dimensionBreakdown[dimension];
  const confidence = dimensionQuality ? dimensionQuality.overallScore : 0;
  
  let confidenceLevel = 'Unknown';
  if (confidence >= 95) confidenceLevel = 'High';
  else if (confidence >= 80) confidenceLevel = 'Medium';
  else if (confidence >= 60) confidenceLevel = 'Low';
  else confidenceLevel = 'Very Low';
  
  // Build gap info string
  let gapInfo = ` (${confidence}% data confidence`;
  
  if (dimensionQuality && dimensionQuality.dataGaps) {
    const { missing, unmapped } = dimensionQuality.dataGaps;
    const gaps = [];
    
    if (missing.count > 0) {
      gaps.push(`${missing.count} missing items`);
    }
    
    if (unmapped.count > 0) {
      gaps.push(`${unmapped.count} unmapped items`);
    }
    
    if (gaps.length > 0) {
      gapInfo += ` - ${gaps.join(', ')})`;
    } else {
      gapInfo += ')';
    }
  } else {
    gapInfo += ')';
  }
  
  return {
    ...insight,
    title: insight.title + gapInfo,
    confidence: confidence,
    confidenceLevel: confidenceLevel,
    dataQuality: dimensionQuality
  };
}; 