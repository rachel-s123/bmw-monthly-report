/**
 * Dashboard Configuration
 * Contains configuration settings for all market dashboards
 */

const dashboardConfig = {
  countries: {
    fr: {
      name: "FR",
      code: "FR",
      currency: "EUR",
      currencySymbol: "€",
      currencyFormat: {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
        currencyDisplay: "symbol",
      },

      // Layout configuration
      metricLayout: "2x3",

      // Metrics to display in efficiency metrics grid
      efficiencyMetrics: [
        {
          id: "totalMediaSpend",
          name: "Media Spend",
          type: "currency",
          reversed: false,
        },
        { id: "avgCPM", name: "Avg. CPM", type: "currency", reversed: true },
        { id: "avgCPC", name: "Avg. CPC", type: "currency", reversed: true },
        { id: "avgCPIV", name: "CP IV", type: "currency", reversed: true },
        { id: "avgCpNVWR", name: "CP NVWR", type: "currency", reversed: true },
        { id: "avgCTR", name: "Avg. CTR", type: "percentage", reversed: false },
      ],

      // Metrics to display in impact metrics grid
      impactMetrics: [
        {
          id: "totalImpressions",
          name: "Impressions",
          type: "number",
          compact: true,
        },
        {
          id: "totalIV",
          name: "Interacting Visits (IV)",
          type: "number",
          compact: true,
        },
        {
          id: "validCpNVWRCount",
          name: "NVWRs",
          type: "number",
          compact: true,
        },
      ],

      // Charts to display
      charts: {
        monthlyTrends: { enabled: true },
        modelPerformance: { enabled: true },
        ctrCpmTrends: { enabled: true },
        spendDistribution: { enabled: true },
      },
    },

    pt: {
      name: "PT",
      code: "PT",
      currency: "EUR",
      currencySymbol: "€",
      currencyFormat: {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
        currencyDisplay: "symbol",
      },

      // Layout configuration (same as France for consistency)
      metricLayout: "2x3",

      // Metrics to display in efficiency metrics grid
      efficiencyMetrics: [
        {
          id: "totalMediaSpend",
          name: "Media Spend",
          type: "currency",
          reversed: false,
        },
        { id: "avgCPM", name: "Avg. CPM", type: "currency", reversed: true },
        { id: "avgCPC", name: "Avg. CPC", type: "currency", reversed: true },
        { id: "avgCPIV", name: "CP IV", type: "currency", reversed: true },
        { id: "avgCpNVWR", name: "CP NVWR", type: "currency", reversed: true },
        { id: "avgCTR", name: "Avg. CTR", type: "percentage", reversed: false },
      ],

      // Metrics to display in impact metrics grid
      impactMetrics: [
        {
          id: "totalImpressions",
          name: "Impressions",
          type: "number",
          compact: true,
        },
        {
          id: "totalIV",
          name: "Interacting Visits (IV)",
          type: "number",
          compact: true,
        },
        {
          id: "validCpNVWRCount",
          name: "NVWRs",
          type: "number",
          compact: true,
        },
      ],

      // Charts to display
      charts: {
        monthlyTrends: { enabled: true },
        modelPerformance: { enabled: true },
        ctrCpmTrends: { enabled: true },
        spendDistribution: { enabled: true },
      },
    },
  },
};

export default dashboardConfig;
