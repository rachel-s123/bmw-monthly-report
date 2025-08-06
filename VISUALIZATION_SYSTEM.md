# Dynamic Visualization System

## Overview

The BMW Monthly Report Dashboard now features a **dynamic visualization system** that automatically adapts charts and visualizations based on the selected filters (market and month). This system ensures users see the most relevant and insightful visualizations for their current data view.

## How It Works

### 1. Visualization Context Detection

The system automatically detects the visualization context based on filter combinations:

- **Single Market, Single Month**: Detailed analysis for specific market and month
- **All Markets, Single Month**: Market comparison for the selected month
- **Single Market, All Months**: Performance trends over time for the selected market
- **All Markets, All Months**: Complete overview across all markets and time periods

### 2. Dynamic Chart Selection

Based on the detected context, the system automatically shows the most relevant charts:

#### Context 1: Single Market, Single Month
- Channel Distribution Chart
- Conversion Funnel Chart
- Month-over-Month Comparison
- KPI Summary Cards

#### Context 2: All Markets, Single Month
- Market Performance Comparison
- Channel Distribution Chart
- Conversion Funnel Chart
- Market Performance Table

#### Context 3: Single Market, All Months
- KPI Trends Over Time (Line Chart)
- Monthly Comparison
- Channel Trends
- Performance Summary

#### Context 4: All Markets, All Months
- Overall Summary
- Market Overview
- Monthly Overview
- Performance Heatmap

### 3. Smart Data Preparation

Each chart type has specialized data preparation functions:

- **Channel Distribution**: Aggregates data by channel type with spend and NVWR metrics
- **Funnel Chart**: Creates conversion funnel from impressions → clicks → leads → NVWR
- **KPI Trends**: Prepares time-series data for trend analysis
- **Market Comparison**: Aggregates data by market for comparison
- **MoM Comparison**: Calculates month-over-month changes using historical data

## Key Features

### 🎯 **Context-Aware Visualizations**
- Charts automatically adapt to filter selections
- No manual chart switching required
- Always shows the most relevant insights

### 📊 **Multiple Chart Types**
- **Bar Charts**: For distribution and comparison data
- **Line Charts**: For trend analysis over time
- **Funnel Charts**: For conversion flow visualization
- **Comparison Charts**: For MoM analysis
- **Summary Cards**: For key metrics overview

### 🔄 **Real-Time Updates**
- Charts update automatically when filters change
- Historical data integration for MoM comparisons
- Responsive design for all screen sizes

### 🎨 **Consistent Styling**
- BMW brand colors and styling
- Professional, clean design
- Interactive tooltips and legends

## Technical Implementation

### Core Files

1. **`src/utils/visualizationContext.js`**
   - Context detection logic
   - Chart configuration management
   - Data preparation functions

2. **`src/components/DynamicChart.jsx`**
   - Reusable chart components
   - Multiple chart type support
   - Responsive design

3. **`src/components/EnhancedTrendAnalysis.jsx`**
   - Main visualization container
   - Context-aware chart rendering
   - Historical data integration

### Chart Library

Uses **Recharts** for professional, interactive charts:
- Responsive design
- Rich interactivity
- Customizable styling
- Excellent performance

## Usage Examples

### Example 1: Single Market Analysis
```
Filter: BE Market, July 2025
Shows: Channel distribution, funnel chart, MoM comparison, KPI summary
```

### Example 2: Market Comparison
```
Filter: All Markets, July 2025
Shows: Market comparison chart, channel distribution, funnel chart
```

### Example 3: Trend Analysis
```
Filter: BE Market, All Months
Shows: KPI trends over time, monthly comparison, channel trends
```

## Benefits

1. **User Experience**: No need to manually select charts - they appear automatically
2. **Relevance**: Always shows the most appropriate visualizations for the current view
3. **Insights**: Helps users discover patterns they might miss with static charts
4. **Efficiency**: Reduces cognitive load by showing only relevant information
5. **Scalability**: Easy to add new chart types and contexts

## Future Enhancements

- Interactive chart filters within charts
- Drill-down capabilities
- Export functionality
- Custom chart configurations
- Advanced analytics integration 