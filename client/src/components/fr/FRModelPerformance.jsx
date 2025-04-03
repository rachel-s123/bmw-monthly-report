import { useState, useEffect } from 'react';
import { fetchFRData } from '../../services/api';

const FRModelPerformance = ({ month }) => {
  const [modelData, setModelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchFRData();
        
        if (data && data.modelPerformance) {
          // Filter out models with very low media spend for cleaner display
          const significantModels = data.modelPerformance
            .filter(model => model.mediaSpend > 1000)
            .slice(0, 10); // Get top 10
          
          setModelData(significantModels);
        } else {
          // Use mock data if API call fails or returns unexpected format
          const mockData = [
            { model: 'F 900 R (K83)', mediaSpend: 4632.96, impressions: 1064205, clicks: 11870, ctr: 0.0111, cpm: 4.35, cpc: 0.39, cpIv: 1.11 },
            { model: 'Brand', mediaSpend: 10455.71, impressions: 772740, clicks: 83788, ctr: 0.1084, cpm: 13.53, cpc: 0.12, cpIv: 1.07 },
            { model: 'F 900 XR (K84)', mediaSpend: 3216.73, impressions: 601633, clicks: 9212, ctr: 0.0153, cpm: 5.35, cpc: 0.35, cpIv: 0.75 },
            { model: 'F 800 GS (K80)', mediaSpend: 571.24, impressions: 70518, clicks: 1497, ctr: 0.0212, cpm: 8.10, cpc: 0.38, cpIv: 0.52 },
            { model: 'Generic', mediaSpend: 3738.76, impressions: 49799, clicks: 4367, ctr: 0.0877, cpm: 75.08, cpc: 0.86, cpIv: 0.79 },
            { model: 'R 1300 GS (KA1)', mediaSpend: 656.85, impressions: 14278, clicks: 2850, ctr: 0.1996, cpm: 46.00, cpc: 0.23, cpIv: 0.28 },
            { model: 'CE 04 (K07)', mediaSpend: 987.70, impressions: 9928, clicks: 1929, ctr: 0.1943, cpm: 99.49, cpc: 0.51, cpIv: 0.67 },
            { model: 'R 12 (KR3)', mediaSpend: 1026.16, impressions: 9053, clicks: 1655, ctr: 0.1828, cpm: 113.35, cpc: 0.62, cpIv: 0.82 }
          ];
          setModelData(mockData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load model performance data:', err);
        setError('Failed to load model performance data. Please try again later.');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) return <div>Loading model data...</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">
        Model Performance
        {month && <span className="month-subtitle"> - {month}</span>}
      </h3>
      
      <div className="model-performance-table">
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Media Spend</th>
              <th>CPM</th>
              <th>CTR</th>
              <th>CPC</th>
              <th>CP IV</th>
            </tr>
          </thead>
          <tbody>
            {modelData.map((model, index) => (
              <tr key={index}>
                <td>{model.model}</td>
                <td>{new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 2,
                  currencyDisplay: 'symbol'
                }).format(model.mediaSpend)}</td>
                <td>{new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 2,
                  currencyDisplay: 'symbol'
                }).format(model.cpm)}</td>
                <td>{(model.ctr * 100).toFixed(2)}%</td>
                <td>{new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 2,
                  currencyDisplay: 'symbol'
                }).format(model.cpc)}</td>
                <td>{new Intl.NumberFormat('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 2,
                  currencyDisplay: 'symbol'
                }).format(model.cpIv || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FRModelPerformance; 