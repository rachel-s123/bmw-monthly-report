import React from 'react';
import ReactMarkdown from 'react-markdown';
import '../../styles/dashboard.css';

/**
 * SummarySection Component
 * Displays AI-generated insights about market performance
 * 
 * @param {Object} props
 * @param {string} props.insights - Markdown-formatted insights text
 * @param {boolean} props.isLoading - Whether insights are currently loading
 */
const SummarySection = ({ insights, isLoading }) => {
  return (
    <div className="summary-section">
      {isLoading ? (
        <div className="loading-insights">Loading market insights...</div>
      ) : (
        <div className="market-insights">
          <ReactMarkdown>{insights}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default SummarySection; 