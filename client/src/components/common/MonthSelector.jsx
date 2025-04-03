import React, { useState } from 'react';
import '../../styles/dashboard.css';

/**
 * MonthSelector Component
 * Dropdown for selecting month or YTD view
 * 
 * @param {Object} props
 * @param {string} props.selectedMonth - Currently selected month
 * @param {Array} props.availableMonths - List of available months to select from
 * @param {boolean} props.viewingYTD - Whether YTD view is selected
 * @param {Function} props.onMonthChange - Callback when month selection changes
 */
const MonthSelector = ({ 
  selectedMonth, 
  availableMonths, 
  viewingYTD, 
  onMonthChange 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  
  const handleMonthSelect = (month) => {
    if (month === 'YTD') {
      onMonthChange('YTD');
    } else {
      onMonthChange(month);
    }
    setShowDropdown(false);
  };
  
  return (
    <div className="month-selector-container">
      <div className="selected-month" onClick={toggleDropdown}>
        <span className="month-label">Data for:</span>
        <span className="month-value">{viewingYTD ? 'YTD' : selectedMonth}</span>
        <span className="dropdown-arrow">▼</span>
      </div>
      
      {showDropdown && (
        <div className="month-selector-dropdown">
          {availableMonths.map(month => (
            <div 
              key={month} 
              className={`month-option ${!viewingYTD && month === selectedMonth ? 'active' : ''}`}
              onClick={() => handleMonthSelect(month)}
            >
              {month}
            </div>
          ))}
          <div 
            className={`month-option ${viewingYTD ? 'active' : ''}`}
            onClick={() => handleMonthSelect('YTD')}
          >
            YTD
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthSelector; 