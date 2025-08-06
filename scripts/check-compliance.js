#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

async function checkCompliance() {
  console.log('🔍 Checking compliance history...');
  
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  try {
    const { data, error } = await supabase
      .from('bmw_compliance_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching compliance history:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('ℹ️ No compliance history found');
      return;
    }
    
    console.log(`✅ Found ${data.length} compliance history records:`);
    
    data.forEach(record => {
      console.log(`- ${record.market_code} ${record.month_name} ${record.year}:`);
      console.log(`  Compliance: ${record.compliance_percentage}%`);
      console.log(`  Total records: ${record.total_records}`);
      console.log(`  Mapped: ${record.mapped_records}, Unmapped: ${record.unmapped_records}`);
      console.log(`  Unmapped by field:`, record.unmapped_by_field);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCompliance(); 