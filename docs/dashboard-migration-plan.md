# BMW Marketing Dashboard Migration Plan

## Objective

Create a template-driven dashboard system that ensures consistency across all markets while enabling easy expansion to new countries.

## Phase 1: Create the Template Framework

1. **Create Base Dashboard Component**

   - Copy FranceDashboard.jsx to BaseMarketDashboard.jsx
   - Remove France-specific code and references
   - Add props for country, metrics, and configuration
   - Implement data loading via country parameter

2. **Define Dashboard Configuration Schema**

   - Create `dashboardConfig.js` with country-specific settings:

   ```javascript
   {
     countries: {
       france: {
         name: "France",
         currency: "EUR",
         metricLayout: "2x3",
         availableMetrics: ["CPM", "CPC", "CTR", "CPIV", "CPNVWR"],
         defaultCharts: ["modelPerformance", "trendAnalysis"],
         // other settings
       },
       portugal: { ... },
       // other countries
     }
   }
   ```

3. **Extract Reusable Components**
   - Create components folder with:
     - `MetricsGrid.jsx` (supports different layouts)
     - `SummarySection.jsx`
     - `ModelPerformance.jsx`
     - `ChartContainer.jsx`
     - `MonthSelector.jsx`

## Phase 2: Implement the France Template

4. **Create France Configuration**

   - Define France-specific settings in configuration
   - Include current layout, metrics, and chart settings

5. **Create New FranceDashboard Using Template**

   - Create new template-based component:

   ```jsx
   import BaseMarketDashboard from "../components/BaseMarketDashboard";
   import { countryConfig } from "../config/dashboardConfig";

   const FranceDashboard = (props) => (
     <BaseMarketDashboard config={countryConfig.france} {...props} />
   );

   export default FranceDashboard;
   ```

6. **Verify & Test France Dashboard**
   - Ensure all functionality works as before
   - Test responsiveness on different devices
   - Fix any template-related issues

## Phase 3: Migrate Portugal Dashboard

7. **Create Portugal Configuration**

   - Define Portugal configuration using same schema
   - Match France's 2x3 metrics layout
   - Use same component structure

8. **Implement New Portugal Dashboard**

   - Create Portugal dashboard using same template
   - Replace current implementation with new template-based version

9. **Test Portugal Dashboard**
   - Verify metrics display correctly
   - Ensure API calls use correct country parameter
   - Validate all features work properly

## Phase 4: Prepare for Scale

10. **Create Market Selector**

    - Add dropdown to easily switch between markets
    - Implement routing based on selected market
    - Ensure URL structure includes country parameter

11. **Establish New Market Process**

    - Document step-by-step process for adding new markets:
      1. Add country configuration to config file
      2. Create country-specific component using template
      3. Add to routing and market selector
      4. Test with actual data

12. **Create Market Dashboard Factory**
    - Optional: Create a factory function that generates market dashboards:
    ```jsx
    const MarketDashboard = ({ country, ...props }) => {
      const config = countryConfig[country.toLowerCase()];
      return <BaseMarketDashboard config={config} {...props} />;
    };
    ```

## Phase 5: Rollout Additional Markets

13. **Add First New Market**

    - Select the next highest priority market
    - Create configuration following established pattern
    - Implement using the template
    - Test thoroughly

14. **Review & Optimize**

    - Identify any issues from first new market
    - Refine template and process as needed
    - Document any special cases or exceptions

15. **Roll Out Remaining Markets**
    - Add remaining markets one by one
    - Use configuration to handle any market-specific requirements
    - Maintain visual and functional consistency

## Benefits

- **Consistency**: All markets will share the same UI patterns and functionality
- **Maintainability**: Changes to core components apply to all markets automatically
- **Scalability**: Adding new markets requires minimal effort
- **Flexibility**: Country-specific customizations possible through configuration

## Technical Implementation Details

### Configuration Properties

The country configuration should include:

- **Basic Settings**
  - Country name
  - Currency code and formatting options
  - Date format preferences
- **Layout Settings**
  - Impact metrics layout
  - Efficiency metrics layout
  - Default charts to display
- **Data Settings**
  - Default metrics to display
  - Country-specific KPIs
  - Target thresholds for metrics
- **UI Settings**
  - Language/localization settings
  - Theme colors (if applicable)
  - Default view (monthly/YTD)

### API Architecture

- Standardize API endpoints to accept country parameter
- Ensure consistent data structure for all markets
- Implement data transformation layer if needed for legacy data
