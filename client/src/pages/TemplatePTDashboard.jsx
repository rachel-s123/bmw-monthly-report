import React from 'react';
import BaseMarketDashboard from '../components/BaseMarketDashboard';
import dashboardConfig from '../config/dashboardConfig';

/**
 * Template-based PT Dashboard component
 * Uses the BaseMarketDashboard with PT-specific configuration
 */
const TemplatePTDashboard = (props) => {
  return (
    <BaseMarketDashboard
      config={dashboardConfig.countries.pt}
      {...props}
    />
  );
};

export default TemplatePTDashboard; 