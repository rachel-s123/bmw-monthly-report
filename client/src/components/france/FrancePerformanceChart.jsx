import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchFranceData } from '../../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FrancePerformanceChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Until the API is ready, use mock data
        // const data = await fetchFranceData();
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
        console.error('Failed to load France performance data:', err);
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
      <Line data={chartData} options={options} />
    </div>
  );
};

export default FrancePerformanceChart; 