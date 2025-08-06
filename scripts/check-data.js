#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

async function checkData() {
  console.log('🔍 Checking processed data...');
  
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  try {
    const { data, error } = await supabase
      .from('bmw_processed_data')
      .select('*')
      .eq('id', 'latest')
      .single();
    
    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }
    
    if (!data) {
      console.log('ℹ️ No processed data found');
      return;
    }
    
    console.log('✅ Found processed data:');
    console.log('- Total records:', data.total_records);
    console.log('- Processed at:', data.processed_at);
    console.log('- Sample records:', data.data?.slice(0, 3));
    
    // Check for different dimensions
    const dimensions = [...new Set(data.data?.map(r => r.dimension) || [])];
    console.log('- Dimensions found:', dimensions);
    
    // Check for different countries
    const countries = [...new Set(data.data?.map(r => r.country) || [])];
    console.log('- Countries found:', countries);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkData(); 