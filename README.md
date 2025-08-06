# BMW Monthly Report Dashboard

A comprehensive React-based dashboard for analyzing BMW marketing data with advanced CSV processing, data quality monitoring, and intelligent insights.

## 🚀 Features

- **Multi-File CSV Processing**: Handle dimension-split CSV files with automatic data combination
- **Advanced File Upload System**: Drag-and-drop interface with real-time validation
- **Data Quality Scoring**: Comprehensive data completeness and coverage analysis
- **Onebuilder Compliance Tracking**: Monitor data mapping compliance and tracking accuracy
- **Datorama-Focused Insights**: 8 actionable marketing insights for campaign optimization
- **Month-over-Month Trend Analysis**: Performance trends and comparisons across multiple months
- **Data Inventory Management**: View available markets, months, and file processing status
- **Fast Loading**: Cached processed data for quick app startup

## 📊 Multi-File CSV Processing System

### New File Structure

The system now supports a dimension-split file structure where metrics are organized into separate files for each market and month:

**File Naming Convention:**
```
BMW_[COUNTRY]_[DIMENSION]_[YEAR]_[MONTH].csv
```

**Required Dimension Files per Market/Month:**
- `BMW_FR_All_2025_07.csv` - Overall metrics (no dimension filters)
- `BMW_FR_CampaignType_2025_07.csv` - Split by Campaign Type
- `BMW_FR_ChannelType_2025_07.csv` - Split by Channel Type  
- `BMW_FR_ChannelName_2025_07.csv` - Split by Channel Name
- `BMW_FR_Phase_2025_07.csv` - Split by Phase
- `BMW_FR_Model_2025_07.csv` - Split by Model

### Data Processing Workflow

1. **File Upload & Validation**:
   - Automatic dimension detection from filenames
   - Column structure validation for each dimension type
   - Real-time error reporting and validation feedback

2. **Data Combination**:
   - Files grouped by market and month
   - Automatic combination of dimension data into unified records
   - Dimension metadata preservation for filtering

3. **Quality Assessment**:
   - Data completeness scoring across all dimensions
   - Coverage gap analysis (missing vs "All" data)
   - Onebuilder compliance integration

4. **Storage & Caching**:
   - Organized file storage by country/dimension/year
   - Processed data caching for fast loading
   - Metadata tracking for processing status

## 📈 Data Quality Scoring System

### Quality Metrics

The system provides comprehensive data quality assessment:

**Core Metrics (Weighted Scoring):**
- **Media Cost** (25% weight) - Primary financial metric
- **Impressions** (20% weight) - Volume metric
- **Clicks** (15% weight) - Engagement metric
- **IV** (20% weight) - Intermediate conversion metric
- **NVWR** (20% weight) - Final conversion metric

**Quality Grades:**
- **A+ (95-100%)**: Excellent - High confidence in insights
- **A (90-94%)**: Good - Reliable insights with minor gaps
- **B (80-89%)**: Acceptable - Some data gaps, insights generally reliable
- **C (70-79%)**: Needs Attention - Significant gaps, insights may be affected
- **D (60-69%)**: Poor - Major data issues, insights unreliable
- **F (0-59%)**: Critical - Severe data problems, insights not recommended

### Coverage Gap Analysis

The system identifies missing data by comparing dimension totals against "All" data:
- **Missing Records**: Data present in "All" but absent from dimension files
- **Coverage Percentage**: Mathematical comparison of dimension vs total data
- **Impact Assessment**: Financial and performance impact of missing data

## 📋 File Format Requirements

### CSV File Structure

Each dimension file must contain specific columns based on its type:

#### All Dimension (Required Columns):
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

### Validation Features

- **Automatic Column Detection**: System validates expected columns for each dimension
- **Case-Insensitive Matching**: Handles variations in column naming (e.g., "CP NVWR" vs "Cp NVWR")
- **Error Reporting**: Detailed feedback on missing or incorrect columns
- **File Grouping**: Automatic grouping of related dimension files

## 🗄️ Data Storage & Management

### Storage Architecture

- **Browser Storage**: Files and processed data stored in localStorage
- **Supabase Integration**: Cloud database for file metadata and processing history
- **Caching System**: Processed JSON data cached for faster loading
- **Metadata Tracking**: Processing timestamps, file inventory, and quality scores

### Database Schema

