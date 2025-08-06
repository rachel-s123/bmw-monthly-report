/**
 * Test file for data quality scoring system
 * This file contains sample data and tests to verify the quality scoring works correctly
 */

import { calculateDataQualityScore, calculateComprehensiveDataQuality } from './dataQualityScorer.js';

// Sample "All" data for testing
const sampleAllData = {
  'Media Cost': 100000,
  'Impressions': 5000000,
  'Clicks': 25000,
  'IV': 5000,
  'NVWR': 1000,
  'Country': 'FR',
  'dimension': 'All',
  'year': 2025,
  'month': 7
};

// Sample dimension data with some gaps (90% coverage)
const sampleChannelNameData = [
  {
    'Channel Name': 'Social Networks',
    'Media Cost': 45000,
    'Impressions': 2250000,
    'Clicks': 11250,
    'IV': 2250,
    'NVWR': 450,
    'Country': 'FR',
    'dimension': 'ChannelName',
    'year': 2025,
    'month': 7
  },
  {
    'Channel Name': 'Search',
    'Media Cost': 35000,
    'Impressions': 1750000,
    'Clicks': 8750,
    'IV': 1750,
    'NVWR': 350,
    'Country': 'FR',
    'dimension': 'ChannelName',
    'year': 2025,
    'month': 7
  },
  {
    'Channel Name': 'Display',
    'Media Cost': 15000,
    'Impressions': 750000,
    'Clicks': 3750,
    'IV': 750,
    'NVWR': 150,
    'Country': 'FR',
    'dimension': 'ChannelName',
    'year': 2025,
    'month': 7
  }
];

// Sample dimension data with critical gaps (60% coverage)
const sampleCampaignTypeData = [
  {
    'Campaign Type': 'Always On',
    'Media Cost': 30000,
    'Impressions': 1500000,
    'Clicks': 7500,
    'IV': 1500,
    'NVWR': 300,
    'Country': 'FR',
    'dimension': 'CampaignType',
    'year': 2025,
    'month': 7
  },
  {
    'Campaign Type': 'Tactical',
    'Media Cost': 25000,
    'Impressions': 1250000,
    'Clicks': 6250,
    'IV': 1250,
    'NVWR': 250,
    'Country': 'FR',
    'dimension': 'CampaignType',
    'year': 2025,
    'month': 7
  }
];

// Sample dimension data with perfect coverage (100%)
const sampleModelData = [
  {
    'Model': 'X1',
    'Media Cost': 40000,
    'Impressions': 2000000,
    'Clicks': 10000,
    'IV': 2000,
    'NVWR': 400,
    'Country': 'FR',
    'dimension': 'Model',
    'year': 2025,
    'month': 7
  },
  {
    'Model': 'X3',
    'Media Cost': 35000,
    'Impressions': 1750000,
    'Clicks': 8750,
    'IV': 1750,
    'NVWR': 350,
    'Country': 'FR',
    'dimension': 'Model',
    'year': 2025,
    'month': 7
  },
  {
    'Model': 'X5',
    'Media Cost': 25000,
    'Impressions': 1250000,
    'Clicks': 6250,
    'IV': 1250,
    'NVWR': 250,
    'Country': 'FR',
    'dimension': 'Model',
    'year': 2025,
    'month': 7
  }
];

// Test function
export const testDataQualityScoring = () => {
  console.log('🧪 Testing Data Quality Scoring System...\n');

  // Test 1: Channel Name dimension (90% coverage - should be good quality)
  console.log('📊 Test 1: Channel Name Dimension (90% coverage)');
  const channelNameQuality = calculateDataQualityScore(sampleAllData, sampleChannelNameData, 'Channel Name');
  console.log('Overall Score:', channelNameQuality.overallScore + '%');
  console.log('Grade:', channelNameQuality.grade.grade);
  console.log('Data Gaps:', channelNameQuality.dataGaps);
  console.log('Recommendations:', channelNameQuality.recommendations.length);
  console.log('');

  // Test 2: Campaign Type dimension (60% coverage - should be poor quality)
  console.log('📊 Test 2: Campaign Type Dimension (60% coverage)');
  const campaignTypeQuality = calculateDataQualityScore(sampleAllData, sampleCampaignTypeData, 'Campaign Type');
  console.log('Overall Score:', campaignTypeQuality.overallScore + '%');
  console.log('Grade:', campaignTypeQuality.grade.grade);
  console.log('Data Gaps:', campaignTypeQuality.dataGaps);
  console.log('Recommendations:', campaignTypeQuality.recommendations.length);
  console.log('');

  // Test 3: Model dimension (100% coverage - should be excellent quality)
  console.log('📊 Test 3: Model Dimension (100% coverage)');
  const modelQuality = calculateDataQualityScore(sampleAllData, sampleModelData, 'Model');
  console.log('Overall Score:', modelQuality.overallScore + '%');
  console.log('Grade:', modelQuality.grade.grade);
  console.log('Data Gaps:', modelQuality.dataGaps);
  console.log('Recommendations:', modelQuality.recommendations.length);
  console.log('');

  // Test 4: Comprehensive quality assessment
  console.log('📊 Test 4: Comprehensive Quality Assessment');
  const allData = [sampleAllData, ...sampleChannelNameData, ...sampleCampaignTypeData, ...sampleModelData];
  const comprehensiveQuality = calculateComprehensiveDataQuality(allData, 'FR', '2025-07');
  console.log('Market Overall Score:', comprehensiveQuality.overallScore + '%');
  console.log('Market Grade:', comprehensiveQuality.grade.grade);
  console.log('Data Completeness:', comprehensiveQuality.dataCompleteness + '%');
  console.log('Critical Issues:', comprehensiveQuality.criticalIssues.length);
  console.log('Dimensions Analyzed:', Object.keys(comprehensiveQuality.dimensionBreakdown).length);

  return {
    channelNameQuality,
    campaignTypeQuality,
    modelQuality,
    comprehensiveQuality
  };
};

// Export sample data for use in other tests
export const sampleData = {
  allData: sampleAllData,
  channelNameData: sampleChannelNameData,
  campaignTypeData: sampleCampaignTypeData,
  modelData: sampleModelData
}; 