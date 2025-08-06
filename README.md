# BMW Monthly Report Dashboard

A React-based dashboard for analyzing BMW marketing data from CSV files.

## Features

- **File Upload System**: Upload CSV files with drag-and-drop interface
- **Data Processing**: Automatic processing and caching of CSV data
- **Data Inventory**: View available markets, months, and file processing status
- **Datorama-Focused Insights**: 8 actionable marketing insights for campaign optimization
- **Onebuilder Compliance Tracking**: Monitor data mapping compliance and tracking accuracy
- **Month-over-Month Trend Analysis**: Performance trends and comparisons across multiple months
- **Fast Loading**: Cached processed data for quick app startup

## Data Processing Workflow

The application implements a smart data processing system:

1. **App Startup**: 
   - Checks for cached processed data first (fast loading)
   - Falls back to processing CSV files if needed
   - Displays data inventory and processing status

2. **File Upload**:
   - Files are saved to browser storage
   - Automatic processing and caching
   - Real-time data inventory updates

3. **Data Refresh**:
   - "Refresh Data" button to re-process all files
   - Maintains data consistency across sessions

## File Format Requirements

CSV files must follow the BMW naming convention:
```
BMW_[COUNTRY]_[YEAR]_[MONTH].csv
```

Example: `BMW_UK_2025_07.csv`

### Required Columns

The CSV files must contain these columns:
- Country
- Campaign Type
- Channel Type
- Channel Name
- Phase
- Model
- Media Cost
- Impressions
- CPM
- Clicks
- CTR
- CPC
- IV
- CP IV
- Entry Rate
- NVWR
- CP NVWR
- CVR
- DCS (pre) Order
- CP DCS (pre) Order
- Meta_Leads
- Cp lead Forms

## Data Storage

- **Browser Storage**: Files and processed data are stored in localStorage
- **Caching**: Processed JSON data is cached for faster loading
- **Metadata**: Processing timestamps and file inventory are tracked

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Upload CSV Files**:
   - Drag and drop CSV files into the upload area
   - Or click "Choose Files" to browse
   - Files will be automatically processed and cached

4. **View Data**:
   - Check the Data Inventory section for available markets and months
   - Use the "Refresh Data" button to re-process all files
   - View insights and analytics in the Dashboard

## Available Markets

The system automatically detects and displays available markets from uploaded files. Common BMW markets include:
- BE (Belgium)
- CH (Switzerland)
- CS (Czech Republic)
- ES (Spain)
- FR (France)
- IT (Italy)
- NE (Netherlands)
- NL (Netherlands)
- PT (Portugal)
- UK (United Kingdom)

## Technical Details

- **Frontend**: React with Vite
- **Styling**: Tailwind CSS
- **CSV Processing**: PapaParse
- **Charts**: Recharts
- **Icons**: Lucide React
- **Storage**: Browser localStorage (with IndexedDB support for larger datasets)

## Datorama-Focused Insights

The dashboard generates 8 actionable marketing insights designed for campaign optimization:

### 1. Performance Leader
- **Metric**: Market with highest NVWR per spend efficiency
- **Focus**: Cost-per-NVWR optimization
- **Action**: Replicate successful strategies across markets

### 2. Channel Champion  
- **Metric**: Best performing channel type by cost-per-NVWR
- **Focus**: Channel ROI and CTR performance
- **Action**: Increase budget allocation to top-performing channels

### 3. Model Spotlight
- **Metric**: Top model by NVWR generation
- **Focus**: Model performance and IV-to-NVWR conversion
- **Action**: Scale successful models across markets

### 4. Efficiency Alert
- **Metric**: Market with highest cost-per-NVWR (needs attention)
- **Focus**: Performance optimization opportunities
- **Action**: Immediate optimization and budget reallocation

### 5. Volume Driver
- **Metric**: Channel generating most impressions for the spend
- **Focus**: CPM and CTR optimization
- **Action**: Leverage reach for brand awareness campaigns

### 6. Conversion King
- **Metric**: Highest IV-to-NVWR conversion rate
- **Focus**: Conversion funnel optimization
- **Action**: Study and replicate successful conversion strategies

### 7. Budget Distribution
- **Metric**: Spend allocation across markets/channels
- **Focus**: Budget optimization and ROI analysis
- **Action**: Rebalance budgets based on performance data

### 8. Campaign Type Winner
- **Metric**: Always On vs Tactical vs Launch performance comparison
- **Focus**: Campaign strategy optimization
- **Action**: Scale successful campaign types and develop best practices

## Onebuilder Compliance Tracking

The dashboard includes a dedicated Onebuilder compliance monitoring system that tracks data mapping accuracy:

### Compliance Monitoring Features
- **Data Mapping Detection**: Identifies empty, null, or "NOT MAPPED" Model entries
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
- **Trend Analysis**: Compliance improvement/decline tracking (when multiple months available)

### Alert System
- **High Priority**: Markets with <90% compliance
- **Medium Priority**: Markets with 90-95% compliance
- **Low Priority**: Markets with >95% compliance
- **Specific Recommendations**: "Map [Channel] + [Campaign] combinations in Onebuilder"

## Month-over-Month Trend Analysis

The dashboard includes comprehensive trend analysis when multiple months of data are available:

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

### Success Stories
- **Markets with consistent improvement**: >10% NVWR increase
- **Channels showing strong efficiency gains**: >10% cost efficiency improvement
- **Models gaining momentum**: Overall performance improvements

### Visual Indicators
- **↗️ Improving**: Positive trend (green)
- **↘️ Declining**: Negative trend (red)
- **➡️ Stable**: No significant change (gray)

## Data Flow

```
CSV Upload → Browser Storage → Processing → JSON Cache → Dashboard Display
     ↓              ↓              ↓            ↓            ↓
File Validation → Metadata Update → Insights → Fast Loading → Analytics
```

## Troubleshooting

- **File Format Errors**: Ensure CSV files follow the required naming convention and column structure
- **Processing Issues**: Use the "Refresh Data" button to re-process files
- **Storage Limits**: For large datasets, consider using IndexedDB instead of localStorage
- **Browser Compatibility**: Modern browsers with localStorage support required