The system uses Supabase with the following key tables:
- `bmw_files`: File metadata with dimension information
- `compliance_history`: Onebuilder compliance tracking
- `dimension_coverage_history`: Data quality scoring history

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Copy `env.example` to `.env` and configure your Supabase credentials:
```bash
cp env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Upload CSV Files
- Drag and drop dimension files into the upload area
- Upload all dimension files for a market/month together
- System automatically groups and processes files
- Check Data Inventory for processing status

### 5. View Analytics
- **Data Quality Dashboard**: Monitor data completeness and coverage
- **Onebuilder Compliance**: Track mapping compliance
- **Insights Dashboard**: View actionable marketing insights
- **Trend Analysis**: Month-over-month performance comparisons

## 🌍 Available Markets

The system automatically detects and supports BMW markets:
- **BE** (Belgium)
- **CH** (Switzerland) 
- **CS** (Central Southern)
- **ES** (Spain)
- **FR** (France)
- **IT** (Italy)
- **NE** (Nordics)
- **NL** (Netherlands)
- **PT** (Portugal)
- **UK** (United Kingdom)

## 📊 Datorama-Focused Insights

The dashboard generates 8 actionable marketing insights with quality-aware scoring:

### 1. Performance Leader
- **Metric**: Market with highest NVWR per spend efficiency
- **Quality Context**: Confidence level based on data completeness
- **Action**: Replicate successful strategies across markets

### 2. Channel Champion  
- **Metric**: Best performing channel type by cost-per-NVWR
- **Quality Context**: Coverage analysis for channel dimension data
- **Action**: Increase budget allocation to top-performing channels

### 3. Model Spotlight
- **Metric**: Top model by NVWR generation
- **Quality Context**: Model dimension data completeness
- **Action**: Scale successful models across markets

### 4. Efficiency Alert
- **Metric**: Market with highest cost-per-NVWR (needs attention)
- **Quality Context**: Data quality impact on efficiency calculations
- **Action**: Immediate optimization and budget reallocation

### 5. Volume Driver
- **Metric**: Channel generating most impressions for the spend
- **Quality Context**: Impression data coverage analysis
- **Action**: Leverage reach for brand awareness campaigns

### 6. Conversion King
- **Metric**: Highest IV-to-NVWR conversion rate
- **Quality Context**: Conversion funnel data completeness
- **Action**: Study and replicate successful conversion strategies

### 7. Budget Distribution
- **Metric**: Spend allocation across markets/channels
- **Quality Context**: Financial data coverage assessment
- **Action**: Rebalance budgets based on performance data

### 8. Campaign Type Winner
- **Metric**: Always On vs Tactical vs Launch performance comparison
- **Quality Context**: Campaign dimension data quality
- **Action**: Scale successful campaign types and develop best practices

## ✅ Onebuilder Compliance Tracking

### Compliance Monitoring Features
- **Data Mapping Detection**: Identifies empty, null, or "NOT MAPPED" entries
- **Market-by-Market Analysis**: Calculates compliance percentage for each market
- **Traffic Light System**: Green (>95%), Yellow (90-95%), Red (<90%) compliance indicators
- **Impact Assessment**: Shows percentage of NVWR data affected by unmapped entries
- **Unmapped Combinations**: Lists specific channel/campaign combinations requiring attention
- **Actionable Recommendations**: Prioritized list of mapping tasks

### Compliance Metrics
- **Overall Compliance Score**: Percentage of properly mapped data across all markets
- **Market Breakdown**: Individual compliance scores for each market
- **NVWR Impact**: Percentage of NVWR data that is unmapped
- **Cost Impact**: Total spend associated with unmapped data
- **Trend Analysis**: Compliance improvement/decline tracking

## 📈 Month-over-Month Trend Analysis

### Trend Analysis Features
- **MoM Change Indicators**: Each insight shows month-over-month change with trend arrows (↗️ ↘️ ➡️)
- **Color-Coded Trends**: Green for positive trends, red for concerning trends
- **Performance Alerts**: Automatic detection of significant changes requiring attention
- **Success Stories**: Highlighting markets and channels with consistent improvement

### Trend Metrics
- **NVWR Trend**: Overall NVWR performance over time
- **Cost Efficiency Trends**: Cost-per-NVWR evolution by market and channel
- **Channel Performance Evolution**: How channel efficiency changes over time
- **Onebuilder Compliance Trends**: Mapping compliance improvement/decline

### Performance Alerts
- **>20% decline in any market NVWR**: High priority alert
- **>30% increase in cost-per-NVWR**: High priority alert
- **Onebuilder compliance dropped >5%**: Medium priority alert

## 🔧 Technical Architecture

### Frontend Stack
- **React 18** with Vite for fast development
- **Tailwind CSS** for responsive styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **PapaParse** for CSV processing

### Backend Integration
- **Supabase** for cloud database and file storage
- **PostgreSQL** for data persistence
- **Row Level Security** for data protection

### Data Processing
- **Multi-threaded CSV processing** for large files
- **Incremental updates** for efficient data refresh
- **Quality-aware caching** with metadata tracking

## 🛠️ Development & Testing

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Data Processing
npm run process-data # Process existing CSV files
npm run check-data   # Validate data quality
npm run compliance   # Check Onebuilder compliance
```

### Testing
- **Data Quality Tests**: `scripts/test-data-quality.js`
- **Processing Tests**: `scripts/test-new-processing.js`
- **Compliance Tests**: `scripts/check-compliance.js`

## 🚨 Troubleshooting

### Common Issues

**File Upload Errors:**
- Ensure files follow the naming convention: `BMW_[COUNTRY]_[DIMENSION]_[YEAR]_[MONTH].csv`
- Check that all required dimension files are uploaded together
- Verify column structure matches expected format

**Processing Issues:**
- Use "Refresh Data" button to re-process files
- Check Data Quality Dashboard for coverage gaps
- Review Onebuilder Compliance for mapping issues

**Performance Issues:**
- Large datasets may require IndexedDB instead of localStorage
- Consider processing files in smaller batches
- Monitor browser memory usage with large file sets

**Data Quality Issues:**
- Review Data Quality Dashboard for specific gaps
- Check dimension coverage percentages
- Address unmapped data in Onebuilder

## 📚 Documentation

- **Data Quality System**: `DATA_QUALITY_SYSTEM.md`
- **Multi-File Processing**: `MULTI_FILE_PROCESSING_UPDATE.md`
- **KPI Features**: `KPI_FEATURE.md`
- **Month-over-Month Analysis**: `MOM_FEATURE.md`
- **Supabase Setup**: `SUPABASE_SETUP.md`
- **Storage Configuration**: `STORAGE_SETUP.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is proprietary software for BMW marketing analytics.
