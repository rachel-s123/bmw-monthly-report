/**
 * Debug script to test dimension coverage history saving
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

try {
  config({ path: envPath });
} catch (error) {
  console.log('No .env file found, using default values');
}

// Supabase configuration for Node.js
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gggzidmccdxfidrbutbd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔧 Supabase Configuration Debug:');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'NOT SET');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the functions we need to test
import { calculateComprehensiveDataQuality } from '../src/utils/dataQualityScorer.js';
import { saveDimensionCoverageHistory } from '../src/utils/dimensionCoverageHistory.js';

async function debugDimensionCoverage() {
  console.log('🔍 Debugging Dimension Coverage History...\n');

  try {
    // Step 1: Get processed data from Supabase
    console.log('📊 Step 1: Getting processed data from Supabase...');
    const { data: processedData, error: dataError } = await supabase
      .from('bmw_processed_data')
      .select('data')
      .eq('id', 'latest')
      .single();

    if (dataError) {
      console.error('❌ Error getting processed data:', dataError);
      return;
    }

    if (!processedData || !processedData.data) {
      console.log('⚠️ No processed data found');
      return;
    }

    console.log(`✅ Found ${processedData.data.length} records in processed data`);
    console.log('');

    // Step 2: Get unique markets and months
    console.log('🏢 Step 2: Analyzing markets and months...');
    const markets = [...new Set(processedData.data.map(row => row.country))];
    const months = [...new Set(processedData.data.map(row => `${row.year}-${row.month.toString().padStart(2, '0')}`))];
    
    console.log('Markets found:', markets);
    console.log('Months found:', months);
    console.log('');

    // Step 3: Test quality calculation for first market/month
    if (markets.length > 0 && months.length > 0) {
      const testMarket = markets[0];
      const testMonth = months[0];
      
      console.log(`🧪 Step 3: Testing quality calculation for ${testMarket} ${testMonth}...`);
      
      const qualityData = calculateComprehensiveDataQuality(processedData.data, testMarket, testMonth);
      
      console.log('Quality data result:', {
        hasQualityData: !!qualityData,
        hasMarketAnalysis: !!(qualityData && qualityData.marketAnalysis),
        hasTestMarket: !!(qualityData && qualityData.marketAnalysis && qualityData.marketAnalysis[testMarket]),
        marketAnalysisKeys: qualityData && qualityData.marketAnalysis ? Object.keys(qualityData.marketAnalysis) : null
      });

      if (qualityData && qualityData.marketAnalysis && qualityData.marketAnalysis[testMarket]) {
        const marketAnalysis = qualityData.marketAnalysis[testMarket];
        console.log('Market analysis structure:', {
          overallCoverage: marketAnalysis.overallCoverage,
          hasDimensionScores: !!marketAnalysis.dimensionScores,
          dimensionScoresKeys: marketAnalysis.dimensionScores ? Object.keys(marketAnalysis.dimensionScores) : null
        });

        // Step 4: Test saving a single record
        if (marketAnalysis.dimensionScores) {
          const dimensions = ['Channel Name', 'Channel Type', 'Campaign Type', 'Model', 'Phase'];
          for (const dimension of dimensions) {
            if (marketAnalysis.dimensionScores[dimension]) {
              console.log(`📝 Step 4: Testing save for ${testMarket} ${dimension}...`);
              
              const dimensionScore = marketAnalysis.dimensionScores[dimension];
              const gaps = dimensionScore.gaps || {};
              const [year, monthNum] = testMonth.split('-');
              
              const historyRecord = {
                market_code: testMarket,
                year: parseInt(year),
                month: parseInt(monthNum),
                month_name: new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('en-US', { month: 'long' }),
                dimension: dimension,
                overall_coverage: dimensionScore.coverage || 0,
                media_cost_gap: gaps['Media Cost']?.gap || 0,
                impressions_gap: gaps['Impressions']?.gap || 0,
                clicks_gap: gaps['Clicks']?.gap || 0,
                iv_gap: gaps['IV']?.gap || 0,
                nvwr_gap: gaps['NVWR']?.gap || 0,
                total_missing_media_cost: gaps['Media Cost']?.missingValue || 0,
                total_missing_impressions: gaps['Impressions']?.missingValue || 0,
                total_missing_clicks: gaps['Clicks']?.missingValue || 0,
                total_missing_iv: gaps['IV']?.missingValue || 0,
                total_missing_nvwr: gaps['NVWR']?.missingValue || 0,
                all_media_cost: gaps['Media Cost']?.allValue || 0,
                all_impressions: gaps['Impressions']?.allValue || 0,
                all_clicks: gaps['Clicks']?.allValue || 0,
                all_iv: gaps['IV']?.allValue || 0,
                all_nvwr: gaps['NVWR']?.allValue || 0,
                dimension_media_cost: gaps['Media Cost']?.dimensionValue || 0,
                dimension_impressions: gaps['Impressions']?.dimensionValue || 0,
                dimension_clicks: gaps['Clicks']?.dimensionValue || 0,
                dimension_iv: gaps['IV']?.dimensionValue || 0,
                dimension_nvwr: gaps['NVWR']?.dimensionValue || 0
              };

              console.log('History record to save:', {
                market_code: historyRecord.market_code,
                year: historyRecord.year,
                month: historyRecord.month,
                dimension: historyRecord.dimension,
                overall_coverage: historyRecord.overall_coverage
              });

              try {
                const saveResult = await saveDimensionCoverageHistory(historyRecord, supabase);
                console.log('✅ Save result:', saveResult && saveResult.length > 0 ? 'Success' : 'Failed');
                
                // Verify it was saved
                const { data: savedData, error: verifyError } = await supabase
                  .from('bmw_dimension_coverage_history')
                  .select('*')
                  .eq('market_code', testMarket)
                  .eq('year', parseInt(year))
                  .eq('month', parseInt(monthNum))
                  .eq('dimension', dimension)
                  .limit(1);

                if (verifyError) {
                  console.error('❌ Error verifying saved data:', verifyError);
                } else {
                  console.log('✅ Verification: Found', savedData?.length || 0, 'saved records');
                }
                
                break; // Only test one dimension
              } catch (saveError) {
                console.error('❌ Error saving:', saveError);
              }
            }
          }
        }
      }
    }

    console.log('\n🎉 Debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugDimensionCoverage(); 