import { supabase } from './supabase.js';
import { analyzeOnebuilderCompliance } from './onebuilderCompliance.js';
import { saveComplianceHistory, getMonthName } from './complianceHistory.js';

/**
 * Process June 2025 data and save compliance metrics to history
 */
export const processJuneDataForMoM = async () => {
  try {
    console.log('🔧 Processing June 2025 data for MoM calculations...');
    
    // Get the June 2025 file record
    const { data: juneFile, error: fileError } = await supabase
      .from('bmw_files')
      .select('*')
      .eq('filename', 'BMW_BE_2025_06.csv')
      .single();

    if (fileError || !juneFile) {
      console.error('❌ June 2025 file not found:', fileError);
      return { success: false, error: 'June 2025 file not found' };
    }

    console.log('✅ Found June 2025 file:', juneFile.filename);

    // Get the processed data for June
    const { data: processedData, error: dataError } = await supabase
      .from('bmw_processed_data')
      .select('*')
      .eq('id', 'latest')
      .single();

    if (dataError || !processedData) {
      console.error('❌ No processed data found:', dataError);
      return { success: false, error: 'No processed data found' };
    }

    // Filter data for June 2025 (BE market)
    const juneData = processedData.data.filter(record => 
      record.file_source === 'BMW_BE_2025_06.csv'
    );

    if (juneData.length === 0) {
      console.log('⚠️ No June 2025 data found in processed data');
      return { success: false, error: 'No June 2025 data found' };
    }

    console.log(`✅ Found ${juneData.length} June 2025 records`);
    console.log('📊 Sample June record:', juneData[0]);

    // Analyze compliance for June data
    const compliance = analyzeOnebuilderCompliance(juneData);
    
    // Save June compliance to history
    const year = 2025;
    const month = 6;
    const monthName = getMonthName(month);
    
    await saveComplianceHistory(compliance.marketCompliance, year, month, monthName);
    
    console.log('✅ June 2025 compliance data saved to history');
    
    return { 
      success: true, 
      message: 'June 2025 data processed successfully',
      compliance: compliance.marketCompliance
    };
    
  } catch (error) {
    console.error('❌ Error processing June data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if June 2025 data exists in compliance history
 */
export const checkJuneDataExists = async () => {
  try {
    const { data, error } = await supabase
      .from('bmw_compliance_history')
      .select('*')
      .eq('market_code', 'BE')
      .eq('year', 2025)
      .eq('month', 6);

    if (error) {
      console.error('Error checking June data:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking June data:', error);
    return false;
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.processJuneDataForMoM = processJuneDataForMoM;
  window.checkJuneDataExists = checkJuneDataExists;
} 