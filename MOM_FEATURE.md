# Month-over-Month (MoM) Change Feature

## Overview

The BMW Monthly Report Dashboard now includes a Month-over-Month (MoM) change column in the Onebuilder Completion Status table. This feature shows the percentage difference in compliance rates between the current month and the previous month for each market.

## Features

### MoM Change Column
- **Location**: Added as a new column in the Onebuilder Compliance table
- **Display**: Shows percentage change with directional indicators (up/down arrows)
- **Color Coding**: 
  - Green with up arrow for improvements
  - Red with down arrow for declines
  - Gray for no change or stable performance

### Historical Data Storage
- **Database Table**: `bmw_compliance_history` stores monthly compliance data
- **Automatic Saving**: Current month's data is automatically saved when the component loads
- **Data Structure**: Includes all compliance metrics for trend analysis

## Technical Implementation

### Database Schema
```sql
CREATE TABLE bmw_compliance_history (
  id SERIAL PRIMARY KEY,
  market_code VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20) NOT NULL,
  total_records INTEGER NOT NULL,
  mapped_records INTEGER NOT NULL,
  unmapped_records INTEGER NOT NULL,
  compliance_percentage DECIMAL(5,2) NOT NULL,
  total_nvwr DECIMAL(15,2) NOT NULL,
  unmapped_nvwr DECIMAL(15,2) NOT NULL,
  unmapped_nvwr_percentage DECIMAL(5,2) NOT NULL,
  unmapped_by_field JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(market_code, year, month)
);
```

### Key Files Modified

1. **`supabase/migrations/002_create_compliance_history.sql`**
   - New migration for compliance history table

2. **`src/utils/onebuilderCompliance.js`**
   - Added `calculateMoMChange()` function
   - Added `formatMoMChange()` function
   - Modified `analyzeOnebuilderCompliance()` to include MoM calculations

3. **`src/utils/complianceHistory.js`**
   - New utility for managing compliance history data
   - Functions for saving and retrieving historical data

4. **`src/components/OnebuilderCompliance.jsx`**
   - Added MoM column to the table
   - Integrated historical data loading and saving
   - Added visual indicators for MoM changes

5. **`scripts/setup-supabase.js`**
   - Updated to include compliance history table creation

## Usage

### Current Behavior
- When you load July 2025 data, the MoM column will show "N/A" for all markets initially
- Once you add June 2025 data (or any previous month), the MoM calculations will appear
- The system automatically saves current month's data for future comparisons

### Example Scenarios

#### Scenario 1: First Month (July 2025)
- **BE Market**: Shows "N/A" in MoM column
- **Reason**: No historical data available for June 2025

#### Scenario 2: Second Month (August 2025)
- **BE Market**: Shows "+5.2%" with green up arrow
- **Reason**: Compliance improved from 85.5% in July to 90.7% in August

#### Scenario 3: Third Month (September 2025)
- **BE Market**: Shows "-2.1%" with red down arrow
- **Reason**: Compliance decreased from 90.7% in August to 88.6% in September

## Data Flow

1. **Component Mount**: Loads historical compliance data from database
2. **Data Analysis**: Analyzes current data and calculates MoM changes
3. **Display**: Shows MoM column with appropriate indicators
4. **Save**: Automatically saves current month's data for future use

## Testing

A test file is available at `src/utils/testMoM.js` to verify the MoM calculation functionality:

```javascript
import { testMoMCalculation } from './utils/testMoM.js';

// Run the test
testMoMCalculation();
```

## Future Enhancements

1. **Trend Analysis**: Add trend lines and forecasting
2. **Market Comparison**: Compare MoM changes across markets
3. **Alert System**: Notify when compliance drops significantly
4. **Export Functionality**: Export MoM reports
5. **Custom Date Ranges**: Allow comparison with any previous period

## Setup Instructions

1. **Run Migration**: The compliance history table will be created automatically
2. **Environment Variables**: Ensure Supabase credentials are configured
3. **Initial Data**: The first month will show "N/A" until historical data is available

## Troubleshooting

### MoM Column Shows "N/A"
- **Cause**: No historical data available for the previous month
- **Solution**: Add data for the previous month or wait for next month's comparison

### Database Errors
- **Cause**: Supabase connection issues or missing permissions
- **Solution**: Check environment variables and database permissions

### Incorrect Calculations
- **Cause**: Data format issues or missing year/month information
- **Solution**: Ensure CSV data includes proper year/month fields 