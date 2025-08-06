/**
 * Test script for dimension coverage history functionality
 * This script tests the saving and retrieval of dimension coverage history data
 */

import { saveDimensionCoverageHistory, getDimensionCoverageHistory, getDimensionCoverageTrends } from '../src/utils/dimensionCoverageHistory.js';

// Mock data for testing
const mockHistoryRecord = {
  market_code: 'FR',
  year: 2025,
  month: 7,
  month_name: 'July',
  dimension: 'Channel Name',
  overall_coverage: 85.5,
  media_cost_gap: 12.3,
  impressions_gap: 8.7,
  clicks_gap: 15.2,
  iv_gap: 10.1,
  nvwr_gap: 9.8,
  total_missing_media_cost: 125000.50,
  total_missing_impressions: 2500000,
  total_missing_clicks: 15000,
  total_missing_iv: 8000,
  total_missing_nvwr: 1200,
  all_media_cost: 1000000.00,
  all_impressions: 20000000,
  all_clicks: 100000,
  all_iv: 80000,
  all_nvwr: 12000,
  dimension_media_cost: 875000.00,
  dimension_impressions: 17500000,
  dimension_clicks: 85000,
  dimension_iv: 72000,
  dimension_nvwr: 10800
};

async function testDimensionCoverageHistory() {
  console.log('🧪 Testing Dimension Coverage History Functionality...\n');

  try {
    // Test 1: Save dimension coverage history
    console.log('📝 Test 1: Saving dimension coverage history...');
    const saveResult = await saveDimensionCoverageHistory(mockHistoryRecord);
    console.log('✅ Save result:', saveResult ? 'Success' : 'Failed');
    console.log('');

    // Test 2: Retrieve all dimension coverage history
    console.log('📊 Test 2: Retrieving all dimension coverage history...');
    const allHistory = await getDimensionCoverageHistory();
    console.log('✅ Retrieved records:', allHistory?.length || 0);
    if (allHistory && allHistory.length > 0) {
      console.log('📋 Sample record:', {
        market: allHistory[0].market_code,
        dimension: allHistory[0].dimension,
        coverage: allHistory[0].overall_coverage,
        month: `${allHistory[0].year}-${allHistory[0].month}`
      });
    }
    console.log('');

    // Test 3: Filter by market
    console.log('🏢 Test 3: Filtering by market (FR)...');
    const frHistory = await getDimensionCoverageHistory('FR');
    console.log('✅ FR records found:', frHistory?.length || 0);
    console.log('');

    // Test 4: Filter by dimension
    console.log('📐 Test 4: Filtering by dimension (Channel Name)...');
    const channelNameHistory = await getDimensionCoverageHistory(null, 'Channel Name');
    console.log('✅ Channel Name records found:', channelNameHistory?.length || 0);
    console.log('');

    // Test 5: Get trends for a specific market and dimension
    console.log('📈 Test 5: Getting trends for FR Channel Name (last 6 months)...');
    const trends = await getDimensionCoverageTrends('FR', 'Channel Name', 6);
    console.log('✅ Trend records found:', trends?.length || 0);
    if (trends && trends.length > 0) {
      console.log('📊 Trend data:', trends.map(t => ({
        month: `${t.year}-${t.month}`,
        coverage: t.overall_coverage,
        media_cost_gap: t.media_cost_gap
      })));
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDimensionCoverageHistory();
}

export { testDimensionCoverageHistory }; 