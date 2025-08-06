# Data Quality Scoring System

## Overview

The Data Quality Scoring System measures how well the sum of filtered dimension data matches the total "All" data, identifying gaps in data completeness only. This system provides transparency about data completeness and helps users understand the reliability of insights generated from their data.

## Core Concept

The system focuses on one type of data quality issue:

### **Missing Data (Coverage Gap)**
- Records that exist in the "All" file but are completely absent from dimension-specific files
- These records disappear when filtering by dimension
- Usually indicates incomplete data delivery or processing issues

### **Note: Data Quality vs Data Completeness**
- **Dimension Coverage**: Purely mathematical - compares sum of dimension data vs "All" data
- **Onebuilder Compliance**: Handles data quality issues like "NOT MAPPED" values separately
- These are now completely separate systems with different purposes

## Calculation Framework

### 1. Core Metrics Analyzed
- **Media Cost** (25% weight) - Primary financial metric
- **Impressions** (20% weight) - Volume metric
- **Clicks** (15% weight) - Engagement metric
- **IV** (20% weight) - Intermediate conversion metric
- **NVWR** (20% weight) - Final conversion metric

### 2. Gap Calculation
```javascript
// Coverage Gap (Missing Data Only)
CoverageGap = 100 - (DimensionTotal / AllTotal) * 100

// Overall Score (100% coverage-based)
OverallScore = Σ((100 - CoverageGap) × MetricWeight)
```

### 3. Quality Grade System
- **A+ (95-100%)**: Excellent - High confidence in insights
- **A (90-94%)**: Good - Reliable insights with minor gaps
- **B (80-89%)**: Acceptable - Some data gaps, insights generally reliable
- **C (70-79%)**: Needs Attention - Significant gaps, insights may be affected
- **D (60-69%)**: Poor - Major data issues, insights unreliable
- **F (0-59%)**: Critical - Severe data problems, insights not recommended

## Implementation

### Data Quality Scorer (`src/utils/dataQualityScorer.js`)

#### Key Functions:

1. **`calculateDataQualityScore(allData, dimensionData, dimension)`**
   - Calculates quality score for a single dimension
   - Returns overall score, metric breakdown, and recommendations

2. **`calculateComprehensiveDataQuality(data, market, period)`**
   - Analyzes all dimensions for a market/period
   - Provides overall market quality assessment

3. **`generateQualityAwareInsight(insight, qualityData, dimension)`**
   - Adds confidence levels to insights based on data quality
   - Modifies insight titles to include quality context

4. **`integrateComplianceData(qualityData, complianceData)`**
   - Integrates Onebuilder compliance into quality scoring
   - Combines compliance issues with mapping gaps

### Data Quality & Compliance Dashboard (`src/components/DataQualityDashboard.jsx`)

#### Features:
- **Overall Quality Score**: Visual representation with grade and calculation explanation
- **Dimension Breakdown**: Individual dimension quality scores with gap details
- **Onebuilder Compliance**: Campaign naming standards and mapping compliance
- **Critical Issues**: High-priority data gaps requiring attention
- **Discrepancy Report**: Detailed analysis of missing and unmapped data
- **Recommended Actions**: Specific steps to improve data quality

## Visual Representation

### Quality Dashboard Card
```
┌─────────────────────────────────────┐
│ France - July 2025                  │
│ Overall Data Quality: 78.5% (C)     │
├─────────────────────────────────────┤
│ Dimension Quality:                  │
│ • Channel Name      ████████░░ 82% │
│   🔴 Missing: 8%  🟠 Not mapped: 10% │
│ • Channel Type      ████████░░ 85% │
│   🔴 Missing: 5%  🟠 Not mapped: 10% │
│ • Campaign Type     ████░░░░░░ 45% │
│   🔴 Missing: 35% 🟠 Not mapped: 20% │
│ • Model            █████████░ 92%  │
│   🔴 Missing: 3%  🟠 Not mapped: 5%  │
│ • Phase            ███████░░░ 73%  │
│   🔴 Missing: 17% 🟠 Not mapped: 10% │
├─────────────────────────────────────┤
│ ⚠️ Critical: 45 missing campaigns   │
│ ⚠️ Warning: €15K unmapped spend     │
└─────────────────────────────────────┘
```

### Quality-Aware Insights
Instead of: *"France shows 23% increase in NVWR driven by Social Networks"*

With quality awareness: *"France shows 23% increase in NVWR driven by Social Networks (85% data confidence - 8 missing items, 7 unmapped items). Actual performance may be higher."*

## Benefits

### 1. Transparency
- Users know exactly how complete their data is
- Clear visibility into data gaps and unmapped items

### 2. Actionable Insights
- Identifies specific gaps to fix in Datorama
- Provides concrete recommendations for improvement

### 3. Preventive Measures
- Helps improve data mapping over time
- Prevents future data quality issues

### 4. Trust Building
- Builds confidence in insights by acknowledging limitations
- Provides context for decision-making

### 5. Prioritization
- Focuses attention on most critical data gaps
- Helps allocate resources for data improvement

## Usage Examples

### Basic Quality Assessment
```javascript
import { calculateDataQualityScore } from './utils/dataQualityScorer.js';

const qualityScore = calculateDataQualityScore(allData, channelNameData, 'Channel Name');
console.log(`