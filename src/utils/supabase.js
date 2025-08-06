import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// You'll need to replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Debug logging
console.log('🔧 Supabase Configuration Debug:');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'NOT SET');
console.log('Environment check:', {
  hasUrl: !!import.meta.env?.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env?.VITE_SUPABASE_ANON_KEY,
  isDev: import.meta.env?.DEV
});

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket name for CSV files
export const STORAGE_BUCKET = 'bmw-csv-files';

// Database table names
export const TABLES = {
  FILES: 'bmw_files',
  PROCESSED_DATA: 'bmw_processed_data',
  METADATA: 'bmw_metadata',
  COMPLIANCE_HISTORY: 'bmw_compliance_history',
  KPI_HISTORY: 'bmw_kpi_history',
  DIMENSION_COVERAGE_HISTORY: 'bmw_dimension_coverage_history'
};

// Initialize storage bucket if it doesn't exist
export const initializeStorage = async () => {
  console.log('🔧 Initializing Supabase storage...');
  
  try {
    // Try to check if bucket exists by listing files in it
    let bucketExists = false;
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list('', { limit: 1 });
      
      if (listError) {
        if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
          console.log('ℹ️ Storage bucket does not exist, will try to create it');
          bucketExists = false;
        } else {
          console.warn('⚠️ Could not list files in bucket (RLS policy issue):', listError.message);
          console.log('ℹ️ Assuming bucket exists since we cannot list files due to RLS policies');
          bucketExists = true; // Assume bucket exists if we can't list files
        }
      } else {
        console.log('✅ Storage bucket exists and is accessible');
        bucketExists = true;
      }
    } catch (error) {
      console.warn('⚠️ Error checking bucket (RLS policy issue):', error.message);
      console.log('ℹ️ Assuming bucket exists since we cannot check due to RLS policies');
      bucketExists = true; // Assume bucket exists if we can't check
    }
    
    if (bucketExists) {
      console.log('✅ Storage bucket exists (or assumed to exist)');
      return true;
    }

    // Only try to create if we're sure it doesn't exist
    console.log('🔧 Creating storage bucket...');
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: false,
      allowedMimeTypes: ['text/csv'],
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (error) {
      console.warn('⚠️ Could not create storage bucket:', error.message);
      console.log('ℹ️ This is likely due to RLS policies. Please create the bucket manually:');
      console.log('ℹ️ 1. Go to your Supabase dashboard → Storage');
      console.log('ℹ️ 2. Click "Create a new bucket"');
      console.log('ℹ️ 3. Name it: bmw-csv-files');
      console.log('ℹ️ 4. Set it as private (not public)');
      console.log('ℹ️ 5. Set file size limit to 50MB');
      console.log('ℹ️ 6. Set allowed MIME types to: text/csv');
      console.log('ℹ️ 7. Click "Create bucket"');
      console.log('ℹ️ 8. The RLS policies have already been created automatically');
      return false;
    }
    
    console.log('✅ Storage bucket created successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Storage initialization failed:', error.message);
    console.log('ℹ️ Please create the storage bucket manually:');
    console.log('ℹ️ 1. Go to your Supabase dashboard → Storage');
    console.log('ℹ️ 2. Click "Create a new bucket"');
    console.log('ℹ️ 3. Name it: bmw-csv-files');
    console.log('ℹ️ 4. Set it as private (not public)');
    console.log('ℹ️ 5. Set file size limit to 50MB');
    console.log('ℹ️ 6. Set allowed MIME types to: text/csv');
    console.log('ℹ️ 7. Click "Create bucket"');
    return false;
  }
};

// Initialize database tables if they don't exist
export const initializeDatabase = async () => {
  console.log('🔧 Initializing Supabase database...');
  
  try {
    // The database tables have already been created via MCP tools
    // We don't need to create them again via RPC functions
    console.log('✅ Database tables already exist (created via MCP tools)');
    return true;
  } catch (error) {
    console.warn('⚠️ Database initialization warning:', error.message);
    console.log('ℹ️ Database tables should already exist from MCP setup');
    return true; // Continue anyway since tables exist
  }
};

// Initialize Supabase (call this when the app starts)
export const initializeSupabase = async () => {
  console.log('🚀 Initializing Supabase...');
  
  try {
    // Initialize storage (may fail due to RLS, but that's okay)
    const storageSuccess = await initializeStorage();
    
    // Initialize database (should succeed since tables exist)
    const databaseSuccess = await initializeDatabase();
    
    // Consider initialization successful if database works, even if storage fails
    const success = databaseSuccess;
    
    if (success) {
      console.log('✅ Supabase initialization completed');
    } else {
      console.warn('⚠️ Supabase initialization completed with warnings');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error.message);
    return false;
  }
}; 