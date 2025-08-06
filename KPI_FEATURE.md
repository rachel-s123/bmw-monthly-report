# KPI Historical Data Feature

## Overview
The KPI Historical Data feature enables month-over-month (MoM) tracking of key performance indicators across all BMW markets. This system automatically calculates and stores KPI metrics for each market and month, allowing for trend analysis and performance comparisons.

## Features

### 📊 **Core KPI Metrics**
- **Total Spend**: Total media cost across all campaigns
- **Total Impressions**: Total ad impressions served
- **Total Clicks**: Total clicks received
- **Total NVWR**: Total Net Value Worth of Revenue generated
- **Total Leads**: Total leads generated (Meta_Leads)

### 📈 **Calculated Metrics**
- **CPM** (Cost Per Mille): Cost per 1,000 impressions
- **CPC** (Cost Per Click): Cost per click
- **CTR** (Click-Through Rate): Click rate as percentage of impressions
- **CVR** (Conversion Rate): Lead conversion rate as percentage of clicks
- **Cost per NVWR**: Cost per unit of revenue generated
- **Cost per Lead**: Cost per lead generated

### 🔍 **Performance Breakdowns**
- **Channel Performance**: Metrics broken down by channel type (Search Engine, Social Networks, etc.)
- **Campaign Type Performance**: Metrics broken down by campaign type (Always On, Tactical, etc.)
- **Model Performance**: Metrics broken down by BMW model

### 📅 **Historical Tracking**
- Month-over-month change calculations
- Historical data storage with automatic updates
- Market-specific performance tracking

## Technical Implementation

### Database Schema
**Table**: `bmw_kpi_history`

```sql
CREATE TABLE bmw_kpi_history (
  id SERIAL PRIMARY KEY,
  market_code VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  
  -- Core KPI metrics
  total_spend DECIMAL(15,2) NOT NULL,
  total_impressions BIGINT NOT NULL,
  total_clicks BIGINT NOT NULL,
  total_nvwr DECIMAL(15,2) NOT NULL,
  total_leads BIGINT NOT NULL,
  
  -- Calculated metrics
  cpm DECIMAL(10,2) NOT NULL,
  cpc DECIMAL(10,2) NOT NULL,
  ctr DECIMAL(5,2) NOT NULL,
  cvr DECIMAL(5,2) NOT NULL,
  cost_per_nvwr DECIMAL(10,2) NOT NULL,
  cost_per_lead DECIMAL(10,2) NOT NULL,
  
  -- Performance breakdowns (JSONB)
  channel_performance JSONB NOT NULL,
  campaign_type_performance JSONB NOT NULL,
  model_performance JSONB NOT NULL,
  
  total_records INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(market_code, year, month)
);
```

### Key Files

1. **`src/utils/kpiHistory.js`**
   - `calculateKPIMetrics()`: Calculate KPI metrics from raw data
   - `saveKPIHistory()`: Save KPI metrics to database
   - `getKPIHistory()`: Retrieve historical KPI data
   - `calculateKPIMoMChange()`: Calculate month-over-month changes
   - `formatKPIMoMChange()`: Format MoM changes for display

2. **`src/utils/autoKPIProcessor.js`**
   - `processAllMonthsKPI()`: Automatically process KPI for all markets/months
   - `checkKPICoverage()`: Check if KPI data is missing for any periods

3. **Integration Points**
   - **`src/utils/supabaseCsvProcessor.js`**: Auto-processes KPI when data is uploaded
   - **`src/App.jsx`**: Checks and processes missing KPI data on app startup

## Usage

### Automatic Processing
KPI metrics are automatically calculated and stored when:
1. **New data is uploaded** via the Data Management page
2. **Data is refreshed** using the "Refresh Data" button
3. **App starts up** and detects missing KPI data

### Manual Processing
```javascript
import { processAllMonthsKPI } from './utils/autoKPIProcessor';

// Process all available months
const result = await processAllMonthsKPI();
console.log(result.message);
```

### Retrieving KPI Data
```javascript
import { getKPIHistory, calculateKPIMoMChange } from './utils/kpiHistory';

// Get all KPI history for BE market
const beHistory = await getKPIHistory('BE');

// Get specific month
const julyData = await getKPIHistory('BE', 2025, 7);

// Calculate MoM changes
const momChanges = calculateKPIMoMChange(currentMetrics, previousMetrics);
```

## Data Flow

1. **Data Upload** → CSV files processed and stored in `bmw_processed_data`
2. **Automatic Processing** → `processAllMonthsKPI()` extracts market data by file source
3. **KPI Calculation** → `calculateKPIMetrics()` computes all metrics and breakdowns
4. **Historical Storage** → `saveKPIHistory()` stores metrics in `bmw_kpi_history`
5. **MoM Analysis** → `calculateKPIMoMChange()` compares current vs previous month
6. **Trend Display** → MoM changes displayed in dashboard trends section

## Market Code Extraction

The system extracts market codes from CSV filenames using the pattern:
- **Filename**: `BMW_BE_2025_07.csv`
- **Market Code**: `BE`
- **All records** from this file are grouped as one market (regardless of internal country codes)

This ensures consistent market definitions across compliance and KPI tracking.

## MoM Calculations

Month-over-month changes are calculated for all metrics:
- **Percentage Change**: `((current - previous) / previous) * 100`
- **Direction**: `up`, `down`, or `stable`
- **Display**: Formatted with color coding (green for positive, red for negative)

## Future Enhancements

- **Quarter-over-Quarter (QoQ) analysis**
- **Year-over-Year (YoY) comparisons**
- **Custom date range analysis**
- **KPI goal tracking and alerts**
- **Performance benchmarking across markets**
- **Export functionality for reports**

## Testing

To test the KPI system:
1. Upload new data or refresh existing data
2. Check browser console for KPI processing logs
3. Verify KPI data in `bmw_kpi_history` table
4. Confirm MoM calculations in trends section

The system automatically handles missing data and ensures all available periods are processed for complete historical tracking. 