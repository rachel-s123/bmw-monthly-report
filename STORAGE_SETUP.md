# 🗂️ Storage Bucket Setup Guide

Your BMW Dashboard is almost ready! You just need to create the storage bucket manually in your Supabase dashboard.

## 📋 Step-by-Step Instructions

### 1. Open Your Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Sign in to your account
- Select your project: **bmw-monthly-report**

### 2. Navigate to Storage
- In the left sidebar, click on **"Storage"**
- You should see an empty storage section

### 3. Create the Storage Bucket
- Click **"Create a new bucket"** button
- Fill in the details:
  - **Name:** `bmw-csv-files`
  - **Public bucket:** ❌ **Unchecked** (keep it private)
  - **File size limit:** `50 MB`
  - **Allowed MIME types:** `text/csv`
- Click **"Create bucket"**

### 4. Verify the Setup
- You should see the `bmw-csv-files` bucket in your storage list
- The bucket should show as **Private**

## ✅ What's Already Configured

The following have been automatically set up using the MCP tools:

- ✅ **Database Tables:** `bmw_files`, `bmw_processed_data`, `bmw_metadata`
- ✅ **RLS Policies:** All tables have public access policies
- ✅ **Storage Policies:** RLS policies for the storage bucket
- ✅ **Indexes:** Performance indexes on database tables
- ✅ **Triggers:** Automatic timestamp updates

## 🎯 After Creating the Bucket

Once you create the storage bucket:

1. **Refresh your browser** where the BMW Dashboard is running
2. **Try uploading a CSV file** - it should work now!
3. **Check the console** - you should see success messages instead of errors

## 🔧 Troubleshooting

If you still see errors after creating the bucket:

1. **Check the bucket name** - it must be exactly `bmw-csv-files`
2. **Verify it's private** - not public
3. **Check file size limit** - should be 50MB
4. **Check MIME types** - should be `text/csv`

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for specific error messages
2. Verify your `.env` file has the correct Supabase URL and keys
3. Make sure you're using the service role key for admin operations

---

**Your BMW Dashboard will be fully functional once the storage bucket is created!** 🚀 