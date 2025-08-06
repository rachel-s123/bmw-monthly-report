#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables from the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

// Debug environment variables
console.log('Environment check:');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

import { processAllCSVsFromSupabase } from '../src/utils/supabaseCsvProcessor.js';

async function processWithNewLogic() {
  console.log('🔄 Processing with new multi-file logic...');
  
  try {
    const result = await processAllCSVsFromSupabase();
    console.log('✅ Processing completed:', result);
  } catch (error) {
    console.error('❌ Processing failed:', error);
  }
}

processWithNewLogic(); 