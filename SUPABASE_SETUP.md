# Supabase Setup Guide for BMW Monthly Report Dashboard

This guide will help you set up Supabase as the backend for your BMW Monthly Report Dashboard.

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `bmw-monthly-report`
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
5. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

### 3. Configure Environment Variables

1. Create a `.env` file in your project root:
```bash
cp env.example .env
```

2. Edit the `.env` file and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/001_create_tables.sql`
3. Click "Run" to execute the migration

### 5. Configure Storage

1. In your Supabase dashboard, go to **Storage**
2. The storage bucket `bmw-csv-files` will be created automatically when you first upload a file
3. If you want to configure it manually:
   - Click "Create a new bucket"
   - Name: `bmw-csv-files`
   - Public bucket: **No**
   - File size limit: `50 MB`
   - Allowed MIME types: `text/csv`

### 6. Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Upload a CSV file to test the integration
3. Check the Supabase dashboard to see if files are being stored

## 📊 Database Schema

The application creates three main tables:

### `bmw_files`
Stores metadata about uploaded CSV files:
- `filename`: Original filename
- `file_path`: Storage path in Supabase
- `file_size`: File size in bytes
- `country`: Extracted from filename (e.g., "UK", "DE")
- `year`: Extracted from filename
- `month`: Extracted from filename
- `status`: File processing status

### `bmw_processed_data`
Stores the combined processed CSV data:
- `id`: Always "latest" (single record)
- `data`: JSON array of all processed records
- `total_records`: Count of records
- `processed_at`: Timestamp of last processing

### `bmw_metadata`
Stores processing metadata:
- `id`: Always "latest" (single record)
- `metadata`: JSON object with processing stats
- `updated_at`: Timestamp of last update

## 🔧 Configuration Options

### Row Level Security (RLS)
The tables are configured with RLS enabled and public access policies. For production, you should:

1. **Enable Authentication**: Go to **Authentication** → **Settings** → **Enable email confirmations**
2. **Create Custom Policies**: Modify the RLS policies in the SQL migration to restrict access based on user roles

### Storage Configuration
- **File Size Limit**: 50MB per file
- **Allowed Types**: Only CSV files
- **Bucket**: Private (not publicly accessible)

## 🚨 Troubleshooting

### Common Issues

1. **"No CSV files found in storage"**
   - Check if your Supabase credentials are correct
   - Verify the storage bucket exists
   - Check browser console for detailed error messages

2. **"Failed to initialize Supabase"**
   - Verify your environment variables are set correctly
   - Check if your Supabase project is active
   - Ensure you have internet connectivity

3. **"Permission denied" errors**
   - Check RLS policies in your Supabase dashboard
   - Verify your API keys have the correct permissions

### Debug Mode

To enable debug logging, add this to your `.env`:
```env
VITE_DEBUG=true
```

## 🔒 Security Considerations

1. **API Keys**: Never commit your `.env` file to version control
2. **RLS Policies**: Review and customize the RLS policies for your use case
3. **File Validation**: The app validates CSV structure before processing
4. **Storage Access**: Files are stored privately by default

## 📈 Performance Tips

1. **Database Indexes**: The migration creates indexes for better query performance
2. **Storage Optimization**: Files are organized by country/year/month for efficient access
3. **Caching**: Processed data is cached in the database to avoid reprocessing

## 🔄 Migration from localStorage

If you're migrating from the localStorage version:

1. Export your existing data (if any)
2. Set up Supabase as described above
3. Upload your CSV files to the new system
4. The app will automatically use Supabase instead of localStorage

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Supabase project is active
3. Check the Supabase dashboard logs
4. Ensure all environment variables are set correctly

## 🎯 Next Steps

After setup, you can:

1. **Customize RLS Policies**: Add user authentication and role-based access
2. **Add Real-time Features**: Use Supabase's real-time subscriptions
3. **Scale Storage**: Upgrade your Supabase plan for more storage
4. **Add Analytics**: Use Supabase's built-in analytics features 