import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

import MonthSelector from './common/MonthSelector';
import MetricsGrid from './common/MetricsGrid';
import SummarySection from './common/SummarySection';
import { generateMarketSummary } from '../services/aiService';

// Default colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

/**
 * BaseMarketDashboard Component
 * Template component for all market dashboards
 * 
 * @param {Object} props
 * @param {Object} props.config - Country configuration object
 */
const BaseMarketDashboard = ({ config }) => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({});
  const [ytdData, setYtdData] = useState({});
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewingYTD, setViewingYTD] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [summaryInsights, setSummaryInsights] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [modelData, setModelData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  // Load market data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching data for country: ${config.code}`);
        
        // Implement API fetch with the country code parameter
        const response = await fetch(`/api/market-data/${config.code.toLowerCase()}`);
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to load ${config.name} data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received data structure:', Object.keys(data));
        
        // Parse the data from the aggregated format
        if (data.months) {
          // Format monthly data
          const formattedMonthlyData = {};
          
          Object.entries(data.months).forEach(([month, monthData]) => {
            formattedMonthlyData[month] = {
              totalMediaSpend: monthData.totalMediaSpend || 0,
              totalImpressions: monthData.totalImpressions || 0,
              totalClicks: monthData.totalClicks || 0,
              totalIV: monthData.totalIV || 0,
              validCpNVWRCount: monthData.validCpNVWRCount || 0,
              avgCTR: monthData.avgCTR || 0,
              avgCPM: monthData.avgCPM || 0,
              avgCPC: monthData.avgCPC || 0,
              avgCPIV: monthData.avgCPIV || 0,
              avgCpNVWR: monthData.avgCpNVWR || 0,
              models: monthData.models || {}
            };
          });
          
          setMonthlyData(formattedMonthlyData);
          
          // Set available months
          const months = Object.keys(formattedMonthlyData).sort();
          console.log('Available months:', months);
          setAvailableMonths(months);
          
          if (months.length > 0) {
            setSelectedMonth(months[months.length - 1]);
          }
          
          // Format YTD data
          const ytdData = {
            totalMediaSpend: data.yearToDateTotals?.mediaSpend || 0,
            totalImpressions: data.yearToDateTotals?.impressions || 0,
            totalClicks: data.yearToDateTotals?.clicks || 0,
            totalIV: data.yearToDateTotals?.iv || 0,
            validCpNVWRCount: data.yearToDateTotals?.nvwr || 0,
            avgCTR: data.yearToDateAverages?.ctr || 0,
            avgCPM: data.yearToDateAverages?.cpm || 0,
            avgCPC: data.yearToDateAverages?.cpc || 0,
            avgCPIV: data.yearToDateAverages?.cpIv || 0,
            avgCpNVWR: data.yearToDateAverages?.cpNvwr || 0,
            models: {}
          };
          
          // Add models for YTD view
          if (data.models) {
            Object.entries(data.models).forEach(([name, stats]) => {
              ytdData.models[name] = {
                mediaSpend: stats.totalMediaSpend || 0,
                impressions: stats.totalImpressions || 0,
                clicks: stats.totalClicks || 0,
                iv: stats.totalIV || 0
              };
            });
          }
          
          console.log('Formatted YTD data:', ytdData);
          setYtdData(ytdData);
        } else {
          console.warn('Invalid data format - no months property found');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error(`Error loading ${config.name} data:`, error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [config.name, config.code]);

  // Update dashboard when month selection changes
  useEffect(() => {
    if (isLoading || (!monthlyData && !ytdData)) return;
    
    // Prepare model data for the selected month
    const prepareModelData = () => {
      if (viewingYTD) {
        if (!ytdData.models) return [];
        
        return Object.entries(ytdData.models)
          .map(([name, data]) => ({
            name: name.length > 10 ? name.substring(0, 10) + '...' : name,
            fullName: name,
            mediaSpend: data.mediaSpend || 0,
            impressions: data.impressions || 0,
            clicks: data.clicks || 0
          }))
          .sort((a, b) => b.mediaSpend - a.mediaSpend)
          .slice(0, 5);
      } else {
        const monthData = monthlyData[selectedMonth];
        if (!monthData || !monthData.models) return [];
        
        return Object.entries(monthData.models)
          .map(([name, data]) => ({
            name: name.length > 10 ? name.substring(0, 10) + '...' : name,
            fullName: name,
            mediaSpend: data.mediaSpend || 0,
            impressions: data.impressions || 0,
            clicks: data.clicks || 0
          }))
          .sort((a, b) => b.mediaSpend - a.mediaSpend)
          .slice(0, 5);
      }
    };
    
    // Prepare monthly trends data
    const prepareMonthlyTrends = () => {
      return availableMonths.map(month => {
        const data = monthlyData[month];
        return {
          name: month,
          mediaSpend: data.totalMediaSpend || 0,
          impressions: data.totalImpressions ? data.totalImpressions / 1000000 : 0,
          clicks: data.totalClicks ? data.totalClicks / 1000 : 0,
          ctr: data.avgCTR ? data.avgCTR * 100 : 0,
          cpm: data.avgCPM || 0
        };
      });
    };
    
    setModelData(prepareModelData());
    setMonthlyTrends(prepareMonthlyTrends());
    
    // Generate market summary
    updateSummary();
  }, [selectedMonth, viewingYTD, isLoading, monthlyData, ytdData, availableMonths]);
  
  // Function to update the AI-generated summary
  const updateSummary = async () => {
    if (isLoading) return;
    
    try {
      setIsSummaryLoading(true);
      
      let marketData;
      let timeframe;
      
      if (viewingYTD) {
        // Format YTD data for the AI service
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
          models: ytdData.models || {}
        };
        timeframe = 'Year-to-Date';
      } else {
        const currentMonthData = monthlyData[selectedMonth];
        if (!currentMonthData) {
          setSummaryInsights('# Summary Not Available');
          setIsSummaryLoading(false);
          return;
        }
        
        // Format monthly data for the AI service
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
          models: currentMonthData.models || {}
        };
        timeframe = selectedMonth;
      }
      
      console.log(`Generating summary for ${config.code}, timeframe: ${timeframe}`);
      console.log('Market data for AI:', marketData);
      
      // Generate summary insights
      const summary = await generateMarketSummary(
        marketData, 
        timeframe, 
        config.code
      );
      
      setSummaryInsights(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryInsights('# Summary Not Available');
    } finally {
      setIsSummaryLoading(false);
    }
  };
  
  // Function to handle month change
  const handleMonthChange = (month) => {
    if (month === 'YTD') {
      setViewingYTD(true);
    } else {
      setViewingYTD(false);
      setSelectedMonth(month);
    }
    setShowMonthSelector(false);
  };
  
  // Toggle month selector dropdown
  const toggleMonthSelector = () => {
    setShowMonthSelector(!showMonthSelector);
  };
  
  // Function to calculate percentage change
  const getChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };
  
  if (isLoading) {
    return <div className="loading">Loading {config.name} dashboard data...</div>;
  }
  
  const currentMonthData = viewingYTD ? ytdData : monthlyData[selectedMonth] || {};
  const previousMonthIndex = availableMonths.indexOf(selectedMonth) - 1;
  const previousMonth = previousMonthIndex >= 0 ? availableMonths[previousMonthIndex] : null;
  const previousMonthData = previousMonth ? monthlyData[previousMonth] : null;
  
  return (
    <div className={`country-dashboard ${config.code.toLowerCase()}-dashboard`}>
      <div className="dashboard-content">
        <div className="top-controls">
          <MonthSelector 
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            viewingYTD={viewingYTD}
            onMonthChange={handleMonthChange}
          />
        </div>
        
        {/* Summary Section */}
        <SummarySection 
          insights={summaryInsights}
          isLoading={isSummaryLoading}
        />
      
        <h3 className="section-title">Impact Metrics</h3>
        <MetricsGrid 
          metrics={config.impactMetrics}
          data={currentMonthData}
          previousData={!viewingYTD ? previousMonthData : null}
          showComparison={!viewingYTD && previousMonthData}
          countryConfig={config}
        />
        
        <h3 className="section-title">Efficiency Metrics</h3>
        <MetricsGrid 
          metrics={config.efficiencyMetrics}
          data={currentMonthData}
          previousData={!viewingYTD ? previousMonthData : null}
          showComparison={!viewingYTD && previousMonthData}
          layout={config.metricLayout}
          countryConfig={config}
        />
        
        {!viewingYTD && config.charts && (
          <div className="dashboard-grid">
            {/* Monthly Trends Chart */}
            {config.charts.monthlyTrends?.enabled && (
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
                      if (name === 'mediaSpend') return [`${config.currencySymbol}${value.toLocaleString()}`, 'Media Spend'];
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
            )}
            
            {/* Model Performance Chart */}
            {config.charts.modelPerformance?.enabled && (
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
                      formatter={(value, name, props) => [
                        `${config.currencySymbol}${value.toLocaleString()}`, 
                        props.payload.fullName || 'Media Spend'
                      ]} 
                    />
                    <Legend />
                    <Bar dataKey="mediaSpend" fill="#1D6EB7" name="Media Spend" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* CTR & CPM Trends Chart */}
            {config.charts.ctrCpmTrends?.enabled && (
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
                    <Line yAxisId="right" type="monotone" dataKey="cpm" stroke="#82ca9d" name={`CPM (${config.currencySymbol})`} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Media Spend Distribution Chart */}
            {config.charts.spendDistribution?.enabled && (
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
                        `${config.currencySymbol}${value.toLocaleString()}`, 
                        props.payload.fullName || props.payload.name
                      ]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseMarketDashboard; 