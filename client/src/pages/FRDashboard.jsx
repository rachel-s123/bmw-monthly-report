import { useState, useEffect } from 'react';
import { fetchFRData } from '../services/api';
import { generateMarketSummary } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import '../styles/dashboard.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const FRDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({});
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [ytdData, setYtdData] = useState({});
  const [modelData, setModelData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [viewingYTD, setViewingYTD] = useState(false);
  const [summaryInsights, setSummaryInsights] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6B6B'];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const data = await fetchFRData();
        if (!data || !data.months) {
          throw new Error('Invalid data format received');
        }

        // Process monthly data
        const months = Object.keys(data.months).sort((a, b) => {
          // Sort months chronologically
          const [monthA, yearA] = a.split('-');
          const [monthB, yearB] = b.split('-');
          return yearA === yearB 
            ? monthOrder[monthA] - monthOrder[monthB]
            : yearA - yearB;
        });
        
        // Validate and set monthly data
        const validatedMonthlyData = {};
        for (const month of months) {
          const monthData = data.months[month];
          validatedMonthlyData[month] = {
            ...monthData,
            totalIV: monthData.totalIV || 0,
            validCpNVWRCount: monthData.validCpNVWRCount || 0,
            totalMediaSpend: monthData.totalMediaSpend || 0,
            totalImpressions: monthData.totalImpressions || 0,
            totalClicks: monthData.totalClicks || 0,
            avgCTR: monthData.avgCTR || 0,
            avgCPM: monthData.avgCPM || 0,
            avgCPC: monthData.avgCPC || 0,
            avgCPIV: monthData.avgCPIV || 0,
            avgCpNVWR: monthData.avgCpNVWR || 0
          };
        }
        
        setAvailableMonths(months);
        setMonthlyData(validatedMonthlyData);
        
        // Process YTD data correctly
        const ytdTotals = data.yearToDateTotals || {};
        const ytdAverages = data.yearToDateAverages || {};
        
        const ytdData = {
          totalMediaSpend: ytdTotals.mediaSpend || 0,
          totalImpressions: ytdTotals.impressions || 0,
          totalClicks: ytdTotals.clicks || 0,
          totalIV: ytdTotals.iv || 0,
          validCpNVWRCount: ytdTotals.nvwr || 0,
          avgCTR: ytdAverages.ctr || 0,
          avgCPM: ytdAverages.cpm || 0,
          avgCPC: ytdAverages.cpc || 0,
          avgCPIV: ytdAverages.cpIv || 0,
          avgCpNVWR: ytdAverages.cpNvwr || 0,
          // Add top models for YTD view
          models: {}
        };
        
        // Extract top models from the yearly data
        if (data.models) {
          const topModels = Object.entries(data.models)
            .map(([name, stats]) => ({
              name,
              mediaSpend: stats.totalMediaSpend || 0,
              impressions: stats.totalImpressions || 0,
              clicks: stats.totalClicks || 0,
              iv: stats.totalIV || 0
            }))
            .sort((a, b) => b.mediaSpend - a.mediaSpend)
            .slice(0, 10);
            
          topModels.forEach(model => {
            ytdData.models[model.name] = {
              mediaSpend: model.mediaSpend,
              impressions: model.impressions,
              clicks: model.clicks,
              iv: model.iv
            };
          });
        }
        
        console.log('YTD Data:', ytdData);
        setYtdData(ytdData);
        
        // Set latest month as selected
        if (months.length > 0) {
          setSelectedMonth(months[months.length - 1]);
        }
        
        // Extract model data
        const models = Object.entries(data.months[months[months.length - 1]]?.models || {})
          .map(([name, stats]) => {
            // Format model name to be more readable
            let displayName = name;
            if (name.includes('(')) {
              const [modelName, code] = name.split('(');
              displayName = modelName.trim();  // Use just the model name without the code
            }
            
            return {
              name: displayName,
              fullName: name, // Keep the full name for tooltips
              mediaSpend: stats.mediaSpend || 0,
              impressions: stats.impressions || 0,
              clicks: stats.clicks || 0,
              iv: stats.iv || 0,
            };
          })
          .sort((a, b) => b.mediaSpend - a.mediaSpend);
        
        setModelData(models.slice(0, 7)); // Limit to top 7 models for better display
        
        // Create monthly trends data
        const trends = months.map(month => ({
          name: month,
          mediaSpend: validatedMonthlyData[month].totalMediaSpend,
          impressions: validatedMonthlyData[month].totalImpressions / 1000000, // Convert to millions
          clicks: validatedMonthlyData[month].totalClicks / 1000, // Convert to thousands
          ctr: validatedMonthlyData[month].avgCTR * 100, // Convert to percentage
          cpm: validatedMonthlyData[month].avgCPM
        }));
        
        setMonthlyTrends(trends);
        
        // Load summary insights
        try {
          setIsSummaryLoading(true);
          // In the future, this will make an API call to generate insights
          // using the marketSummary prompt
          setSummaryInsights('Loading market insights...');
          setIsSummaryLoading(false);
        } catch (err) {
          console.error('Failed to load summary insights:', err);
          setSummaryInsights('Unable to load market insights at this time.');
          setIsSummaryLoading(false);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Month order for sorting
  const monthOrder = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12
  };

  // Helper to calculate month-over-month change
  const getChange = (current, previous) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  // Debug data function
  const logMonthData = () => {
    if (selectedMonth) {
      console.log('Selected Month:', selectedMonth);
      console.log('Raw Month Data:', monthlyData[selectedMonth]);
      console.log('Current Month Data Object:', {
        totalIV: monthlyData[selectedMonth]?.totalIV,
        validCpNVWRCount: monthlyData[selectedMonth]?.validCpNVWRCount,
        totalMediaSpend: monthlyData[selectedMonth]?.totalMediaSpend,
        totalImpressions: monthlyData[selectedMonth]?.totalImpressions
      });
    }
    if (viewingYTD) {
      console.log('YTD Data:', ytdData);
    }
  };

  // Toggle month selector
  const toggleMonthSelector = () => {
    setShowMonthSelector(!showMonthSelector);
    // Log data whenever month selector is toggled
    logMonthData();
  };

  // Change selected month
  const handleMonthChange = (month) => {
    if (month === 'YTD') {
      setViewingYTD(true);
    } else {
      setViewingYTD(false);
      setSelectedMonth(month);
    }
    setShowMonthSelector(false);
    // Log data after month change
    setTimeout(logMonthData, 0);
  };

  // For updating summary when month changes
  useEffect(() => {
    const updateSummary = async () => {
      setIsSummaryLoading(true);
      try {
        // Get the relevant data based on viewing mode (month or YTD)
        let marketData;
        let timeframe;
        
        if (viewingYTD) {
          marketData = {
            totalMediaSpend: ytdData.totalMediaSpend,
            totalImpressions: ytdData.totalImpressions,
            totalClicks: ytdData.totalClicks,
            totalIV: ytdData.totalIV,
            weightedCTR: ytdData.avgCTR,
            weightedCPM: ytdData.avgCPM,
            weightedCPC: ytdData.avgCPC,
            weightedCPIV: ytdData.avgCPIV,
            weightedCpNVWR: ytdData.avgCpNVWR,
            models: ytdData.models
          };
          timeframe = "Year-to-Date";
        } else {
          const currentMonthData = monthlyData[selectedMonth];
          if (!currentMonthData) {
            setSummaryInsights('# Summary Not Available');
            setIsSummaryLoading(false);
            return;
          }
          
          marketData = {
            totalMediaSpend: currentMonthData.totalMediaSpend,
            totalImpressions: currentMonthData.totalImpressions,
            totalClicks: currentMonthData.totalClicks,
            totalIV: currentMonthData.totalIV,
            weightedCTR: currentMonthData.avgCTR,
            weightedCPM: currentMonthData.avgCPM,
            weightedCPC: currentMonthData.avgCPC,
            weightedCPIV: currentMonthData.avgCPIV,
            weightedCpNVWR: currentMonthData.avgCpNVWR,
            models: currentMonthData.models
          };
          timeframe = selectedMonth;
        }
        
        // Generate summary insights
        const summary = await generateMarketSummary(marketData, timeframe, "FR");
        setSummaryInsights(summary);
      } catch (error) {
        console.error('Error generating summary:', error);
        setSummaryInsights('# Summary Not Available');
      } finally {
        setIsSummaryLoading(false);
      }
    };
    
    updateSummary();
  }, [selectedMonth, viewingYTD, isLoading, monthlyData, ytdData]);

  if (isLoading) {
    return <div className="loading">Loading FR dashboard data...</div>;
  }

  const currentMonthData = viewingYTD ? ytdData : monthlyData[selectedMonth] || {};
  const previousMonthIndex = availableMonths.indexOf(selectedMonth) - 1;
  const previousMonth = previousMonthIndex >= 0 ? availableMonths[previousMonthIndex] : null;
  const previousMonthData = previousMonth ? monthlyData[previousMonth] : null;
  
  // Log data for debugging
  console.log('Selected Month:', selectedMonth);
  console.log('Current Month Data:', currentMonthData);
  console.log('Is YTD View:', viewingYTD);
  
  // Check if totalIV exists
  if (currentMonthData && !currentMonthData.totalIV) {
    console.warn('totalIV not found in current month data');
  }
  
  // Check if validCpNVWRCount exists
  if (currentMonthData && !currentMonthData.validCpNVWRCount) {
    console.warn('validCpNVWRCount not found in current month data');
  }
  
  return (
    <div className="country-dashboard fr-dashboard">
      <div className="dashboard-content">
        <div className="top-controls">
          <div className="month-selector-container">
            <div className="selected-month" onClick={toggleMonthSelector}>
              <span className="month-label">Data for:</span>
              <span className="month-value">{viewingYTD ? 'YTD' : selectedMonth}</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {showMonthSelector && (
              <div className="month-selector-dropdown">
                {availableMonths.map(month => (
                  <div 
                    key={month} 
                    className={`month-option ${!viewingYTD && month === selectedMonth ? 'active' : ''}`}
                    onClick={() => handleMonthChange(month)}
                  >
                    {month}
                  </div>
                ))}
                <div 
                  className={`month-option ${viewingYTD ? 'active' : ''}`}
                  onClick={() => handleMonthChange('YTD')}
                >
                  YTD
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Summary Section (without title) */}
        <div className="summary-section">
          {isSummaryLoading ? (
            <div className="loading-insights">Loading market insights...</div>
          ) : (
            <div className="market-insights">
              <ReactMarkdown>{summaryInsights}</ReactMarkdown>
            </div>
          )}
        </div>
      
        <h3 className="section-title">Impact Metrics</h3>
        <div className="summary-stats">
          <div className="stat-card">
            <h3>Impressions</h3>
            <p className="stat-value">
              {new Intl.NumberFormat('fr-FR', { 
                notation: "compact",
                compactDisplay: "short",
                maximumFractionDigits: 0
              }).format(currentMonthData.totalImpressions || 0)}
            </p>
            {!viewingYTD && previousMonthData && (
              <p className={`change-indicator ${getChange(currentMonthData.totalImpressions, previousMonthData.totalImpressions) >= 0 ? 'positive' : 'negative'}`}>
                {getChange(currentMonthData.totalImpressions, previousMonthData.totalImpressions)}%
                <span className="mom-label">MoM</span>
              </p>
            )}
          </div>
          <div className="stat-card">
            <h3>Interacting Visits (IV)</h3>
            <p className="stat-value">
              {(() => {
                const value = viewingYTD ? ytdData.totalIV : monthlyData[selectedMonth]?.totalIV;
                console.log('Rendering IV value:', value);
                return new Intl.NumberFormat('fr-FR', { 
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 0
                }).format(value || 0);
              })()}
            </p>
            {!viewingYTD && previousMonthData && (
              <p className={`change-indicator ${getChange(monthlyData[selectedMonth]?.totalIV, previousMonthData.totalIV) >= 0 ? 'positive' : 'negative'}`}>
                {getChange(monthlyData[selectedMonth]?.totalIV, previousMonthData.totalIV)}%
                <span className="mom-label">MoM</span>
              </p>
            )}
          </div>
          <div className="stat-card">
            <h3>NVWRs</h3>
            <p className="stat-value">
              {(() => {
                const value = viewingYTD ? ytdData.validCpNVWRCount : monthlyData[selectedMonth]?.validCpNVWRCount;
                console.log('Rendering NVWR value:', value);
                return new Intl.NumberFormat('fr-FR', { 
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 0
                }).format(value || 0);
              })()}
            </p>
            {!viewingYTD && previousMonthData && (
              <p className={`change-indicator ${getChange(monthlyData[selectedMonth]?.validCpNVWRCount, previousMonthData.validCpNVWRCount) >= 0 ? 'positive' : 'negative'}`}>
                {getChange(monthlyData[selectedMonth]?.validCpNVWRCount, previousMonthData.validCpNVWRCount)}%
                <span className="mom-label">MoM</span>
              </p>
            )}
          </div>
        </div>
        
        <h3 className="section-title">Efficiency Metrics</h3>
        <div className="metrics-grid">
          <div className="stat-card media-spend-card">
            <h3>Media Spend</h3>
            <p className="stat-value">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR',
                maximumFractionDigits: 0,
                currencyDisplay: 'symbol'
              }).format(currentMonthData.totalMediaSpend || 0)}
            </p>
            {!viewingYTD && previousMonthData && (
              <p className={`change-indicator ${getChange(currentMonthData.totalMediaSpend, previousMonthData.totalMediaSpend) >= 0 ? 'positive' : 'negative'}`}>
                {getChange(currentMonthData.totalMediaSpend, previousMonthData.totalMediaSpend)}%
                <span className="mom-label">MoM</span>
              </p>
            )}
          </div>
          <div className="stat-card">
            <h3>Avg. CPM</h3>
            <p className="stat-value">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR',
                maximumFractionDigits: 2,
                currencyDisplay: 'symbol'
              }).format(currentMonthData.avgCPM || 0)}
            </p>
            {!viewingYTD && previousMonthData && (
              <p className={`change-indicator ${getChange(currentMonthData.avgCPM, previousMonthData.avgCPM) >= 0 ? 'positive-reversed' : 'negative-reversed'}`}>
                {getChange(currentMonthData.avgCPM, previousMonthData.avgCPM)}%
                <span className="mom-label">MoM</span>
              </p>
            )}
          </div>
          <div className="stat-card">
            <h3>Avg. CPC</h3>
            <p className="stat-value">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR',
                maximumFractionDigits: 2,
                currencyDisplay: 'symbol'
              }).format(currentMonthData.avgCPC || 0)}
            </p>
            {!viewingYTD && previousMonthData && (
              <p className={`change-indicator ${getChange(currentMonthData.avgCPC, previousMonthData.avgCPC) >= 0 ? 'positive-reversed' : 'negative-reversed'}`}>
                {getChange(currentMonthData.avgCPC, previousMonthData.avgCPC)}%
                <span className="mom-label">MoM</span>
              </p>
            )}
          </div>
          <div className="stat-card">
            <h3>CP IV</h3>
            <p className="stat-value">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR',
                maximumFractionDigits: 2,
                currencyDisplay: 'symbol'
              }).format(currentMonthData.avgCPIV || 0)}
            </p>
            {!viewingYTD && previousMonthData && (
              <p className={`change-indicator ${getChange(currentMonthData.avgCPIV, previousMonthData.avgCPIV) >= 0 ? 'positive-reversed' : 'negative-reversed'}`}>
                {getChange(currentMonthData.avgCPIV, previousMonthData.avgCPIV)}%
                <span className="mom-label">MoM</span>
              </p>
            )}
          </div>
          <div className="stat-card">
            <h3>CP NVWR</h3>
            <p className="stat-value">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR',
                maximumFractionDigits: 2,
                currencyDisplay: 'symbol'
              }).format(currentMonthData.avgCpNVWR || 0)}
            </p>
            {!viewingYTD && previousMonthData && (
              <p className={`change-indicator ${getChange(currentMonthData.avgCpNVWR, previousMonthData.avgCpNVWR) >= 0 ? 'positive-reversed' : 'negative-reversed'}`}>
                {getChange(currentMonthData.avgCpNVWR, previousMonthData.avgCpNVWR)}%
                <span className="mom-label">MoM</span>
              </p>
            )}
          </div>
          <div className="stat-card">
            <h3>Avg. CTR</h3>
            <p className="stat-value">{((currentMonthData.avgCTR || 0) * 100).toFixed(2)}%</p>
            {!viewingYTD && previousMonthData && (
              <p className={`change-indicator ${getChange(currentMonthData.avgCTR, previousMonthData.avgCTR) >= 0 ? 'positive' : 'negative'}`}>
                {getChange(currentMonthData.avgCTR, previousMonthData.avgCTR)}%
                <span className="mom-label">MoM</span>
              </p>
            )}
          </div>
        </div>
        
        {!viewingYTD && (
          <div className="dashboard-grid">
            {/* Monthly Trends Chart */}
            <div className="chart-container">
              <h3 className="chart-title">Monthly Performance Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={monthlyTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'mediaSpend') return [`€${value.toLocaleString()}`, 'Media Spend'];
                    if (name === 'impressions') return [`${value}M`, 'Impressions'];
                    if (name === 'clicks') return [`${value}K`, 'Clicks'];
                    return [value, name];
                  }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="mediaSpend" stroke="#1D6EB7" activeDot={{ r: 8 }} name="Media Spend" />
                  <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#82ca9d" name="Impressions (M)" />
                  <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#ffc658" name="Clicks (K)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Model Performance Chart */}
            <div className="chart-container">
              <h3 className="chart-title">Top Models by Media Spend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={modelData} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 14 }}
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [`€${value.toLocaleString()}`, props.payload.fullName || 'Media Spend']} 
                  />
                  <Legend />
                  <Bar dataKey="mediaSpend" fill="#1D6EB7" name="Media Spend" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Click-Through Rate Comparison */}
            <div className="chart-container">
              <h3 className="chart-title">CTR & CPM Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={monthlyTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="ctr" stroke="#8884d8" name="CTR (%)" />
                  <Line yAxisId="right" type="monotone" dataKey="cpm" stroke="#82ca9d" name="CPM (€)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Media Spend Distribution */}
            <div className="chart-container">
              <h3 className="chart-title">Media Spend Distribution by Model</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={modelData.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="mediaSpend"
                  >
                    {modelData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `€${value.toLocaleString()}`, 
                      props.payload.fullName || props.payload.name
                    ]} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FRDashboard; 