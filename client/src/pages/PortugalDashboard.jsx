import { useState, useEffect } from 'react';
import { fetchPortugalData } from '../services/api';
import { generateMarketSummary } from '../services/aiService';
import ReactMarkdown from 'react-markdown';
import '../styles/dashboard.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const PortugalDashboard = () => {
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
        
        const data = await fetchPortugalData();
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
        
        // Update summary when data is loaded
        updateSummary();
        
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

  const toggleMonthSelector = () => {
    setShowMonthSelector(!showMonthSelector);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setViewingYTD(false);
    setShowMonthSelector(false);
    
    // Update model data when month changes
    if (monthlyData[month]?.models) {
      const models = Object.entries(monthlyData[month].models)
        .map(([name, stats]) => {
          let displayName = name;
          if (name.includes('(')) {
            const [modelName, code] = name.split('(');
            displayName = modelName.trim();
          }
          
          return {
            name: displayName,
            fullName: name,
            mediaSpend: stats.mediaSpend || 0,
            impressions: stats.impressions || 0,
            clicks: stats.clicks || 0,
            iv: stats.iv || 0,
          };
        })
        .sort((a, b) => b.mediaSpend - a.mediaSpend);
      
      setModelData(models.slice(0, 7));
      updateSummary();
    }
  };

  const handleYTDToggle = () => {
    setViewingYTD(true);
    setShowMonthSelector(false);
    
    // Update model data for YTD view
    if (ytdData.models) {
      const models = Object.entries(ytdData.models)
        .map(([name, stats]) => {
          let displayName = name;
          if (name.includes('(')) {
            const [modelName, code] = name.split('(');
            displayName = modelName.trim();
          }
          
          return {
            name: displayName,
            fullName: name,
            mediaSpend: stats.mediaSpend || 0,
            impressions: stats.impressions || 0,
            clicks: stats.clicks || 0,
            iv: stats.iv || 0,
          };
        })
        .sort((a, b) => b.mediaSpend - a.mediaSpend);
      
      setModelData(models.slice(0, 7));
      updateSummary();
    }
  };

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
      const summary = await generateMarketSummary(marketData, timeframe, "Portugal");
      setSummaryInsights(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryInsights('# Summary Not Available');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format large numbers
  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (isLoading) {
    return <div className="loading">Loading Portugal data...</div>;
  }

  const currentData = viewingYTD ? ytdData : monthlyData[selectedMonth];
  
  // Prepare data for top models chart
  const modelPerformanceData = modelData.map(model => ({
    name: model.name,
    mediaSpend: model.mediaSpend
  }));

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Portugal Market Performance</h2>
        <div className="time-controls">
          <button onClick={toggleMonthSelector} className={!viewingYTD ? 'active' : ''}>
            {selectedMonth || 'Select Month'}
          </button>
          <button onClick={handleYTDToggle} className={viewingYTD ? 'active' : ''}>
            Year to Date
          </button>
          
          {showMonthSelector && (
            <div className="month-selector">
              {availableMonths.map(month => (
                <button 
                  key={month} 
                  onClick={() => handleMonthChange(month)}
                  className={month === selectedMonth ? 'active' : ''}
                >
                  {month}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="metrics-section">
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-title">Media Spend</span>
              <div className="metric-value">{formatCurrency(currentData.totalMediaSpend)}</div>
            </div>
            <div className="metric-card">
              <span className="metric-title">Impressions</span>
              <div className="metric-value">{formatNumber(currentData.totalImpressions)}</div>
            </div>
            <div className="metric-card">
              <span className="metric-title">Clicks</span>
              <div className="metric-value">{formatNumber(currentData.totalClicks)}</div>
            </div>
            <div className="metric-card">
              <span className="metric-title">IV (Information Visits)</span>
              <div className="metric-value">{formatNumber(currentData.totalIV)}</div>
            </div>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-title">CTR</span>
              <div className="metric-value">{formatPercentage(currentData.avgCTR)}</div>
            </div>
            <div className="metric-card">
              <span className="metric-title">CPM</span>
              <div className="metric-value">{formatCurrency(currentData.avgCPM)}</div>
            </div>
            <div className="metric-card">
              <span className="metric-title">CPC</span>
              <div className="metric-value">{formatCurrency(currentData.avgCPC)}</div>
            </div>
            <div className="metric-card">
              <span className="metric-title">CP IV</span>
              <div className="metric-value">{formatCurrency(currentData.avgCPIV)}</div>
            </div>
          </div>
        </div>
        
        <div className="charts-section">
          <div className="chart-container">
            <h3>Media Spend by Model</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={modelPerformanceData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="mediaSpend" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={monthlyTrends}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === 'mediaSpend') return formatCurrency(value);
                  if (name === 'impressions') return `${value.toFixed(1)}M`;
                  if (name === 'clicks') return `${value.toFixed(1)}K`;
                  if (name === 'ctr') return `${value.toFixed(2)}%`;
                  if (name === 'cpm') return formatCurrency(value);
                  return value;
                }} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="mediaSpend" 
                  stroke="#8884d8" 
                  name="Media Spend" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="#82ca9d" 
                  name="Impressions (M)" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#ffc658" 
                  name="Clicks (K)" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="insights-section">
          <div className="markdown-content">
            {isSummaryLoading ? (
              <div className="loading">Generating insights...</div>
            ) : (
              <ReactMarkdown>{summaryInsights}</ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortugalDashboard; 