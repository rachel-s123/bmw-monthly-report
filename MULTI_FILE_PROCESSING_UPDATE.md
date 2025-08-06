# Multi-File CSV Processing System Update

## Overview

The BMW CSV processing system has been updated to handle a new data structure where metrics are split into separate dimension files for each market and month, instead of having all metrics in a single CSV file.

## Changes Made

### 1. New File Structure

**Previous Structure:**
- Single CSV file per market per month: `BMW_FR_2025_07.csv`
- Contains all dimensions in one file with columns like: Country, Campaign Type, Channel Type, Channel Name, Phase, Model, etc.

**New Structure:**
- Multiple CSV files per market per month, split by dimension:
  - `BMW_FR_All_2025_07.csv` - Overall metrics (no dimension filters)
  - `BMW_FR_CampaignType_2025_07.csv` - Split by Campaign Type
  - `BMW_FR_ChannelType_2025_07.csv` - Split by Channel Type  
  - `BMW_FR_ChannelName_2025_07.csv` - Split by Channel Name
  - `BMW_FR_Phase_2025_07.csv` - Split by Phase
  - `BMW_FR_Model_2025_07.csv` - Split by Model

### 2. Database Schema Updates

#### New Migration: `supabase/migrations/003_add_dimension_field.sql`
- Added `dimension` column to `bmw_files` table
- Set existing records to 'Legacy' dimension
- Created indexes for better query performance
- Added composite index for country, dimension, year, month

### 3. File Processing Updates

#### Updated Files:
- `src/utils/supabaseCsvProcessor.js`
- `src/utils/csvProcessor.js`

#### Key Changes:

1. **File Info Extraction:**
   - Updated regex pattern to extract dimension from filename
   - New format: `BMW_[COUNTRY]_[DIMENSION]_[YEAR]_[MONTH].csv`

2. **CSV Validation:**
   - Dimension-specific expected columns for each file type
   - Updated column name mappings to match actual CSV headers
   - Fixed case sensitivity issues (e.g., `Cp NVWR` vs `CP NVWR`)

3. **Data Processing:**
   - Files are now grouped by market and month
   - Each group contains multiple dimension files
   - Data from all dimensions is combined into a unified structure
   - Added dimension-specific flags for filtering

4. **Storage Structure:**
   - Files are stored in organized paths: `{country}/{dimension}/{year}/{filename}`
   - Database records include dimension information

### 4. Data Combination Logic

The system now combines data from multiple dimension files into a unified structure:

```javascript
const unifiedRecord = {
  Country: row.Country || country,
  'Campaign Type': row['Campaign Type'] || 'Not Mapped',
  'Channel Type': row['Channel Type'] || 'Not Mapped',
  'Channel Name': row['Channel Name'] || 'Not Mapped',
  'Phase': row['Phase'] || 'Not Mapped',
  'Model': row['Model'] || 'Not Mapped',
  // ... all metrics
  // Metadata
  dimension: row.dimension,
  // Dimension-specific flags
  is_all_dimension: dimension === 'All',
  is_campaign_type_dimension: dimension === 'CampaignType',
  // ... etc
};
```

### 5. Expected Column Structure

Each dimension file has specific expected columns:

#### All Dimension:
- Country, Media Cost, Impressions, CPM, Clicks, CTR, CPC, IV, CP IV, Entry Rate, NVWR, Cp NVWR, CVR, DCS (pre) Order, CP DCS (pre) Order, Meta Leads, Cp lead Forms

#### Campaign Type Dimension:
- Country, Campaign Type, Media Cost, Impressions, CPM, Clicks, CTR, CPC, IV, CP IV, Entry Rate, NVWR, Cp NVWR, CVR, DCS (pre) Order, CP DCS (pre) Order, Meta Leads, Cp lead Forms

#### Channel Type Dimension:
- Country, Channel Type, Media Cost, Impressions, CPM, Clicks, CTR, CPC, IV, CP IV, Entry Rate, NVWR, Cp NVWR, CVR, DCS (pre) Order, CP DCS (pre) Order, Meta Leads, Cp lead Forms

#### Channel Name Dimension:
- Country, Channel Name, Media Cost, Impressions, CPM, Clicks, CTR, CPC, IV, CP IV, Entry Rate, NVWR, Cp NVWR, CVR, DCS (pre) Order, CP DCS (pre) Order, Meta Leads, Cp lead Forms

#### Phase Dimension:
- Country, Phase, Media Cost, Impressions, CPM, Clicks, CTR, CPC, IV, CP IV, Entry Rate, NVWR, Cp NVWR, CVR, DCS (pre) Order, CP DCS (pre) Order, Meta Leads, Cp lead Forms

#### Model Dimension:
- Country, Model, Media Cost, Impressions, CPM, Clicks, CTR, CPC, IV, CP IV, Entry Rate, NVWR, Cp NVWR, CVR, DCS (pre) Order, CP DCS (pre) Order, Meta Leads, Cp lead Forms

### 6. Testing

Created test script: `scripts/test-new-processing.js`
- Tests file info extraction
- Tests CSV validation for each dimension
- Tests data structure analysis
- Tests file grouping by market and month

## Usage

### Uploading Files

1. Upload all dimension files for a market/month together
2. System automatically groups files by market and month
3. Each group is processed as a unit
4. Data from all dimensions is combined into unified records

### Processing

The system now:
1. Groups uploaded files by market and month
2. Processes each dimension file within a group
3. Validates each file against its expected column structure
4. Combines data from all dimensions into unified records
5. Stores the combined data with dimension metadata

### Data Access

The processed data includes:
- All original metrics
- Dimension information for each record
- Dimension-specific flags for filtering
- File source information
- Market and month metadata

## Backward Compatibility

- Existing data with 'Legacy' dimension is preserved
- Old single-file format is still supported
- New multi-file format is automatically detected and processed

## Benefits

1. **Better Organization:** Data is logically separated by dimension
2. **Easier Analysis:** Can focus on specific dimensions without loading all data
3. **Improved Performance:** Smaller, focused files are faster to process
4. **Better Data Quality:** Each dimension file contains only relevant data
5. **Flexible Structure:** Easy to add new dimensions in the future

## Migration Notes

- Existing Supabase data will be marked with 'Legacy' dimension
- New uploads will use the multi-file structure
- Both formats can coexist in the system
- No data loss during migration 