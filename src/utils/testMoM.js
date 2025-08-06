// Test file for MoM calculations
import { analyzeOnebuilderCompliance } from './onebuilderCompliance.js';

// Mock historical data for testing
const mockHistoricalData = [
  {
    market_code: 'BE',
    year: 2025,
    month: 6,
    month_name: 'June',
    compliance_percentage: 85.5,
    total_records: 1000,
    mapped_records: 855,
    unmapped_records: 145,
    total_nvwr: 50000,
    unmapped_nvwr: 7250,
    unmapped_nvwr_percentage: 14.5,
    unmapped_by_field: {
      model: 50,
      phase: 30,
      channelType: 25,
      channelName: 20,
      campaignType: 20
    }
  }
];

// Mock current data for testing
const mockCurrentData = [
  {
    country: 'BE',
    Model: 'BMW X1',
    Phase: 'Awareness',
    'Channel Type': 'Digital',
    'Channel Name': 'Facebook',
    'Campaign Type': 'Brand',
    NVWR: '1000',
    'Media Cost': '5000',
    _year: 2025,
    _month: 7
  },
  {
    country: 'BE',
    Model: 'NOT MAPPED',
    Phase: 'Awareness',
    'Channel Type': 'Digital',
    'Channel Name': 'Facebook',
    'Campaign Type': 'Brand',
    NVWR: '500',
    'Media Cost': '2500',
    _year: 2025,
    _month: 7
  }
];

// Test the MoM calculation
export const testMoMCalculation = () => {
  console.log('🧪 Testing MoM calculation...');
  
  try {
    const result = analyzeOnebuilderCompliance(mockCurrentData, mockHistoricalData);
    
    console.log('✅ Analysis completed successfully');
    console.log('📊 Market compliance:', result.marketCompliance);
    
    if (result.marketCompliance.length > 0) {
      const beMarket = result.marketCompliance.find(m => m.marketCode === 'BE');
      if (beMarket && beMarket.momChange) {
        console.log('📈 BE Market MoM Change:', {
          percentage: beMarket.momChange.percentage,
          direction: beMarket.momChange.direction,
          previousCompliance: beMarket.momChange.previousCompliance,
          currentCompliance: beMarket.compliance
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testMoMCalculation = testMoMCalculation;
} else {
  // Node.js environment
  testMoMCalculation();
} 