import React, { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { fetchFRData } from '../../services/api';

// Register Chart.js components
Chart.register(...registerables);

const FRPerformanceChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Until the API is ready, use mock data
        // const data = await fetchFRData();
        const mockData = {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          salesData: [1200, 1900, 1700, 2100, 2400, 2800],
          leadData: [520, 680, 740, 890, 1100, 1350],
        };
        
        setChartData({
          labels: mockData.labels,
          datasets: [
            {
              label: 'Sales',
              data: mockData.salesData,
              borderColor: '#0066b1',
              backgroundColor: 'rgba(0, 102, 177, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Leads',
              data: mockData.leadData,
              borderColor: '#8cb4d6',
              backgroundColor: 'rgba(140, 180, 214, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
            },
          ],
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to load FR performance data:', err);
        setError('Failed to load performance data. Please try again later.');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Performance - France',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) return <div>Loading chart data...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="chart-container">
      <h3 className="chart-title">Monthly Performance</h3>
      <canvas ref={chartRef} />
    </div>
  );
};

export default FRPerformanceChart; 