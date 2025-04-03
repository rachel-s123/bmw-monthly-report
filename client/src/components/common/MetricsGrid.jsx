import React from 'react';
import '../../styles/dashboard.css';

/**
 * MetricsGrid Component
 * Displays a grid of metric cards with configurable layout
 * 
 * @param {Object} props
 * @param {Array} props.metrics - Array of metric objects to display
 * @param {Object} props.data - Data object containing values for the metrics
 * @param {Object} props.previousData - Previous period data for comparison (optional)
 * @param {string} props.layout - Layout format (e.g., "2x3" for 2 rows of 3 columns)
 * @param {boolean} props.showComparison - Whether to show comparison indicators
 */
const MetricsGrid = ({ 
  metrics, 
  data, 
  previousData, 
  layout = "2x3", 
  showComparison = true,
  countryConfig
}) => {
  // Parse layout string (e.g., "2x3" -> { rows: 2, cols: 3 })
  const [rows, cols] = layout.split('x').map(num => parseInt(num, 10));
  
  // Function to calculate percentage change
  const getChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Custom style based on layout
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, auto)`,
    gap: '1rem',
    marginBottom: '1.5rem'
  };

  // Function to format value based on metric type
  const formatValue = (value, metric) => {
    if (!value && value !== 0) return '-';
    
    if (metric.type === 'currency') {
      // Use country-specific currency formatting
      return new Intl.NumberFormat('fr-FR', countryConfig.currencyFormat)
        .format(value || 0);
    }
    
    if (metric.type === 'percentage') {
      return `${((value || 0) * 100).toFixed(2)}%`;
    }
    
    if (metric.type === 'number' && metric.compact) {
      return new Intl.NumberFormat('fr-FR', { 
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 0
      }).format(value || 0);
    }
    
    return new Intl.NumberFormat('fr-FR').format(value || 0);
  };

  return (
    <div className="metrics-grid" style={gridStyle}>
      {metrics.map((metric, index) => (
        <div className={`stat-card ${metric.id === 'totalMediaSpend' ? 'media-spend-card' : ''}`} key={metric.id}>
          <h3>{metric.name}</h3>
          <p className="stat-value">
            {formatValue(data[metric.id], metric)}
          </p>
          {showComparison && previousData && (
            <p className={`change-indicator ${
              getChange(data[metric.id], previousData[metric.id]) >= 0 
                ? (metric.reversed ? 'positive-reversed' : 'positive') 
                : (metric.reversed ? 'negative-reversed' : 'negative')
            }`}>
              {getChange(data[metric.id], previousData[metric.id])}%
              <span className="mom-label">MoM</span>
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default MetricsGrid; 