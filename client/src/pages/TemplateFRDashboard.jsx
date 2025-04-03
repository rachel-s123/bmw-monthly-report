import React from 'react';
import BaseMarketDashboard from '../components/BaseMarketDashboard';
import dashboardConfig from '../config/dashboardConfig';

/**
 * Template-based FR Dashboard component
 * Uses the BaseMarketDashboard with FR-specific configuration
 */
const TemplateFRDashboard = (props) => {
  return (
    <BaseMarketDashboard
      config={dashboardConfig.countries.fr}
      {...props}
    />
  );
};

export default TemplateFRDashboard; 