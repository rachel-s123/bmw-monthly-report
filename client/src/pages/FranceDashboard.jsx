import { useState, useEffect } from 'react';
import FrancePerformanceChart from '../components/france/FrancePerformanceChart';
import FranceModelPerformance from '../components/france/FranceModelPerformance';
import { fetchFranceData } from '../services/api';
import '../styles/dashboard.css';

const FranceDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('MAR 2025');
  const [summaryData, setSummaryData] = useState({
    totalMediaSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    avgCTR: 0,
    avgCPM: 0,
    avgCPC: 0,
    avgCPIV: 0,
    avgCpNVWR: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch from API
        try {
          const data = await fetchFranceData();
          if (data && data.summary) {
            setSummaryData({
              totalMediaSpend: data.summary.totalMediaSpend,
              totalImpressions: data.summary.totalImpressions,
              totalClicks: data.summary.totalClicks,
              avgCTR: data.summary.avgCTR * 100,
              avgCPM: data.summary.avgCPM,
              avgCPC: data.summary.avgCPC,
              avgCPIV: data.summary.avgCPIV,
              avgCpNVWR: data.summary.avgCpNVWR
            });
            
            // Set current month from the API response
            if (data.month) {
              setCurrentMonth(data.month);
            }
            
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log('API data not available, using mock data');
        }
        
        // Use mock data if API fails
        setSummaryData({
          totalMediaSpend: 105452.83,
          totalImpressions: 21853319,
          totalClicks: 271878,
          avgCTR: 1.24,
          avgCPM: 4.83,
          avgCPC: 0.39,
          avgCPIV: 0.75,
          avgCpNVWR: 58.29
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading France dashboard data...</div>;
  }

  return (
    <div className="country-dashboard france-dashboard">
      <div className="dashboard-header-content">
        <h2>France Marketing Performance</h2>
        <div className="month-indicator">
          <span className="month-label">Data for:</span>
          <span className="month-value">{currentMonth}</span>
        </div>
      </div>
      
      <div className="summary-stats">
        <div className="stat-card">
          <h3>Media Spend</h3>
          <p className="stat-value">
            {new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 0,
              currencyDisplay: 'symbol'
            }).format(summaryData.totalMediaSpend)}
          </p>
        </div>
        <div className="stat-card">
          <h3>Avg. CPM</h3>
          <p className="stat-value">
            {new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 2,
              currencyDisplay: 'symbol'
            }).format(summaryData.avgCPM)}
          </p>
        </div>
        <div className="stat-card">
          <h3>Avg. CTR</h3>
          <p className="stat-value">{summaryData.avgCTR.toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <h3>Avg. CPC</h3>
          <p className="stat-value">
            {new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 2,
              currencyDisplay: 'symbol'
            }).format(summaryData.avgCPC)}
          </p>
        </div>
        <div className="stat-card">
          <h3>CP IV</h3>
          <p className="stat-value">
            {new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 2,
              currencyDisplay: 'symbol'
            }).format(summaryData.avgCPIV)}
          </p>
          <p className="metric-description">Cost per Interacting Visit</p>
        </div>
        <div className="stat-card">
          <h3>Cp NVWR</h3>
          <p className="stat-value">
            {new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 2,
              currencyDisplay: 'symbol'
            }).format(summaryData.avgCpNVWR)}
          </p>
          <p className="metric-description">Cost per New Vehicle Web Request</p>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <FrancePerformanceChart />
        <FranceModelPerformance month={currentMonth} />
        
        {/* Placeholder for other charts */}
        <div className="chart-container">
          <h3 className="chart-title">Regional Distribution</h3>
          <div className="placeholder-chart">
            Chart to be implemented
          </div>
        </div>
        
        <div className="chart-container">
          <h3 className="chart-title">Campaign Performance</h3>
          <div className="placeholder-chart">
            Chart to be implemented
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranceDashboard; 